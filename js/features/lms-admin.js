import { callLms, createElement, readableError, waitForAuth } from '../firebase/lms-client.js';

const root = document.getElementById('admin-app');
let access;
let courses = [];
let selectedCourseId = '';
let managedContent;

function statusText(parent, message, isError = false) {
  const node = createElement('p', message, isError ? 'status-message error' : 'status-message');
  node.setAttribute('role', 'status');
  parent.append(node);
  return node;
}

function field(name, labelText, options = {}) {
  const wrapper = createElement('div', undefined, 'form-control');
  const label = createElement('label', labelText);
  label.htmlFor = `lms-admin-${name}`;
  let input;
  if (options.multiline) {
    input = createElement('textarea');
    input.rows = options.rows || 4;
  } else if (options.choices) {
    input = createElement('select');
    options.choices.forEach(([value, labelText]) => {
      const option = createElement('option', labelText);
      option.value = value;
      input.append(option);
    });
  } else {
    input = createElement('input');
    input.type = options.type || 'text';
    if (options.min !== undefined) input.min = String(options.min);
    if (options.step !== undefined) input.step = String(options.step);
  }
  input.id = `lms-admin-${name}`;
  input.name = name;
  if (options.required) input.required = true;
  if (options.placeholder) input.placeholder = options.placeholder;
  wrapper.append(label, input);
  return { wrapper, input };
}

function makeSection(title, description) {
  const section = createElement('section', undefined, 'admin-card stack');
  section.append(createElement('h2', title));
  if (description) section.append(createElement('p', description, 'muted'));
  return section;
}

function makeSelect(name, labelText) {
  return field(name, labelText, { choices: [] });
}

function appendTable(parent, headings, rows) {
  const wrapper = createElement('div', undefined, 'table-wrap');
  const table = createElement('table', undefined, 'data-table');
  const thead = createElement('thead');
  const header = createElement('tr');
  headings.forEach((heading) => header.append(createElement('th', heading)));
  thead.append(header);
  const tbody = createElement('tbody');
  if (!rows.length) {
    const row = createElement('tr');
    const cell = createElement('td', 'No records returned by the backend.');
    cell.colSpan = headings.length;
    row.append(cell);
    tbody.append(row);
  } else {
    rows.forEach((cells) => {
      const row = createElement('tr');
        cells.forEach((cell) => {
          const cellNode = createElement('td');
          if (cell instanceof Node) cellNode.append(cell);
          else cellNode.textContent = cell;
          row.append(cellNode);
        });
      tbody.append(row);
    });
  }
  table.append(thead, tbody);
  wrapper.append(table);
  parent.append(wrapper);
  return tbody;
}

