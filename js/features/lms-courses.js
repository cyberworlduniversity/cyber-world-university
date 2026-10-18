import { callLms, createElement, readableError, setStatus, waitForAuth } from '../firebase/lms-client.js';

const catalog = document.getElementById('course-catalog');
const detailTitle = document.getElementById('course-title');

function formatPrice(course) {
  if (course.price === 0) return 'Free';
  if (!Number.isFinite(course.price) || !course.currency) return 'Price unavailable';
  return `${course.currency} ${course.price.toFixed(2)}`;
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function courseCard(course, enrollmentStatus) {
  const card = createElement('article', undefined, 'catalog-card');
  const title = createElement('h2', course.title);
  const metadata = createElement('ul', undefined, 'badge-list');
  [
    course.category,
    course.level,
    course.duration,
    `Instructor: ${course.instructor || 'CWU instructional team'}`,
    formatPrice(course),
    'Published'
  ].forEach((value) => metadata.append(createElement('li', value)));
  const description = createElement('p', course.description);
  const state = createElement('p', enrollmentStatus
    ? `Enrollment: ${enrollmentStatus}`
    : 'Enrollment: not enrolled');
  const link = createElement('a', 'View course', 'btn btn-primary');
  link.href = `course-details.html?id=${encodeURIComponent(course.id)}`;
  card.append(title, metadata, description, state, link);
  return card;
}

async function loadCatalog() {
  catalog.replaceChildren(createElement('p', 'Loading published courses…', 'muted'));
  const status = document.getElementById('course-result-count');
  setStatus(status, 'Loading published courses…');
  try {
    const [result, user] = await Promise.all([callLms('listPublishedCourses'), waitForAuth()]);
    const courses = Array.isArray(result.courses) ? result.courses : [];
    catalog.replaceChildren();
    if (!courses.length) {
      catalog.append(createElement('p', 'No published courses are currently available.', 'empty-state'));
      setStatus(status, 'No published courses are currently available.');
      return;
    }

    const search = document.getElementById('course-search');
    const category = document.getElementById('category-filter');
    const level = document.getElementById('level-filter');
    const clearSearch = document.getElementById('clear-course-search');
    const clearFilters = document.getElementById('clear-course-filters');
    const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))].sort();
    [...category.options].slice(1).forEach((option) => option.remove());
    categories.forEach((value) => {
      const option = createElement('option', value);
      option.value = value;
      category.append(option);
    });

    const render = () => {
      const query = search.value.trim().toLowerCase();
      const matches = courses.filter((course) => (
        (!category.value || course.category === category.value)
        && (!level.value || course.level === level.value)
        && `${course.title} ${course.description} ${course.category} ${course.level} ${course.instructor}`
          .toLowerCase().includes(query)
      ));
      catalog.replaceChildren();
      matches.forEach((course) => catalog.append(courseCard(
        course,
        user ? course.enrollmentStatus : null
      )));
      if (!matches.length) catalog.append(createElement('p', 'No published courses match these filters.', 'empty-state'));
      setStatus(status, `${matches.length} published ${matches.length === 1 ? 'course' : 'courses'} shown.`);
      clearSearch.disabled = !search.value;
      clearFilters.disabled = !search.value && !category.value && !level.value;
    };
    search.addEventListener('input', render);
    category.addEventListener('change', render);
    level.addEventListener('change', render);
    clearSearch.addEventListener('click', () => {
      search.value = '';
      render();
      search.focus();
    });
    clearFilters.addEventListener('click', () => {
      search.value = '';
      category.value = '';
      level.value = '';
      render();
    });
    render();
  } catch (error) {
    catalog.replaceChildren(createElement('p', 'Published courses could not be loaded. No local catalog is being shown as authoritative data.', 'status-message error'));
    setStatus(status, readableError(error), true);
  }
}

