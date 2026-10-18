import {
  auth, callLms, createElement, onAuthStateChanged, readableError, setStatus, signOut
} from '../firebase/lms-client.js';
import { getCurrentUserProfile } from '../firebase/profiles.js';

const dashboard = document.querySelector('.dashboard-main');
let authGeneration = 0;

function section(title, items, emptyMessage, renderItem) {
  const wrapper = createElement('section', undefined, 'dashboard-card');
  wrapper.append(createElement('h2', title));
  if (!items.length) {
    wrapper.append(createElement('p', emptyMessage, 'muted'));
    return wrapper;
  }
  const list = createElement('ul', undefined, 'dashboard-list');
  items.forEach((item) => list.append(renderItem(item)));
  wrapper.append(list);
  return wrapper;
}

function emptyDashboard(message) {
  dashboard.replaceChildren();
  const card = createElement('section', undefined, 'dashboard-card');
  card.append(createElement('h2', 'Learner dashboard'), createElement('p', message, 'status-message'));
  const login = createElement('a', 'Sign in', 'btn btn-primary');
  login.href = 'login.html';
  card.append(login);
  dashboard.append(card);
}

async function render(user, generation) {
  dashboard.hidden = false;
  document.getElementById('dashboard-loading')?.remove();
  if (!user || !user.emailVerified) {
    emptyDashboard(user
      ? 'Verify your email before accessing learner records. Sign out and use the verified account.'
      : 'Sign in with a verified Firebase account to load your learner records.');
    if (user) await signOut(auth);
    return;
  }

  dashboard.replaceChildren(createElement('p', 'Loading your CWU account and backend records…', 'muted'));
  try {
    const [profile, result, catalog] = await Promise.all([
      getCurrentUserProfile(),
      callLms('getStudentDashboard'),
      callLms('listPublishedCourses')
    ]);
    if (generation !== authGeneration || auth.currentUser?.uid !== user.uid) return;
    const courses = new Map(catalog.courses.map((course) => [course.id, course]));
    dashboard.replaceChildren();

    const account = createElement('section', undefined, 'dashboard-card');
    account.append(createElement('h2', 'Your account'));
    const details = createElement('dl', undefined, 'profile-details');
    [
      ['Name', profile.name || profile.displayName || user.displayName || 'Not provided'],
      ['Email', profile.email || user.email || 'Not provided'],
      ['Role (informational only)', profile.role || 'Unassigned'],
      ['Backend authorization', 'Not verified by this UI']
    ].forEach(([label, value]) => {
      details.append(createElement('dt', label), createElement('dd', value));
    });
    const logout = createElement('button', 'Sign out', 'btn btn-secondary');
    logout.type = 'button';
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try {
        await signOut(auth);
      } catch (error) {
        logout.disabled = false;
        setStatus(accountStatus, readableError(error), true);
      }
    });
    const accountStatus = createElement('p', 'Account profile loaded from the backend.', 'status-message');
    account.append(details, logout, accountStatus);
    dashboard.append(account);

    dashboard.append(section('Enrolled courses', result.enrollments || [], 'No enrollments are recorded for this account.', (enrollment) => {
      const item = createElement('li');
      const course = courses.get(enrollment.courseId);
      const name = createElement('h3', course ? course.title : 'Course no longer published');
      const state = createElement('p', `Backend enrollment status: ${enrollment.status}`);
      item.append(name, state);
      if (course && ['active', 'completed'].includes(enrollment.status)) {
        const link = createElement('a', 'Open course', 'btn btn-primary');
        link.href = `course-details.html?id=${encodeURIComponent(course.id)}`;
        item.append(link);
      }
      return item;
    }));
    dashboard.append(section('Lesson progress', result.progress || [], 'No lesson progress records are available.', (entry) => {
      const course = courses.get(entry.courseId);
      return createElement('li', `${course ? course.title : entry.courseId} · Lesson ${entry.lessonId}: ${entry.acknowledged ? 'progress acknowledged (not verified completion)' : 'not acknowledged'}`);
    }));
    dashboard.append(section('Quiz attempts', result.quizAttempts || [], 'No quiz attempts are recorded.', (attempt) => (
      createElement('li', `${courses.get(attempt.courseId)?.title || attempt.courseId} · ${attempt.quizId} · ${
        attempt.status === 'submitted'
          ? `${attempt.score}/${attempt.questionCount} (${attempt.percentage}%) · ${attempt.passed ? 'passed' : 'not passed'}`
          : attempt.status
      }`)
    )));
    dashboard.append(section('Certificates', result.certificates || [], 'No certificates have been issued to this account.', (certificate) => {
      const item = createElement('li');
      item.append(createElement('p', `${certificate.courseName} · ${certificate.status}`));
      if (certificate.certificateId) {
        const link = createElement('a', 'Verify certificate');
        link.href = `verify-certificate.html?id=${encodeURIComponent(certificate.certificateId)}`;
        item.append(link);
      }
      return item;
    }));
  } catch (error) {
    if (generation !== authGeneration) return;
    dashboard.replaceChildren(createElement(
      'p',
      `Your sign-in is active, but backend learner records could not be loaded: ${readableError(error)}`,
      'status-message error'
    ));
  }
}

if (dashboard) {
  onAuthStateChanged(auth, (user) => {
    const generation = ++authGeneration;
    render(user, generation).catch((error) => {
      if (generation === authGeneration) {
        dashboard.replaceChildren(createElement('p', readableError(error), 'status-message error'));
      }
    });
  });
}