function action(label, handler) {
  const button = createElement('button', label, 'small-button');
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

async function reportAction(button, operation, successMessage) {
  button.disabled = true;
  try {
    await operation();
    await loadAdmin();
  } catch (error) {
    button.disabled = false;
    statusText(root, readableError(error), true);
  }
}

function buildCourseSection() {
  const section = makeSection('Courses', 'Course records are loaded from the authorized backend. Saving changes requires admin authorization.');
  const list = createElement('div');
  section.append(list);
  appendTable(list, ['Title', 'Category', 'Level', 'Status', 'Price', 'Actions'], courses.map((course) => {
    const actions = createElement('div', undefined, 'admin-actions');
    actions.append(action('Edit', async () => {
      const content = await callLms('teacherGetCourseContent', { courseId: course.id });
      form.elements.courseId.value = course.id;
      form.elements.title.value = content.course.title || '';
      form.elements.slug.value = content.course.slug || '';
      form.elements.description.value = content.course.description || '';
      form.elements.category.value = content.course.category || '';
      form.elements.level.value = content.course.level || '';
      form.elements.duration.value = content.course.duration || '';
      form.elements.instructorName.value = content.course.instructor || '';
      form.elements.price.value = String(content.course.price ?? 0);
      form.elements.currency.value = content.course.currency || 'USD';
      form.elements.status.value = content.course.status || 'draft';
      form.elements.instructorId.value = content.adminSettings?.instructorId || '';
      form.elements.teacherIds.value = (content.adminSettings?.teacherIds || []).join(', ');
      form.elements.requiredQuizIds.value = (content.adminSettings?.requiredQuizIds || []).join(', ');
      statusText(section, `Editing ${course.title} (${course.id}).`);
    }).catch((error) => statusText(section, readableError(error), true)));
    if (access.role === 'admin') {
      actions.append(action('Archive', (event) => reportAction(event.currentTarget,
        () => callLms('adminArchiveCourse', { courseId: course.id }), 'Course archived.')));
    }
    return [
      course.title, course.category, course.level, course.status,
      `${course.currency || ''} ${Number(course.price || 0).toFixed(2)}`.trim(), actions
    ];
  }));

  if (access.role === 'admin') {
    const form = createElement('form', undefined, 'content-card stack');
    form.append(createElement('h3', 'Create or update course'));
    const elements = [
      field('courseId', 'Course ID (blank to create)', { placeholder: 'Generated by backend when blank' }),
      field('title', 'Title', { required: true }),
      field('slug', 'Slug', { required: true }),
      field('description', 'Description', { multiline: true, required: true }),
      field('category', 'Category', { required: true }),
      field('level', 'Level', { required: true }),
      field('duration', 'Duration', { required: true }),
      field('instructorName', 'Public instructor name'),
      field('instructorId', 'Instructor Auth UID (optional)'),
      field('teacherIds', 'Assigned teacher Auth UIDs (comma-separated)'),
      field('requiredQuizIds', 'Required quiz IDs (comma-separated)'),
      field('thumbnail', 'Thumbnail HTTPS URL'),
      field('price', 'Price', { type: 'number', min: 0, step: 0.01, required: true }),
      field('currency', 'Currency', { placeholder: 'USD' }),
      field('status', 'Publication state', { choices: [['draft', 'Draft'], ['published', 'Published'], ['archived', 'Archived']] })
    ];
    elements.forEach(({ wrapper }) => form.append(wrapper));
    const status = createElement('p', '', 'status-message');
    const buttons = createElement('div', undefined, 'inline-actions');
    const save = createElement('button', 'Save through admin backend', 'btn btn-primary');
    save.type = 'submit';
    const reset = createElement('button', 'Clear form', 'btn btn-secondary');
    reset.type = 'reset';
    buttons.append(save, reset);
    form.append(buttons, status);
    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        form.elements.status.value = 'draft';
        form.elements.currency.value = 'USD';
      }, 0);
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      save.disabled = true;
      try {
        const teacherIds = form.elements.teacherIds.value.split(',').map((value) => value.trim()).filter(Boolean);
        const requiredQuizIds = form.elements.requiredQuizIds.value.split(',').map((value) => value.trim()).filter(Boolean);
        const payload = {
          title: form.elements.title.value,
          slug: form.elements.slug.value,
          description: form.elements.description.value,
          category: form.elements.category.value,
          level: form.elements.level.value,
          duration: form.elements.duration.value,
          instructorName: form.elements.instructorName.value,
          status: form.elements.status.value,
          price: Number(form.elements.price.value),
          currency: form.elements.currency.value.toUpperCase(),
          teacherIds,
          requiredQuizIds
        };
        if (form.elements.courseId.value.trim()) payload.courseId = form.elements.courseId.value.trim();
        if (form.elements.instructorId.value.trim()) payload.instructorId = form.elements.instructorId.value.trim();
        if (form.elements.thumbnail.value.trim()) payload.thumbnail = form.elements.thumbnail.value.trim();
        const result = await callLms('adminUpsertCourse', payload);
        status.textContent = `Backend saved course ${result.courseId} with status ${result.status}.`;
        form.reset();
        await loadAdmin();
      } catch (error) {
        statusText(form, readableError(error), true);
      } finally {
        save.disabled = false;
      }
    });
    section.append(form);
  }
  root.append(section);
}

