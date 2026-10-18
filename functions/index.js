const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { onUserCreated, onUserDeleted } = require('firebase-functions/v2/identity');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { gradeAnswers } = require('./lib/quiz-grading');

initializeApp();

const firestore = getFirestore();
const allowedRoles = new Set(['student', 'teacher', 'admin']);
const idPattern = /^[A-Za-z0-9_-]{1,100}$/;
const verificationPrefix = 'CWU-';

function invalidArgument(message) {
  throw new HttpsError('invalid-argument', message);
}

function callable(handler) {
  return onCall({ enforceAppCheck: true }, handler);
}

function requireAuth(request, requireVerifiedEmail = true) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.');
  if (requireVerifiedEmail && request.auth.token.email_verified !== true) {
    throw new HttpsError('failed-precondition', 'Verify your email address to continue.');
  }
  return request.auth.uid;
}

function requireRole(request, roles) {
  const uid = requireAuth(request);
  const role = request.auth.token.role;
  if (!roles.includes(role)) throw new HttpsError('permission-denied', 'You are not authorized to perform this action.');
  return { uid, role };
}

function requireObject(value, label = 'Request') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalidArgument(`${label} must be an object.`);
  }
  return value;
}

function requireOnlyKeys(value, allowed, label = 'Request') {
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extra.length) invalidArgument(`${label} contains unsupported fields.`);
}

function requireId(value, label) {
  if (typeof value !== 'string' || !idPattern.test(value)) {
    invalidArgument(`${label} is invalid.`);
  }
  return value;
}

function requireCertificateId(value) {
  if (typeof value !== 'string' || !/^CWU-[A-F0-9]{32}$/.test(value)) {
    invalidArgument('Certificate ID is invalid.');
  }
  return value;
}

function requireVerificationCode(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(value)) {
    invalidArgument('Verification code is invalid.');
  }
  return value;
}

function requireText(value, label, maxLength, { optional = false, minLength = 1 } = {}) {
  if (optional && value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim().length < minLength || value.trim().length > maxLength) {
    invalidArgument(`${label} must be between ${minLength} and ${maxLength} characters.`);
  }
  return value.trim();
}

