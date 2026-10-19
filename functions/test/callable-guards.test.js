const test = require('node:test');
const assert = require('node:assert/strict');
const functions = require('../index');
const { hasAcknowledgedAllPublishedLessons } = require('../lib/certificate-eligibility');
const { isCurrentAuthorizedRole } = require('../lib/role-authorization');

const studentAuth = {
  uid: 'test-student',
  token: { role: 'student', email_verified: true }
};

function request(data, auth = studentAuth) {
  return { data, auth };
}

async function expectCallableError(name, input, code) {
  await assert.rejects(() => functions[name].run(input), (error) => {
    assert.equal(error.code, code);
    return true;
  });
}

const authenticatedCallables = [
  'syncCurrentUserProfile',
  'getCurrentUserAccess',
  'getStudentDashboard',
  'listTeacherCourses',
  'listCourseEnrollmentsForTeacher',
  'teacherGetCourseContent',
  'getEnrolledCourseContent',
  'listEnrolledCourseQuizzes',
  'enrollInCourse',
  'updateLessonProgress',
  'startQuizAttempt',
  'submitQuizAttempt',
  'expireQuizAttempt',
  'issueCourseCertificate',
  'adminListUsers',
  'adminListCertificates',
  'adminRevokeCertificate',
  'adminUpsertCourse',
  'adminArchiveCourse',
  'teacherUpsertLesson',
  'teacherArchiveLesson',
  'teacherUpsertQuiz',
  'adminSetUserRole'
];

test('authenticated callable operations reject requests without Firebase Auth context', async () => {
  await Promise.all(authenticatedCallables.map((name) => (
    expectCallableError(name, { data: {} }, 'unauthenticated')
  )));
});

test('privileged operations reject a student before any database operation', async () => {
  const privileged = [
    'listTeacherCourses',
    'listCourseEnrollmentsForTeacher',
    'teacherGetCourseContent',
    'adminListUsers',
    'adminListCertificates',
    'adminRevokeCertificate',
    'adminUpsertCourse',
    'adminArchiveCourse',
    'teacherUpsertLesson',
    'teacherArchiveLesson',
    'teacherUpsertQuiz',
    'adminSetUserRole'
  ];
  await Promise.all(privileged.map((name) => (
    expectCallableError(name, request({}), 'permission-denied')
  )));
});

test('unverified accounts are denied protected student operations', async () => {
  await expectCallableError(
    'enrollInCourse',
    request({ courseId: 'course-a' }, {
      uid: 'unverified-student',
      token: { role: 'student', email_verified: false }
    }),
    'failed-precondition'
  );
});

test('client-supplied identity, role, completion, quiz score, and eligibility fields are rejected', async () => {
  await Promise.all([
    expectCallableError('enrollInCourse', request({
      courseId: 'course-a',
      uid: 'victim',
      role: 'admin'
    }), 'invalid-argument'),
    expectCallableError('updateLessonProgress', request({
      courseId: 'course-a',
      lessonId: 'lesson-a',
      completed: true
    }), 'invalid-argument'),
    expectCallableError('submitQuizAttempt', request({
      attemptId: 'attempt-a',
      answers: [0],
      score: 100,
      passed: true
    }), 'invalid-argument'),
    expectCallableError('issueCourseCertificate', request({
      courseId: 'course-a',
      completed: true,
      eligible: true,
      certificate: true
    }), 'invalid-argument')
  ]);
});

test('privileged access requires the role claim to match the current Auth record', async () => {
  const allowedRoles = ['teacher', 'admin'];
  assert.equal(await isCurrentAuthorizedRole('admin', allowedRoles, async () => ({
    authRole: 'admin',
    profileRole: 'admin'
  })), true);
  assert.equal(await isCurrentAuthorizedRole('admin', allowedRoles, async () => ({
    authRole: 'student',
    profileRole: 'student'
  })), false);
  assert.equal(await isCurrentAuthorizedRole('teacher', allowedRoles, async () => ({
    authRole: 'teacher',
    profileRole: 'student'
  })), false);
  let lookupCalled = false;
  assert.equal(await isCurrentAuthorizedRole('student', allowedRoles, async () => {
    lookupCalled = true;
    return { authRole: 'student', profileRole: 'student' };
  }), false);
  assert.equal(lookupCalled, false);
});

test('certificate eligibility requires learner acknowledgement of every published lesson', () => {
  const publishedLessonIds = ['lesson-1', 'lesson-2'];
  assert.equal(hasAcknowledgedAllPublishedLessons(publishedLessonIds, [
    { lessonId: 'lesson-1', acknowledged: true },
    { lessonId: 'lesson-2', acknowledged: true }
  ]), true);
  assert.equal(hasAcknowledgedAllPublishedLessons(publishedLessonIds, [
    { lessonId: 'lesson-1', acknowledged: true }
  ]), false);
  assert.equal(hasAcknowledgedAllPublishedLessons(publishedLessonIds, [
    { lessonId: 'lesson-1', acknowledged: true },
    { lessonId: 'lesson-2', acknowledged: false }
  ]), false);
  assert.equal(hasAcknowledgedAllPublishedLessons([], []), false);
});