function buildContentSection() {
  const section = makeSection('Lessons and quizzes', 'Teachers can manage content only for assigned courses. All writes are independently authorized by the backend.');
  const courseSelect = makeSelect('contentCourse', 'Assigned course');
  courses.forEach((course) => {
    const option = createElement('option', `${course.title} (${course.status})`);
    option.value = course.id;
    courseSelect.input.append(option);
  });
  selectedCourseId = selectedCourseId && courses.some((course) => course.id === selectedCourseId)
    ? selectedCourseId
    : courses[0]?.id || '';
  courseSelect.input.value = selectedCourseId;
  section.append(courseSelect.wrapper);
  const records = createElement('div');
  section.append(records);
  const loadContent = async () => {
    records.replaceChildren(createElement('p', 'Loading assigned course content…', 'muted'));
    try {
      selectedCourseId = courseSelect.input.value;
      managedContent = selectedCourseId
        ? await callLms('teacherGetCourseContent', { courseId: selectedCourseId })
        : { lessons: [], quizzes: [] };
      records.replaceChildren();
      const lessonTable = makeSection('Lessons');
      appendTable(lessonTable, ['ID', 'Title', 'Status', 'Order', 'Action'], managedContent.lessons.map((lesson) => {
        const buttons = createElement('div', undefined, 'admin-actions');
        buttons.append(action('Edit', () => {
          lessonForm.elements.lessonId.value = lesson.id;
          lessonForm.elements.title.value = lesson.title || '';
          lessonForm.elements.description.value = lesson.description || '';
          lessonForm.elements.content.value = lesson.content || '';
          lessonForm.elements.videoUrl.value = lesson.videoUrl || '';
          lessonForm.elements.materialUrl.value = lesson.materialUrl || '';
          lessonForm.elements.order.value = String(lesson.order ?? 0);
          lessonForm.elements.duration.value = lesson.duration || '';
          lessonForm.elements.status.value = lesson.status || 'draft';
        }));
        if (lesson.status !== 'archived') buttons.append(action('Archive', (event) => reportAction(event.currentTarget,
          () => callLms('teacherArchiveLesson', { courseId: selectedCourseId, lessonId: lesson.id }), 'Lesson archived.')));
        return [lesson.id, lesson.title, lesson.status, String(lesson.order ?? 0), buttons];
      }));
      records.append(lessonTable);

      const lessonForm = createElement('form', undefined, 'content-card stack');
      lessonForm.append(createElement('h3', 'Add or update lesson'));
      [
        field('lessonId', 'Lesson ID (blank to create)'),
        field('title', 'Title', { required: true }),
        field('description', 'Description', { multiline: true, required: true }),
        field('content', 'Lesson content', { multiline: true }),
        field('videoUrl', 'Video URL (HTTPS)'),
        field('materialUrl', 'Learning material URL (HTTPS)'),
        field('order', 'Order', { type: 'number', min: 0, step: 1, required: true }),
        field('duration', 'Duration', { required: true }),
        field('status', 'Status', { choices: [['draft', 'Draft'], ['published', 'Published'], ['archived', 'Archived']] })
      ].forEach(({ wrapper }) => lessonForm.append(wrapper));
      const lessonSave = createElement('button', 'Save lesson', 'btn btn-primary');
      lessonSave.type = 'submit';
      lessonForm.append(lessonSave);
      lessonForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!lessonForm.reportValidity()) return;
        lessonSave.disabled = true;
        try {
          const payload = {
            courseId: selectedCourseId,
            title: lessonForm.elements.title.value,
            description: lessonForm.elements.description.value,
            content: lessonForm.elements.content.value,
            order: Number(lessonForm.elements.order.value),
            duration: lessonForm.elements.duration.value,
            status: lessonForm.elements.status.value
          };
          ['lessonId', 'videoUrl', 'materialUrl'].forEach((name) => {
            if (lessonForm.elements[name].value.trim()) payload[name] = lessonForm.elements[name].value.trim();
          });
          await callLms('teacherUpsertLesson', payload);
          await loadContent();
        } catch (error) {
          statusText(lessonForm, readableError(error), true);
        } finally {
          lessonSave.disabled = false;
        }
      });
      records.append(lessonForm);

      const quizTable = makeSection('Quizzes');
      appendTable(quizTable, ['ID', 'Title', 'Status', 'Attempts', 'Action'], managedContent.quizzes.map((quiz) => {
        const edit = action('Edit', () => {
          quizForm.elements.quizId.value = quiz.id;
          quizForm.elements.title.value = quiz.title || '';
          quizForm.elements.status.value = quiz.status || 'draft';
          quizForm.elements.questions.value = JSON.stringify(quiz.questions || [], null, 2);
          quizForm.elements.passPercentage.value = String(quiz.passPercentage ?? 70);
          quizForm.elements.maxAttempts.value = String(quiz.maxAttempts ?? 3);
          quizForm.elements.durationSeconds.value = String(quiz.durationSeconds ?? 1800);
        });
        return [quiz.id, quiz.title, quiz.status, String(quiz.maxAttempts ?? 3), edit];
      }));
      records.append(quizTable);

      const quizForm = createElement('form', undefined, 'content-card stack');
      quizForm.append(createElement('h3', 'Add or update quiz'));
      [
        field('quizId', 'Quiz ID (blank to create)'),
        field('title', 'Title', { required: true }),
        field('status', 'Status', { choices: [['draft', 'Draft'], ['published', 'Published'], ['archived', 'Archived']] }),
        field('questions', 'Questions JSON (answer indexes are sent to the trusted teacher/admin backend)', { multiline: true, rows: 12, required: true }),
        field('passPercentage', 'Pass percentage', { type: 'number', min: 1, step: 1, required: true }),
        field('maxAttempts', 'Maximum attempts', { type: 'number', min: 1, step: 1, required: true }),
        field('durationSeconds', 'Duration in seconds', { type: 'number', min: 60, step: 1, required: true })
      ].forEach(({ wrapper }) => quizForm.append(wrapper));
      const quizSave = createElement('button', 'Save quiz', 'btn btn-primary');
      quizSave.type = 'submit';
      quizForm.append(quizSave);
      quizForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!quizForm.reportValidity()) return;
        quizSave.disabled = true;
        try {
          const payload = {
            courseId: selectedCourseId,
            title: quizForm.elements.title.value,
            status: quizForm.elements.status.value,
            questions: JSON.parse(quizForm.elements.questions.value),
            passPercentage: Number(quizForm.elements.passPercentage.value),
            maxAttempts: Number(quizForm.elements.maxAttempts.value),
            durationSeconds: Number(quizForm.elements.durationSeconds.value)
          };
          if (quizForm.elements.quizId.value.trim()) payload.quizId = quizForm.elements.quizId.value.trim();
          await callLms('teacherUpsertQuiz', payload);
          await loadContent();
        } catch (error) {
          statusText(quizForm, error instanceof SyntaxError ? 'Questions must be valid JSON.' : readableError(error), true);
        } finally {
          quizSave.disabled = false;
        }
      });
      records.append(quizForm);

      const enrollments = makeSection('Course enrollments');
      const viewEnrollments = createElement('button', 'Load enrolled learners', 'btn btn-secondary');
      viewEnrollments.type = 'button';
      const enrollmentOutput = createElement('div');
      viewEnrollments.addEventListener('click', async () => {
        viewEnrollments.disabled = true;
        try {
          const result = await callLms('listCourseEnrollmentsForTeacher', { courseId: selectedCourseId });
          enrollmentOutput.replaceChildren();
          appendTable(enrollmentOutput, ['Student Auth UID', 'Status'], result.enrollments.map((item) => [item.studentId, item.status]));
        } catch (error) {
          statusText(enrollmentOutput, readableError(error), true);
        } finally {
          viewEnrollments.disabled = false;
        }
      });
      enrollments.append(viewEnrollments, enrollmentOutput);
      records.append(enrollments);
    } catch (error) {
      records.replaceChildren(createElement('p', readableError(error), 'status-message error'));
    }
  };
  courseSelect.input.addEventListener('change', loadContent);
  root.append(section);
  if (selectedCourseId) loadContent();
}