function requireHttpsUrl(value, label, { optional = false } = {}) {
  if (optional && value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > 2048) invalidArgument(`${label} must be a valid HTTPS URL.`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    invalidArgument(`${label} must be a valid HTTPS URL.`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    invalidArgument(`${label} must be a valid HTTPS URL.`);
  }
  return parsed.toString();
}

function requireInteger(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    invalidArgument(`${label} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function asPlainCourse(courseId, data) {
  return {
    id: courseId,
    title: data.title,
    slug: data.slug,
    description: data.description,
    category: data.category,
    level: data.level,
    duration: data.duration,
    instructor: typeof data.instructorName === 'string' && data.instructorName.trim()
      ? data.instructorName.trim()
      : 'CWU instructional team',
    thumbnail: data.thumbnail || null,
    status: data.status,
    price: data.price,
    currency: data.currency || null
  };
}

function asPublishedLesson(lessonId, data) {
  return {
    id: lessonId,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    content: typeof data.content === 'string' ? data.content : '',
    videoUrl: typeof data.videoUrl === 'string' && data.videoUrl.startsWith('https://')
      ? data.videoUrl
      : null,
    materialUrl: typeof data.materialUrl === 'string' && data.materialUrl.startsWith('https://')
      ? data.materialUrl
      : null,
    order: Number.isInteger(data.order) ? data.order : 0,
    duration: typeof data.duration === 'string' ? data.duration : ''
  };
}

async function getEnrolledCourse(uid, courseId) {
  const courseRef = firestore.collection('courses').doc(courseId);
  const enrollmentRef = firestore.collection('enrollments').doc(`${uid}_${courseId}`);
  const [courseSnapshot, enrollmentSnapshot] = await Promise.all([courseRef.get(), enrollmentRef.get()]);
  if (!courseSnapshot.exists || courseSnapshot.data().status !== 'published') {
    throw new HttpsError('not-found', 'Course is unavailable.');
  }
  if (!enrollmentSnapshot.exists || !['active', 'completed'].includes(enrollmentSnapshot.data().status)) {
    throw new HttpsError('permission-denied', 'An active course enrollment is required.');
  }
  return { courseRef, course: courseSnapshot.data(), enrollmentRef, enrollment: enrollmentSnapshot.data() };
}

function isAssignedTeacher(course, uid) {
  return Array.isArray(course.teacherIds) && course.teacherIds.includes(uid);
}

function recordAudit(action, actorUid, targetId, details = {}) {
  return firestore.collection('auditLogs').add({
    action,
    actorUid,
    targetId,
    details,
    createdAt: FieldValue.serverTimestamp()
  });
}

function normalizeQuestions(questions) {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) {
    invalidArgument('A quiz must contain between 1 and 100 questions.');
  }
  return questions.map((question, index) => {
    requireObject(question, `Question ${index + 1}`);
    requireOnlyKeys(question, ['id', 'question', 'options', 'correctIndex', 'explanation'], `Question ${index + 1}`);
    const id = question.id === undefined ? `q${index + 1}` : requireId(question.id, `Question ${index + 1} ID`);
    const prompt = requireText(question.question, `Question ${index + 1}`, 2000);
    if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 10) {
      invalidArgument(`Question ${index + 1} must have between 2 and 10 options.`);
    }
    const options = question.options.map((option, optionIndex) => (
      requireText(option, `Question ${index + 1} option ${optionIndex + 1}`, 500)
    ));
    const correctIndex = requireInteger(question.correctIndex, `Question ${index + 1} answer`, 0, options.length - 1);
    const explanation = question.explanation === undefined
      ? ''
      : requireText(question.explanation, `Question ${index + 1} explanation`, 2000, { optional: true });
    return { id, question: prompt, options, correctIndex, explanation };
  });
}

exports.createUserProfile = onUserCreated(async (event) => {
  const user = event.data;
  const auth = getAuth();
  const role = allowedRoles.has(user.customClaims && user.customClaims.role)
    ? user.customClaims.role
    : 'student';

  if (role !== (user.customClaims && user.customClaims.role)) {
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      role
    });
  }

  const profileRef = firestore.collection('users').doc(user.uid);
  await firestore.runTransaction(async (transaction) => {
    const profile = await transaction.get(profileRef);
    if (profile.exists) return;

    transaction.create(profileRef, {
      uid: user.uid,
      name: user.displayName || '',
      displayName: user.displayName || '',
      email: user.email || '',
      emailVerified: Boolean(user.emailVerified),
      photoURL: user.photoURL || '',
      role,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });
});

exports.deleteUserProfile = onUserDeleted(async (event) => {
  await firestore.collection('users').doc(event.data.uid).delete();
});

exports.syncCurrentUserProfile = callable(async (request) => {
  const uid = requireAuth(request, false);
  const auth = getAuth();
  const user = await auth.getUser(uid);
  let role = user.customClaims && user.customClaims.role;

  if (!allowedRoles.has(role)) {
    role = 'student';
    await auth.setCustomUserClaims(uid, {
      ...user.customClaims,
      role
    });
  }

  const profileRef = firestore.collection('users').doc(uid);
  await firestore.runTransaction(async (transaction) => {
    const profile = await transaction.get(profileRef);
    const synchronizedFields = {
      uid,
      name: user.displayName || '',
      displayName: user.displayName || '',
      email: user.email || '',
      emailVerified: Boolean(user.emailVerified),
      photoURL: user.photoURL || '',
      role,
      updatedAt: FieldValue.serverTimestamp()
    };

    if (profile.exists) {
      transaction.update(profileRef, synchronizedFields);
      return;
    }

    transaction.create(profileRef, {
      ...synchronizedFields,
      status: 'active',
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { synchronized: true };
});

exports.getCurrentUserAccess = callable(async (request) => {
  const uid = requireAuth(request);
  const role = allowedRoles.has(request.auth.token.role) ? request.auth.token.role : 'student';
  return { uid, role };
});

exports.listPublishedCourses = callable(async (request) => {
  const snapshot = await firestore.collection('courses')
    .where('status', '==', 'published')
    .get();
  let enrollmentStatuses = new Map();
  if (request.auth && request.auth.token.email_verified === true) {
    const enrollments = await firestore.collection('enrollments')
      .where('studentId', '==', request.auth.uid)
      .get();
    enrollmentStatuses = new Map(enrollments.docs.map((document) => [
      document.data().courseId,
      document.data().status
    ]));
  }
  return {
    courses: snapshot.docs.map((course) => ({
      ...asPlainCourse(course.id, course.data()),
      enrollmentStatus: enrollmentStatuses.get(course.id) || null
    }))
  };
});

exports.getStudentDashboard = callable(async (request) => {
  const uid = requireAuth(request);
  const [enrollments, progress, attempts, certificates] = await Promise.all([
    firestore.collection('enrollments').where('studentId', '==', uid).get(),
    firestore.collection('progress').where('studentId', '==', uid).get(),
    firestore.collection('quizAttempts').where('studentId', '==', uid).get(),
    firestore.collection('certificates').where('studentId', '==', uid).get()
  ]);

  return {
    enrollments: enrollments.docs.map((document) => {
      const data = document.data();
      return {
        courseId: data.courseId,
        status: data.status,
        enrolledAt: data.enrolledAt && data.enrolledAt.toMillis ? data.enrolledAt.toMillis() : null,
        completedAt: data.completedAt && data.completedAt.toMillis ? data.completedAt.toMillis() : null
      };
    }),
    progress: progress.docs.map((document) => {
      const data = document.data();
      return {
        courseId: data.courseId,
        lessonId: data.lessonId,
        acknowledged: data.acknowledged === true,
        acknowledgedAt: data.acknowledgedAt && data.acknowledgedAt.toMillis
          ? data.acknowledgedAt.toMillis()
          : null
      };
    }),
    quizAttempts: attempts.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        courseId: data.courseId,
        quizId: data.quizId,
        status: data.status,
        score: data.status === 'submitted' ? data.score : null,
        questionCount: data.status === 'submitted' ? data.questionCount : null,
        percentage: data.status === 'submitted' ? data.percentage : null,
        passed: data.status === 'submitted' ? data.passed === true : null,
        submittedAt: data.submittedAt && data.submittedAt.toMillis ? data.submittedAt.toMillis() : null
      };
    }),
    certificates: certificates.docs.map((document) => {
      const data = document.data();
      return {
        certificateId: data.certificateId,
        courseId: data.courseId,
        courseName: data.courseName,
        status: data.status,
        issuedAt: data.issuedAt && data.issuedAt.toMillis ? data.issuedAt.toMillis() : null
      };
    })
  };
});

exports.listTeacherCourses = callable(async (request) => {
  const { uid, role } = requireRole(request, ['teacher', 'admin']);
  const query = role === 'admin'
    ? firestore.collection('courses')
    : firestore.collection('courses').where('teacherIds', 'array-contains', uid);
  const courses = await query.get();
  return {
    courses: courses.docs.map((document) => asPlainCourse(document.id, document.data()))
  };
});

exports.listCourseEnrollmentsForTeacher = callable(async (request) => {
  const { uid } = requireRole(request, ['teacher', 'admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const course = await courseRef.get();
  if (!course.exists) throw new HttpsError('not-found', 'Course is unavailable.');
  if (request.auth.token.role !== 'admin' && !isAssignedTeacher(course.data(), uid)) {
    throw new HttpsError('permission-denied', 'You are not assigned to this course.');
  }
  const enrollments = await firestore.collection('enrollments')
    .where('courseId', '==', courseId)
    .get();
  return {
    enrollments: enrollments.docs.map((document) => {
      const enrollment = document.data();
      return {
        studentId: enrollment.studentId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt && enrollment.enrolledAt.toMillis
          ? enrollment.enrolledAt.toMillis()
          : null,
        completedAt: enrollment.completedAt && enrollment.completedAt.toMillis
          ? enrollment.completedAt.toMillis()
          : null
      };
    })
  };
});

exports.teacherGetCourseContent = callable(async (request) => {
  const { uid, role } = requireRole(request, ['teacher', 'admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const courseSnapshot = await courseRef.get();
  if (!courseSnapshot.exists) throw new HttpsError('not-found', 'Course is unavailable.');
  if (role !== 'admin' && !isAssignedTeacher(courseSnapshot.data(), uid)) {
    throw new HttpsError('permission-denied', 'You are not assigned to this course.');
  }
  const [lessons, quizzes] = await Promise.all([
    courseRef.collection('lessons').get(),
    courseRef.collection('quizzes').get()
  ]);
  const serializeManagedDocument = (document) => {
    const { updatedAt, createdAt, ...fields } = document.data();
    return {
      id: document.id,
      ...fields,
      updatedAt: updatedAt && updatedAt.toMillis ? updatedAt.toMillis() : null,
      createdAt: createdAt && createdAt.toMillis ? createdAt.toMillis() : null
    };
  };
  return {
    course: asPlainCourse(courseId, courseSnapshot.data()),
    adminSettings: role === 'admin'
      ? {
        instructorId: courseSnapshot.data().instructorId || null,
        teacherIds: Array.isArray(courseSnapshot.data().teacherIds) ? courseSnapshot.data().teacherIds : [],
        requiredQuizIds: Array.isArray(courseSnapshot.data().requiredQuizIds)
          ? courseSnapshot.data().requiredQuizIds
          : []
      }
      : null,
    lessons: lessons.docs.map(serializeManagedDocument),
    quizzes: quizzes.docs.map(serializeManagedDocument)
  };
});

exports.getEnrolledCourseContent = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const { course } = await getEnrolledCourse(uid, courseId);
  const snapshot = await firestore.collection('courses').doc(courseId)
    .collection('lessons').where('status', '==', 'published').get();
  const lessons = snapshot.docs.map((lesson) => asPublishedLesson(lesson.id, lesson.data()))
    .sort((first, second) => first.order - second.order);
  return { course: asPlainCourse(courseId, course), lessons };
});

exports.listEnrolledCourseQuizzes = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId']);
  const courseId = requireId(data.courseId, 'Course ID');
  await getEnrolledCourse(uid, courseId);
  const snapshot = await firestore.collection('courses').doc(courseId)
    .collection('quizzes').where('status', '==', 'published').get();
  return {
    quizzes: snapshot.docs.map((document) => ({
      id: document.id,
      title: typeof document.data().title === 'string' ? document.data().title : 'Course quiz',
      maxAttempts: Number.isInteger(document.data().maxAttempts) ? document.data().maxAttempts : 3
    }))
  };
});

exports.enrollInCourse = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const enrollmentRef = firestore.collection('enrollments').doc(`${uid}_${courseId}`);

  const enrollment = await firestore.runTransaction(async (transaction) => {
    const [courseSnapshot, enrollmentSnapshot] = await Promise.all([
      transaction.get(courseRef),
      transaction.get(enrollmentRef)
    ]);
    if (!courseSnapshot.exists || courseSnapshot.data().status !== 'published') {
      throw new HttpsError('not-found', 'Course is unavailable.');
    }
    const course = courseSnapshot.data();
    if (typeof course.price !== 'number' || course.price < 0) {
      throw new HttpsError('failed-precondition', 'Course pricing is not configured.');
    }
    if (course.price > 0) {
      throw new HttpsError('failed-precondition', 'Payment is currently unavailable.');
    }
    if (enrollmentSnapshot.exists) {
      const existing = enrollmentSnapshot.data();
      if (['active', 'completed'].includes(existing.status)) return existing;
      if (existing.status !== 'cancelled') {
        throw new HttpsError('failed-precondition', 'An enrollment request already exists.');
      }
      transaction.update(enrollmentRef, {
        status: 'active',
        updatedAt: FieldValue.serverTimestamp()
      });
      return { studentId: uid, courseId, status: 'active' };
    }

    const created = {
      studentId: uid,
      courseId,
      status: 'active',
      enrolledAt: FieldValue.serverTimestamp(),
      completedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    transaction.create(enrollmentRef, created);
    return { studentId: uid, courseId, status: 'active' };
  });

  return { enrollment };
});

exports.updateLessonProgress = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId', 'lessonId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const lessonId = requireId(data.lessonId, 'Lesson ID');

  const enrollmentRef = firestore.collection('enrollments').doc(`${uid}_${courseId}`);
  const courseRef = firestore.collection('courses').doc(courseId);
  const lessonRef = courseRef.collection('lessons').doc(lessonId);
  const progressRef = firestore.collection('progress').doc(`${uid}_${courseId}_${lessonId}`);

  await firestore.runTransaction(async (transaction) => {
    const [enrollment, course, lesson] = await Promise.all([
      transaction.get(enrollmentRef),
      transaction.get(courseRef),
      transaction.get(lessonRef)
    ]);
    if (!enrollment.exists || !['active', 'completed'].includes(enrollment.data().status)
      || !course.exists || course.data().status !== 'published'
      || !lesson.exists || lesson.data().status !== 'published') {
      throw new HttpsError('permission-denied', 'An active enrollment and published lesson are required.');
    }
    transaction.set(progressRef, {
      studentId: uid,
      courseId,
      lessonId,
      acknowledged: true,
      acknowledgedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return { acknowledged: true };
});

exports.startQuizAttempt = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId', 'quizId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const quizId = requireId(data.quizId, 'Quiz ID');
  const enrollmentRef = firestore.collection('enrollments').doc(`${uid}_${courseId}`);
  const courseRef = firestore.collection('courses').doc(courseId);
  const quizRef = courseRef.collection('quizzes').doc(quizId);
  const attemptsQuery = firestore.collection('quizAttempts')
    .where('studentId', '==', uid)
    .where('courseId', '==', courseId)
    .where('quizId', '==', quizId);
  const counterId = crypto.createHash('sha256')
    .update(`${uid}\0${courseId}\0${quizId}`)
    .digest('hex');
  const counterRef = firestore.collection('quizAttemptCounters').doc(counterId);
  const attemptRef = firestore.collection('quizAttempts').doc();

  const attempt = await firestore.runTransaction(async (transaction) => {
    const [priorAttempts, currentEnrollment, currentCourse, currentQuiz, counterSnapshot] = await Promise.all([
      transaction.get(attemptsQuery),
      transaction.get(enrollmentRef),
      transaction.get(courseRef),
      transaction.get(quizRef),
      transaction.get(counterRef)
    ]);
    if (!currentEnrollment.exists || !['active', 'completed'].includes(currentEnrollment.data().status)
      || !currentCourse.exists || currentCourse.data().status !== 'published'
      || !currentQuiz.exists || currentQuiz.data().status !== 'published') {
      throw new HttpsError('failed-precondition', 'Course or quiz access is no longer available.');
    }
    const quiz = currentQuiz.data();
    const questions = normalizeQuestions(quiz.questions);
    const maxAttempts = Number.isInteger(quiz.maxAttempts) ? quiz.maxAttempts : 3;
    const durationSeconds = Number.isInteger(quiz.durationSeconds)
      ? Math.min(Math.max(quiz.durationSeconds, 60), 10800)
      : 1800;
    const priorCount = counterSnapshot.exists && Number.isInteger(counterSnapshot.data().attemptCount)
      ? counterSnapshot.data().attemptCount
      : 0;
    if (Math.max(priorAttempts.size, priorCount) >= maxAttempts) {
      throw new HttpsError('resource-exhausted', 'The maximum number of quiz attempts has been reached.');
    }
    const startedAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(startedAt.toMillis() + durationSeconds * 1000);
    transaction.create(attemptRef, {
      studentId: uid,
      courseId,
      quizId,
      status: 'started',
      questionCount: questions.length,
      passPercentage: Number.isInteger(quiz.passPercentage) ? quiz.passPercentage : 70,
      quizUpdatedAt: quiz.updatedAt || null,
      gradingSnapshot: questions.map(({ id, correctIndex, options }) => ({
        id,
        correctIndex,
        optionCount: options.length
      })),
      startedAt,
      expiresAt,
      createdAt: FieldValue.serverTimestamp()
    });
    if (counterSnapshot.exists) {
      transaction.update(counterRef, {
        attemptCount: Math.max(priorAttempts.size, priorCount) + 1,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      transaction.create(counterRef, {
        attemptCount: Math.max(priorAttempts.size, priorCount) + 1,
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    return {
      expiresAt,
      quizVersion: quiz.updatedAt && quiz.updatedAt.toMillis ? quiz.updatedAt.toMillis() : null,
      questions: questions.map(({ id, question, options }) => ({ id, question, options }))
    };
  });

  return {
    attemptId: attemptRef.id,
    expiresAt: attempt.expiresAt.toMillis(),
    quizVersion: attempt.quizVersion,
    questions: attempt.questions
  };
});

exports.submitQuizAttempt = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['attemptId', 'answers']);
  const attemptId = requireId(data.attemptId, 'Attempt ID');
  if (!Array.isArray(data.answers) || data.answers.length > 100
    || data.answers.some((answer) => !Number.isInteger(answer) || answer < 0 || answer > 9)) {
    invalidArgument('Answers must be a list of valid option indexes.');
  }
  const attemptRef = firestore.collection('quizAttempts').doc(attemptId);

  const result = await firestore.runTransaction(async (transaction) => {
    const attemptSnapshot = await transaction.get(attemptRef);
    if (!attemptSnapshot.exists || attemptSnapshot.data().studentId !== uid) {
      throw new HttpsError('not-found', 'Quiz attempt is unavailable.');
    }
    const attempt = attemptSnapshot.data();
    if (attempt.status !== 'started') {
      throw new HttpsError('failed-precondition', 'This quiz attempt has already been submitted or closed.');
    }
    if (attempt.expiresAt.toMillis() <= Date.now()) {
      transaction.update(attemptRef, {
        status: 'expired',
        submittedAt: FieldValue.serverTimestamp()
      });
      return { expired: true };
    }
    const enrollmentRef = firestore.collection('enrollments').doc(`${uid}_${attempt.courseId}`);
    const courseRef = firestore.collection('courses').doc(attempt.courseId);
    const quizRef = courseRef.collection('quizzes').doc(attempt.quizId);
    const [enrollment, course, quizSnapshot] = await Promise.all([
      transaction.get(enrollmentRef),
      transaction.get(courseRef),
      transaction.get(quizRef)
    ]);
    const quiz = quizSnapshot.exists ? quizSnapshot.data() : null;
    const attemptQuizUpdatedAt = attempt.quizUpdatedAt && attempt.quizUpdatedAt.toMillis
      ? attempt.quizUpdatedAt.toMillis()
      : null;
    const currentQuizUpdatedAt = quiz && quiz.updatedAt && quiz.updatedAt.toMillis
      ? quiz.updatedAt.toMillis()
      : null;
    if (!enrollment.exists || !['active', 'completed'].includes(enrollment.data().status)
      || !course.exists || course.data().status !== 'published'
      || !quiz || quiz.status !== 'published'
      || attemptQuizUpdatedAt !== currentQuizUpdatedAt) {
      throw new HttpsError('permission-denied', 'Course or quiz access is no longer available.');
    }
    let grade;
    try {
      grade = gradeAnswers(attempt.gradingSnapshot, data.answers, attempt.passPercentage || 70);
    } catch {
      invalidArgument('Submitted answers do not match the quiz.');
    }
    const gradedResult = {
      studentId: uid,
      courseId: attempt.courseId,
      quizId: attempt.quizId,
      status: 'submitted',
      answers: data.answers,
      score: grade.score,
      questionCount: grade.questionCount,
      percentage: grade.percentage,
      passed: grade.passed,
      submittedAt: FieldValue.serverTimestamp()
    };
    transaction.update(attemptRef, gradedResult);
    return grade;
  });

  if (result.expired) throw new HttpsError('deadline-exceeded', 'The quiz attempt has expired.');
  return result;
});

exports.expireQuizAttempt = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['attemptId']);
  const attemptId = requireId(data.attemptId, 'Attempt ID');
  const attemptRef = firestore.collection('quizAttempts').doc(attemptId);
  const expired = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(attemptRef);
    if (!snapshot.exists || snapshot.data().studentId !== uid) {
      throw new HttpsError('not-found', 'Quiz attempt is unavailable.');
    }
    const attempt = snapshot.data();
    if (attempt.status !== 'started') return attempt.status === 'expired';
    if (attempt.expiresAt.toMillis() > Date.now()) {
      throw new HttpsError('failed-precondition', 'The quiz attempt has not expired.');
    }
    transaction.update(attemptRef, {
      status: 'expired',
      submittedAt: FieldValue.serverTimestamp()
    });
    return true;
  });
  return { expired };
});

exports.issueCourseCertificate = callable(async (request) => {
  const uid = requireAuth(request);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const enrollmentRef = firestore.collection('enrollments').doc(`${uid}_${courseId}`);
  const attemptsQuery = firestore.collection('quizAttempts')
    .where('studentId', '==', uid)
    .where('courseId', '==', courseId);
  const certificateKey = `${uid}_${courseId}`;
  const certificateRef = firestore.collection('certificates').doc(certificateKey);
  const profileRef = firestore.collection('users').doc(uid);
  const certificateId = `${verificationPrefix}${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
  const verificationCode = crypto.randomBytes(24).toString('base64url');
  const verificationHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
  const verificationRef = firestore.collection('certificateVerification').doc(verificationHash);
  const certificateLookupRef = firestore.collection('certificateLookup').doc(certificateId);

  const certificate = await firestore.runTransaction(async (transaction) => {
    const [
      existing,
      courseSnapshot,
      enrollmentSnapshot,
      attemptsSnapshot,
      profileSnapshot
    ] = await Promise.all([
      transaction.get(certificateRef),
      transaction.get(courseRef),
      transaction.get(enrollmentRef),
      transaction.get(attemptsQuery),
      transaction.get(profileRef)
    ]);
    if (existing.exists) return existing.data();
    if (!courseSnapshot.exists || courseSnapshot.data().status !== 'published'
      || !enrollmentSnapshot.exists || !['active', 'completed'].includes(enrollmentSnapshot.data().status)) {
      throw new HttpsError('permission-denied', 'An active enrollment in a published course is required.');
    }
    const course = courseSnapshot.data();
    const requiredQuizIds = Array.isArray(course.requiredQuizIds) ? course.requiredQuizIds : [];
    if (!requiredQuizIds.length || requiredQuizIds.length > 100
      || requiredQuizIds.some((quizId) => typeof quizId !== 'string' || !idPattern.test(quizId))) {
      throw new HttpsError('failed-precondition', 'Certificate requirements are not configured for this course.');
    }
    const requiredQuizSnapshots = await Promise.all(requiredQuizIds.map((quizId) => (
      transaction.get(courseRef.collection('quizzes').doc(quizId))
    )));
    const currentQuizVersions = new Map(requiredQuizSnapshots.map((quizSnapshot, index) => {
      if (!quizSnapshot.exists || quizSnapshot.data().status !== 'published') {
        throw new HttpsError('failed-precondition', 'A required quiz is not currently published.');
      }
      const updatedAt = quizSnapshot.data().updatedAt;
      return [requiredQuizIds[index], updatedAt && updatedAt.toMillis ? updatedAt.toMillis() : null];
    }));
    const passedQuizVersions = new Map();
    attemptsSnapshot.docs.forEach((attempt) => {
      const data = attempt.data();
      if (data.status !== 'submitted' || data.passed !== true) return;
      const updatedAt = data.quizUpdatedAt;
      const version = updatedAt && updatedAt.toMillis ? updatedAt.toMillis() : null;
      if (!passedQuizVersions.has(data.quizId)) passedQuizVersions.set(data.quizId, new Set());
      passedQuizVersions.get(data.quizId).add(version);
    });
    if ([...currentQuizVersions].some(([quizId, version]) => (
      !passedQuizVersions.get(quizId) || !passedQuizVersions.get(quizId).has(version)
    ))) {
      throw new HttpsError('failed-precondition', 'Pass all required quizzes before requesting a certificate.');
    }

    const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
    const created = {
      certificateId,
      verificationHash,
      studentId: uid,
      studentName: profile.name || profile.displayName || '',
      courseId,
      courseName: course.title,
      status: 'valid',
      issuedAt: FieldValue.serverTimestamp()
    };
    transaction.create(certificateRef, created);
    transaction.create(verificationRef, {
      certificateRef: certificateKey,
      createdAt: FieldValue.serverTimestamp()
    });
    transaction.create(certificateLookupRef, {
      certificateRef: certificateKey,
      createdAt: FieldValue.serverTimestamp()
    });
    transaction.update(enrollmentRef, {
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return created;
  });

  if (certificate.certificateId !== certificateId) {
    return { certificateId: certificate.certificateId, status: certificate.status };
  }
  return { certificateId, verificationCode, status: 'valid' };
});

exports.verifyCourseCertificate = callable(async (request) => {
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['certificateId', 'verificationCode']);
  const certificateId = data.certificateId === undefined
    ? undefined
    : requireCertificateId(data.certificateId);
  const verificationCode = data.verificationCode === undefined
    ? undefined
    : requireVerificationCode(data.verificationCode);
  if (Boolean(certificateId) === Boolean(verificationCode)) {
    invalidArgument('Provide either a certificate ID or a verification code.');
  }

  let certificateSnapshot;
  if (certificateId) {
    const lookup = await firestore.collection('certificateLookup').doc(certificateId).get();
    certificateSnapshot = lookup.exists
      ? await firestore.collection('certificates').doc(lookup.data().certificateRef).get()
      : null;
  } else {
    const hash = crypto.createHash('sha256').update(verificationCode).digest('hex');
    const verification = await firestore.collection('certificateVerification').doc(hash).get();
    certificateSnapshot = verification.exists
      ? await firestore.collection('certificates').doc(verification.data().certificateRef).get()
      : null;
  }

  if (!certificateSnapshot || !certificateSnapshot.exists) return { status: 'INVALID' };
  const certificate = certificateSnapshot.data();
  if (certificate.status !== 'valid') return { status: 'REVOKED' };
  return {
    status: 'VALID',
    certificateId: certificate.certificateId,
    studentName: certificate.studentName,
    courseName: certificate.courseName,
    issuedAt: certificate.issuedAt && certificate.issuedAt.toMillis
      ? certificate.issuedAt.toMillis()
      : null
  };
});

exports.adminListUsers = callable(async (request) => {
  requireRole(request, ['admin']);
  const data = requireObject(request.data || {});
  requireOnlyKeys(data, ['pageToken']);
  const pageToken = data.pageToken === undefined
    ? undefined
    : requireText(data.pageToken, 'Page token', 256);
  const result = await getAuth().listUsers(100, pageToken);
  return {
    users: result.users.map((user) => ({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      emailVerified: Boolean(user.emailVerified),
      disabled: Boolean(user.disabled),
      role: allowedRoles.has(user.customClaims && user.customClaims.role)
        ? user.customClaims.role
        : null
    })),
    nextPageToken: result.pageToken || null
  };
});

exports.adminListCertificates = callable(async (request) => {
  requireRole(request, ['admin']);
  const snapshot = await firestore.collection('certificates')
    .orderBy('issuedAt', 'desc')
    .limit(100)
    .get();
  return {
    certificates: snapshot.docs.map((document) => {
      const data = document.data();
      return {
        certificateId: data.certificateId,
        studentName: data.studentName || '',
        courseName: data.courseName || '',
        status: data.status,
        issuedAt: data.issuedAt && data.issuedAt.toMillis ? data.issuedAt.toMillis() : null
      };
    })
  };
});

exports.adminRevokeCertificate = callable(async (request) => {
  const { uid } = requireRole(request, ['admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['certificateId']);
  const certificateId = requireCertificateId(data.certificateId);
  const lookup = await firestore.collection('certificateLookup').doc(certificateId).get();
  if (!lookup.exists) throw new HttpsError('not-found', 'Certificate is unavailable.');
  const certificateRef = firestore.collection('certificates').doc(lookup.data().certificateRef);
  const changed = await firestore.runTransaction(async (transaction) => {
    const certificateSnapshot = await transaction.get(certificateRef);
    if (!certificateSnapshot.exists) throw new HttpsError('not-found', 'Certificate is unavailable.');
    if (certificateSnapshot.data().status === 'revoked') return false;
    transaction.update(certificateRef, {
      status: 'revoked',
      revokedAt: FieldValue.serverTimestamp(),
      revokedBy: uid
    });
    return true;
  });
  if (changed) await recordAudit('certificate.revoke', uid, certificateId);
  return { revoked: true };
});

exports.adminUpsertCourse = callable(async (request) => {
  const { uid } = requireRole(request, ['admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, [
    'courseId', 'title', 'slug', 'description', 'category', 'level', 'duration',
    'instructorId', 'instructorName', 'thumbnail', 'status', 'price', 'currency', 'teacherIds',
    'requiredQuizIds'
  ]);
  const courseId = data.courseId === undefined
    ? firestore.collection('courses').doc().id
    : requireId(data.courseId, 'Course ID');
  const status = data.status;
  if (!['draft', 'published', 'archived'].includes(status)) invalidArgument('Course status is invalid.');
  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0) {
    invalidArgument('Course price must be a non-negative number.');
  }
  if (data.currency !== undefined && data.currency !== ''
    && (typeof data.currency !== 'string' || !/^[A-Z]{3}$/.test(data.currency))) {
    invalidArgument('Currency must be a three-letter uppercase code.');
  }
  if (data.price > 0 && !/^[A-Z]{3}$/.test(data.currency || '')) {
    invalidArgument('A valid currency is required for a paid course.');
  }
  const teacherIds = data.teacherIds === undefined ? [] : data.teacherIds;
  if (!Array.isArray(teacherIds) || teacherIds.length > 100
    || teacherIds.some((teacherId) => typeof teacherId !== 'string' || !idPattern.test(teacherId))) {
    invalidArgument('Teacher assignments are invalid.');
  }
  const requiredQuizIds = data.requiredQuizIds === undefined ? [] : data.requiredQuizIds;
  if (!Array.isArray(requiredQuizIds) || requiredQuizIds.length > 100
    || requiredQuizIds.some((quizId) => typeof quizId !== 'string' || !idPattern.test(quizId))) {
    invalidArgument('Required quiz IDs are invalid.');
  }
  const course = {
    title: requireText(data.title, 'Course title', 160),
    slug: requireText(data.slug, 'Course slug', 160),
    description: requireText(data.description, 'Course description', 10000),
    category: requireText(data.category, 'Course category', 100),
    level: requireText(data.level, 'Course level', 50),
    duration: requireText(data.duration, 'Course duration', 100),
    instructorId: data.instructorId === undefined ? null : requireId(data.instructorId, 'Instructor ID'),
    instructorName: data.instructorName === undefined
      ? ''
      : requireText(data.instructorName, 'Instructor name', 160, { minLength: 0 }),
    thumbnail: data.thumbnail === undefined ? null : requireHttpsUrl(data.thumbnail, 'Thumbnail URL'),
    status,
    price: data.price,
    currency: data.currency || null,
    teacherIds: [...new Set(teacherIds)],
    requiredQuizIds: [...new Set(requiredQuizIds)],
    updatedAt: FieldValue.serverTimestamp()
  };
  const courseRef = firestore.collection('courses').doc(courseId);
  const existing = await courseRef.get();
  if (!existing.exists) course.createdAt = FieldValue.serverTimestamp();
  await courseRef.set(course, { merge: true });
  await recordAudit('course.upsert', uid, courseId, { status });
  return { courseId, status };
});

exports.adminArchiveCourse = callable(async (request) => {
  const { uid } = requireRole(request, ['admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const course = await courseRef.get();
  if (!course.exists) throw new HttpsError('not-found', 'Course is unavailable.');
  await courseRef.update({ status: 'archived', updatedAt: FieldValue.serverTimestamp() });
  await recordAudit('course.archive', uid, courseId);
  return { archived: true };
});

exports.teacherUpsertLesson = callable(async (request) => {
  const { uid } = requireRole(request, ['teacher', 'admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId', 'lessonId', 'title', 'description', 'content', 'videoUrl', 'materialUrl', 'order', 'duration', 'status']);
  const courseId = requireId(data.courseId, 'Course ID');
  const lessonId = data.lessonId === undefined
    ? firestore.collection('courses').doc(courseId).collection('lessons').doc().id
    : requireId(data.lessonId, 'Lesson ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const courseSnapshot = await courseRef.get();
  if (!courseSnapshot.exists) throw new HttpsError('not-found', 'Course is unavailable.');
  const course = courseSnapshot.data();
  if (request.auth.token.role !== 'admin' && !isAssignedTeacher(course, uid)) {
    throw new HttpsError('permission-denied', 'You are not assigned to this course.');
  }
  if (!['draft', 'published', 'archived'].includes(data.status)) invalidArgument('Lesson status is invalid.');
  const lesson = {
    courseId,
    title: requireText(data.title, 'Lesson title', 200),
    description: requireText(data.description, 'Lesson description', 4000),
    content: requireText(data.content, 'Lesson content', 50000, { minLength: 0 }),
    videoUrl: data.videoUrl ? requireHttpsUrl(data.videoUrl, 'Video URL') : null,
    materialUrl: data.materialUrl ? requireHttpsUrl(data.materialUrl, 'Learning material URL') : null,
    order: requireInteger(data.order, 'Lesson order', 0, 10000),
    duration: requireText(data.duration, 'Lesson duration', 100),
    status: data.status,
    updatedAt: FieldValue.serverTimestamp()
  };
  const lessonRef = courseRef.collection('lessons').doc(lessonId);
  const existing = await lessonRef.get();
  if (!existing.exists) lesson.createdAt = FieldValue.serverTimestamp();
  await lessonRef.set(lesson, { merge: true });
  await recordAudit('lesson.upsert', uid, `${courseId}/${lessonId}`);
  return { lessonId, status: lesson.status };
});

exports.teacherArchiveLesson = callable(async (request) => {
  const { uid } = requireRole(request, ['teacher', 'admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['courseId', 'lessonId']);
  const courseId = requireId(data.courseId, 'Course ID');
  const lessonId = requireId(data.lessonId, 'Lesson ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const course = await courseRef.get();
  if (!course.exists) throw new HttpsError('not-found', 'Course is unavailable.');
  if (request.auth.token.role !== 'admin' && !isAssignedTeacher(course.data(), uid)) {
    throw new HttpsError('permission-denied', 'You are not assigned to this course.');
  }
  const lessonRef = courseRef.collection('lessons').doc(lessonId);
  if (!(await lessonRef.get()).exists) throw new HttpsError('not-found', 'Lesson is unavailable.');
  await lessonRef.update({ status: 'archived', updatedAt: FieldValue.serverTimestamp() });
  await recordAudit('lesson.archive', uid, `${courseId}/${lessonId}`);
  return { archived: true };
});

exports.teacherUpsertQuiz = callable(async (request) => {
  const { uid } = requireRole(request, ['teacher', 'admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, [
    'courseId', 'quizId', 'title', 'status', 'questions', 'passPercentage',
    'maxAttempts', 'durationSeconds'
  ]);
  const courseId = requireId(data.courseId, 'Course ID');
  const quizId = data.quizId === undefined
    ? firestore.collection('courses').doc(courseId).collection('quizzes').doc().id
    : requireId(data.quizId, 'Quiz ID');
  const courseRef = firestore.collection('courses').doc(courseId);
  const courseSnapshot = await courseRef.get();
  if (!courseSnapshot.exists) throw new HttpsError('not-found', 'Course is unavailable.');
  if (request.auth.token.role !== 'admin' && !isAssignedTeacher(courseSnapshot.data(), uid)) {
    throw new HttpsError('permission-denied', 'You are not assigned to this course.');
  }
  if (!['draft', 'published', 'archived'].includes(data.status)) invalidArgument('Quiz status is invalid.');
  const quiz = {
    courseId,
    title: requireText(data.title, 'Quiz title', 200),
    status: data.status,
    questions: normalizeQuestions(data.questions),
    passPercentage: requireInteger(data.passPercentage, 'Pass percentage', 1, 100),
    maxAttempts: requireInteger(data.maxAttempts, 'Maximum attempts', 1, 20),
    durationSeconds: requireInteger(data.durationSeconds, 'Quiz duration', 60, 10800),
    updatedAt: FieldValue.serverTimestamp()
  };
  const quizRef = courseRef.collection('quizzes').doc(quizId);
  const existing = await quizRef.get();
  if (!existing.exists) quiz.createdAt = FieldValue.serverTimestamp();
  await quizRef.set(quiz, { merge: true });
  await recordAudit('quiz.upsert', uid, `${courseId}/${quizId}`);
  return { quizId, status: quiz.status };
});

exports.adminSetUserRole = callable(async (request) => {
  const { uid } = requireRole(request, ['admin']);
  const data = requireObject(request.data);
  requireOnlyKeys(data, ['targetUid', 'role']);
  const targetUid = requireText(data.targetUid, 'Target user ID', 128);
  const role = data.role;
  if (!allowedRoles.has(role)) invalidArgument('Role is invalid.');
  const auth = getAuth();
  const target = await auth.getUser(targetUid);
  await auth.setCustomUserClaims(targetUid, {
    ...target.customClaims,
    role
  });
  await firestore.collection('users').doc(targetUid).set({
    role,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  await recordAudit('user.role.change', uid, targetUid, { role });
  return { updated: true };
});