async function loadCourseDetails() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('id');
  const status = createElement('p', 'Loading course from CWU…', 'status-message');
  const nextSteps = document.querySelector('[aria-labelledby="course-next-steps"]');
  const contentGrid = document.querySelector('.page-content .content-grid');
  const outline = document.getElementById('course-outline');
  const metadata = document.getElementById('course-meta');
  if (!courseId) {
    setStatus(status, 'A course ID is required. Browse the published catalog to select a course.', true);
    nextSteps.prepend(status);
    return;
  }
  nextSteps.prepend(status);
  detailTitle.textContent = 'Loading course…';
  try {
    const result = await callLms('listPublishedCourses');
    const course = result.courses.find((item) => item.id === courseId);
    if (!course) {
      detailTitle.textContent = 'Course unavailable';
      setStatus(status, 'This course is not currently published or does not exist.', true);
      contentGrid.hidden = true;
      return;
    }

    const user = await waitForAuth();
    detailTitle.textContent = course.title;
    document.getElementById('course-description').textContent = course.description || '';
    document.getElementById('course-outline-intro').textContent = course.description || '';
    document.getElementById('course-requirements').textContent = 'Course requirements are supplied by the CWU instructional team.';
    metadata.replaceChildren();
    [course.category, course.level, course.duration, `Instructor: ${course.instructor}`, formatPrice(course), 'Published'].forEach((value) => {
      metadata.append(createElement('li', value));
    });
    outline.replaceChildren();

    const loginLink = document.getElementById('course-login-link');
    const registerLink = document.getElementById('course-register-link');
    loginLink.href = `login.html?course=${encodeURIComponent(courseId)}`;
    registerLink.href = `register.html?course=${encodeURIComponent(courseId)}`;
    const actionArea = nextSteps.querySelector('.inline-actions');
    actionArea.replaceChildren();
    const enrollmentStatus = user ? course.enrollmentStatus : null;
    if (!user) {
      loginLink.textContent = 'Sign in to enroll';
      registerLink.textContent = 'Create account';
      actionArea.append(loginLink, registerLink);
      setStatus(status, `Published course · ${formatPrice(course)}. Sign in to check enrollment or enroll in a free course.`);
    } else if (!user.emailVerified) {
      setStatus(status, 'Verify your email address before using enrollment, lesson, quiz, or certificate functions.', true);
      const verify = createElement('a', 'Go to sign in and verify email', 'btn btn-primary');
      verify.href = 'login.html';
      actionArea.append(verify);
    } else if (['active', 'completed'].includes(enrollmentStatus)) {
      setStatus(status, `Backend confirms enrollment status: ${enrollmentStatus}.`);
      const [content, quizResult] = await Promise.all([
        callLms('getEnrolledCourseContent', { courseId }),
        callLms('listEnrolledCourseQuizzes', { courseId })
      ]);
      const progressResult = await callLms('getStudentDashboard');
      const acknowledged = new Set(progressResult.progress
        .filter((item) => item.courseId === courseId && item.acknowledged)
        .map((item) => item.lessonId));
      content.lessons.forEach((lesson) => {
        const row = createElement('li');
        const heading = createElement('h3', lesson.title);
        const description = createElement('p', lesson.description);
        const body = createElement('p', lesson.content);
        row.append(heading, description, body);
        const videoUrl = safeHttpsUrl(lesson.videoUrl);
        if (videoUrl) {
          const video = createElement('a', 'Open lesson video');
          video.href = videoUrl;
          video.rel = 'noopener noreferrer';
          video.target = '_blank';
          row.append(video);
        }
        const materialUrl = safeHttpsUrl(lesson.materialUrl);
        if (materialUrl) {
          const material = createElement('a', 'Open learning material');
          material.href = materialUrl;
          material.rel = 'noopener noreferrer';
          material.target = '_blank';
          row.append(material);
        }
        const done = createElement('p', acknowledged.has(lesson.id)
          ? 'Progress acknowledgment recorded. This is not verified course completion.'
          : 'No progress acknowledgment recorded.');
        row.append(done);
        if (!acknowledged.has(lesson.id)) {
          const mark = createElement('button', 'Acknowledge lesson (self-reported)', 'btn btn-secondary');
          mark.type = 'button';
          mark.addEventListener('click', async () => {
            mark.disabled = true;
            try {
              await callLms('updateLessonProgress', { courseId, lessonId: lesson.id });
              setStatus(done, 'Backend recorded your progress acknowledgment. This is not verified course completion.');
              mark.remove();
            } catch (error) {
              mark.disabled = false;
              setStatus(done, readableError(error), true);
            }
          });
          row.append(mark);
        }
        outline.append(row);
      });
      const quizList = createElement('ul');
      quizResult.quizzes.forEach((quiz) => {
        const item = createElement('li');
        const link = createElement('a', `Start ${quiz.title}`);
        link.href = `quizzes.html?course=${encodeURIComponent(courseId)}&quiz=${encodeURIComponent(quiz.id)}`;
        item.append(link);
        quizList.append(item);
      });
      nextSteps.append(createElement('h3', 'Published lessons'), outline, createElement('h3', 'Published quizzes'), quizList);
      const certificateButton = createElement('button', 'Request certificate eligibility check', 'btn btn-secondary');
      certificateButton.type = 'button';
      certificateButton.addEventListener('click', async () => {
        certificateButton.disabled = true;
        try {
          const certificate = await callLms('issueCourseCertificate', { courseId });
          setStatus(status, `Backend certificate status: ${certificate.status}. Certificate ID: ${certificate.certificateId}.`);
          if (certificate.verificationCode) {
            const oneTimeCode = createElement('p', `Save this one-time verification code now: ${certificate.verificationCode}. It will not be shown again.`);
            oneTimeCode.className = 'notice';
            status.after(oneTimeCode);
          }
        } catch (error) {
          setStatus(status, readableError(error), true);
          certificateButton.disabled = false;
        }
      });
      actionArea.append(certificateButton);
    } else {
      const enroll = createElement('button', course.price === 0 ? 'Enroll in free course' : 'Payment unavailable', 'btn btn-primary');
      enroll.type = 'button';
      enroll.disabled = course.price !== 0;
      actionArea.append(enroll);
      if (course.price > 0) {
        setStatus(status, 'Payment is currently unavailable. Please try again later.', true);
      } else {
        setStatus(status, 'Not enrolled. Enrollment will be confirmed only after the backend responds.');
        enroll.addEventListener('click', async () => {
          enroll.disabled = true;
          try {
            const response = await callLms('enrollInCourse', { courseId });
            setStatus(status, `Backend confirms enrollment status: ${response.enrollment.status}. Reloading course access…`);
            window.location.reload();
          } catch (error) {
            setStatus(status, readableError(error), true);
            enroll.disabled = false;
          }
        });
      }
    }
  } catch (error) {
    setStatus(status, readableError(error), true);
    detailTitle.textContent = 'Course details unavailable';
  }
}

if (catalog) loadCatalog();
if (detailTitle) loadCourseDetails();