async function buildAdminUserSection() {
  const section = makeSection('Users and roles', 'Role changes use trusted Auth custom claims and are available only to the backend-authorized admin.');
  const load = createElement('button', 'Load users', 'btn btn-secondary');
  load.type = 'button';
  const nextPage = createElement('button', 'Load next user page', 'btn btn-secondary');
  nextPage.type = 'button';
  nextPage.hidden = true;
  const output = createElement('div');
  let pageToken = null;
  let users = [];
  const renderUsers = () => {
    output.replaceChildren();
    appendTable(output, ['Auth UID', 'Email', 'Name', 'Verified', 'Role', 'Change role'], users.map((user) => {
      const control = createElement('div', undefined, 'admin-actions');
      const select = createElement('select');
      const unset = createElement('option', 'Choose role');
      unset.value = '';
      select.append(unset);
      [['student', 'Student'], ['teacher', 'Teacher'], ['admin', 'Admin']].forEach(([value, label]) => {
        const option = createElement('option', label);
        option.value = value;
        select.append(option);
      });
      select.value = user.role || '';
      control.append(select, action('Assign', async (event) => {
        await reportAction(event.currentTarget, async () => {
          if (!select.value) throw new Error('Choose a role before assigning.');
          await callLms('adminSetUserRole', { targetUid: user.uid, role: select.value });
        });
      }));
      return [user.uid, user.email, user.displayName, user.emailVerified ? 'Yes' : 'No', user.role || 'Unassigned', control];
    }));
  };
  const fetchUsers = async (reset) => {
    load.disabled = true;
    nextPage.disabled = true;
    try {
      if (reset) {
        pageToken = null;
        users = [];
      }
      const result = await callLms('adminListUsers', pageToken ? { pageToken } : {});
      users.push(...result.users);
      pageToken = result.nextPageToken;
      renderUsers();
      nextPage.hidden = !pageToken;
    } catch (error) {
      statusText(output, readableError(error), true);
    } finally {
      load.disabled = false;
      nextPage.disabled = false;
    }
  };
  load.addEventListener('click', () => fetchUsers(true));
  nextPage.addEventListener('click', () => fetchUsers(false));
  section.append(load, nextPage, output);
  root.append(section);
}

