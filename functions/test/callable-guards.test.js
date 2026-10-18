const test = require('node:test');
const assert = require('node:assert/strict');
const functions = require('../index');

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