async function buildCertificateSection() {
  const section = makeSection('Issued certificates', 'Certificate status and revocation are read and changed through admin-authorized callables.');
  const load = createElement('button', 'Load certificates', 'btn btn-secondary');
  load.type = 'button';
  const output = createElement('div');
  load.addEventListener('click', async () => {
    load.disabled = true;
    try {
      const result = await callLms('adminListCertificates');
      output.replaceChildren();
      appendTable(output, ['Certificate ID', 'Learner', 'Course', 'Status', 'Issued', 'Action'], result.certificates.map((certificate) => {
        const actionCell = certificate.status === 'valid'
          ? action('Revoke', async (event) => {
            await reportAction(event.currentTarget,
              () => callLms('adminRevokeCertificate', { certificateId: certificate.certificateId }),
              'Certificate revoked.');
          })
          : 'No action';
        return [
          certificate.certificateId,
          certificate.studentName,
          certificate.courseName,
          certificate.status,
          certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : '',
          actionCell
        ];
      }));
    } catch (error) {
      statusText(output, readableError(error), true);
    } finally {
      load.disabled = false;
    }
  });
  section.append(load, output);
  root.append(section);
}

async function loadAdmin() {
  root.hidden = false;
  root.replaceChildren(createElement('p', 'Checking trusted CWU authorization…', 'muted'));
  try {
    const user = await waitForAuth();
    if (!user || !user.emailVerified) {
      root.replaceChildren(createElement('p', 'Sign in with a verified account to access admin or teacher tools.', 'status-message error'));
      return;
    }
    access = await callLms('getCurrentUserAccess');
    if (!['admin', 'teacher'].includes(access.role)) {
      root.replaceChildren(createElement('p', 'Backend authorization denied this account. The displayed role is not used to grant access.', 'status-message error'));
      return;
    }
    const courseResult = await callLms('listTeacherCourses');
    courses = courseResult.courses || [];
    root.replaceChildren(createElement('p', `Authorized backend role: ${access.role}. Sensitive requests are still checked server-side.`, 'notice'));
    if (access.role === 'admin') buildCourseSection();
    buildContentSection();
    if (access.role === 'admin') {
      await buildAdminUserSection();
      await buildCertificateSection();
    }
    if (!courses.length) root.append(createElement('p', 'No assigned/published courses are available.', 'empty-state'));
  } catch (error) {
    root.replaceChildren(createElement('p', `Backend authorization or data is unavailable: ${readableError(error)}`, 'status-message error'));
  }
}

if (root) loadAdmin().catch((error) => {
  root.hidden = false;
  root.replaceChildren(createElement('p', readableError(error), 'status-message error'));
});
