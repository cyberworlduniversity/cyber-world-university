import { supabase } from '../supabase/lms-client.js';
import { getCurrentUserProfile } from '../supabase/profiles.js';
import { createElement, readableError, waitForAuth } from '../supabase/lms-client.js';

const root = document.getElementById('admin-app');
let user;
let profile;
let courses = [];
let selectedCourseId = '';

const message = (text, error = false) => createElement('p', text, error ? 'status-message error' : 'status-message');
const button = (text, handler, cls = 'btn btn-secondary') => {
  const b = createElement('button', text, cls);
  b.type = 'button';
  b.addEventListener('click', handler);
  return b;
};

function formField(name, labelText, opts = {}) {
  const wrap = createElement('label', undefined, 'form-control');
  wrap.append(createElement('span', labelText));
  const input = opts.multiline ? createElement('textarea') : createElement('input');
  if (!opts.multiline) input.type = opts.type || 'text';
  if (opts.multiline) input.rows = opts.rows || 5;
  input.name = name;
  input.required = Boolean(opts.required);
  if (opts.min !== undefined) input.min = String(opts.min);
  if (opts.step !== undefined) input.step = String(opts.step);
  if (opts.placeholder) input.placeholder = opts.placeholder;
  wrap.append(input);
  return { wrap, input };
}

function section(title, description) {
  const s = createElement('section', undefined, 'admin-card stack');
  s.append(createElement('h2', title));
  if (description) s.append(createElement('p', description, 'muted'));
  return s;
}

async function loadCourses() {
  let query = supabase.from('cwu_courses').select('*').order('created_at', { ascending: false });
  if (profile.role === 'teacher') query = query.eq('instructor_id', user.id);
  const { data, error } = await query;
  if (error) throw error;
  courses = data || [];
}

function courseEditor(parent) {
  const s = section('Course management', 'Admins can create and publish courses. Teachers can edit courses assigned to their account.');
  const form = createElement('form', undefined, 'content-card stack');
  const fields = [
    formField('id', 'Course ID (leave blank to create)'),
    formField('title', 'Title', { required: true }),
    formField('slug', 'Slug', { required: true }),
    formField('description', 'Description', { multiline: true, required: true }),
    formField('category', 'Category', { required: true }),
    formField('level', 'Level', { required: true, placeholder: 'beginner / intermediate / advanced' }),
    formField('duration', 'Duration in minutes', { type: 'number', min: 0, step: 1, required: true }),
    formField('instructor', 'Instructor Auth UID (admin only)'),
    formField('thumbnail', 'Thumbnail HTTPS URL'),
    formField('price', 'Price in INR', { type: 'number', min: 0, step: 0.01, required: true })
  ];
  fields.forEach((f) => form.append(f.wrap));
  const published = createElement('label', undefined, 'checkbox-control');
  const publishInput = document.createElement('input');
  publishInput.type = 'checkbox';
  published.append(publishInput, createElement('span', 'Published'));
  form.append(published);
  const archived = createElement('label', undefined, 'checkbox-control');
  const archiveInput = document.createElement('input');
  archiveInput.type = 'checkbox';
  archived.append(archiveInput, createElement('span', 'Archived'));
  form.append(archived);
  const actions = createElement('div', undefined, 'inline-actions');
  const save = button('Save course', () => form.requestSubmit(), 'btn btn-primary');
  const clear = button('Clear', () => form.reset());
  actions.append(save, clear);
  form.append(actions);
  const status = createElement('p', '', 'status-message');
  form.append(status);

  const select = createElement('select', undefined, 'form-control');
  select.innerHTML = '<option value="">Select an existing course to edit</option>';
  courses.forEach((course) => select.append(new Option(`${course.title} — ${course.is_published ? 'published' : 'draft'}`, course.id)));
  select.addEventListener('change', () => {
    const course = courses.find((item) => item.id === select.value);
    if (!course) { form.reset(); return; }
    form.elements.id.value = course.id;
    form.elements.title.value = course.title;
    form.elements.slug.value = course.slug;
    form.elements.description.value = course.description || '';
    form.elements.category.value = course.category;
    form.elements.level.value = course.level;
    form.elements.duration.value = course.duration_minutes;
    form.elements.instructor.value = course.instructor_id || '';
    form.elements.thumbnail.value = course.thumbnail_url || '';
    form.elements.price.value = course.price_inr;
    publishInput.checked = course.is_published;
    archiveInput.checked = course.is_archived;
    selectedCourseId = course.id;
  });
  s.append(select, form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    save.disabled = true;
    try {
      const id = form.elements.id.value.trim();
      const payload = {
        title: form.elements.title.value.trim(), slug: form.elements.slug.value.trim(),
        description: form.elements.description.value.trim(), category: form.elements.category.value.trim(),
        level: form.elements.level.value.trim(), duration_minutes: Number(form.elements.duration.value),
        thumbnail_url: form.elements.thumbnail.value.trim() || null, price_inr: Number(form.elements.price.value),
        is_published: publishInput.checked, is_archived: archiveInput.checked
      };
      if (profile.role === 'admin') payload.instructor_id = form.elements.instructor.value.trim() || null;
      else payload.instructor_id = user.id;
      const query = id ? supabase.from('cwu_courses').update(payload).eq('id', id) : supabase.from('cwu_courses').insert(payload);
      const { error } = await query;
      if (error) throw error;
      status.textContent = 'Course saved successfully.';
      await refreshAdmin();
    } catch (error) { status.textContent = readableError(error); status.classList.add('error'); }
    finally { save.disabled = false; }
  });
  parent.append(s);
}

async function contentEditor(parent) {
  if (!courses.length) return;
  const s = section('Lessons and quizzes', 'All writes are protected by Supabase RLS.');
  const courseSelect = document.createElement('select');
  courses.forEach((course) => courseSelect.append(new Option(course.title, course.id)));
  courseSelect.value = selectedCourseId || courses[0].id;
  selectedCourseId = courseSelect.value;
  s.append(createElement('label', 'Course'), courseSelect);
  const output = createElement('div', undefined, 'stack');
  s.append(output);

  const render = async () => {
    selectedCourseId = courseSelect.value;
    output.replaceChildren(createElement('p', 'Loading content…', 'muted'));
    const [{ data: lessons, error: lessonError }, { data: quizzes, error: quizError }] = await Promise.all([
      supabase.from('cwu_lessons').select('*').eq('course_id', selectedCourseId).order('sort_order'),
      supabase.from('cwu_quizzes').select('*').eq('course_id', selectedCourseId).order('created_at')
    ]);
    if (lessonError) throw lessonError;
    if (quizError) throw quizError;
    output.replaceChildren();

    const lessonBox = section('Lessons');
    (lessons || []).forEach((lesson) => {
      const row = createElement('div', undefined, 'admin-row');
      row.append(createElement('strong', `${lesson.sort_order}. ${lesson.title}`), createElement('span', lesson.is_published ? 'Published' : 'Draft'));
      row.append(button('Archive', async () => {
        const { error } = await supabase.from('cwu_lessons').update({ is_published: false }).eq('id', lesson.id);
        if (error) throw error; await render();
      }));
      lessonBox.append(row);
    });
    const lessonForm = createElement('form', undefined, 'content-card stack');
    ['id','title','description','content','video_url','material_url','sort_order'].forEach((name) => lessonForm.append(formField(name, name.replaceAll('_',' '), { multiline: ['description','content'].includes(name), type: name === 'sort_order' ? 'number' : 'text', min: name === 'sort_order' ? 0 : undefined, required: ['title','description','content','sort_order'].includes(name) }).wrap));
    const lessonPub = document.createElement('input'); lessonPub.type = 'checkbox'; lessonPub.checked = true;
    lessonForm.append(createElement('label', undefined, 'checkbox-control'), lessonPub, createElement('span', 'Publish lesson'));
    const lessonSave = button('Save lesson', () => lessonForm.requestSubmit(), 'btn btn-primary'); lessonForm.append(lessonSave);
    lessonForm.addEventListener('submit', async (event) => {
      event.preventDefault(); lessonSave.disabled = true;
      try {
        const p = { course_id: selectedCourseId, title: lessonForm.elements.title.value.trim(), description: lessonForm.elements.description.value.trim(), content: lessonForm.elements.content.value.trim(), video_url: lessonForm.elements.video_url.value.trim() || null, material_url: lessonForm.elements.material_url.value.trim() || null, sort_order: Number(lessonForm.elements.sort_order.value), is_published: lessonPub.checked };
        const id = lessonForm.elements.id.value.trim();
        const { error } = id ? await supabase.from('cwu_lessons').update(p).eq('id', id) : await supabase.from('cwu_lessons').insert(p);
        if (error) throw error; await render();
      } catch (error) { lessonForm.append(message(readableError(error), true)); }
      finally { lessonSave.disabled = false; }
    });
    lessonBox.append(lessonForm); output.append(lessonBox);

    const quizBox = section('Quizzes');
    (quizzes || []).forEach((quiz) => quizBox.append(createElement('p', `${quiz.title} — ${quiz.is_published ? 'Published' : 'Draft'} — ${quiz.pass_percent}% pass`)));
    const quizForm = createElement('form', undefined, 'content-card stack');
    ['id','title','description'].forEach((name) => quizForm.append(formField(name, name, { multiline: name === 'description', required: name === 'title' }).wrap));
    quizForm.append(formField('time_limit_seconds', 'Time limit (seconds)', { type: 'number', min: 60, step: 1, required: true }).wrap);
    quizForm.append(formField('pass_percent', 'Pass percentage', { type: 'number', min: 1, step: 1, required: true }).wrap);
    const quizPub = document.createElement('input'); quizPub.type = 'checkbox'; quizPub.checked = true;
    quizForm.append(createElement('label', 'Publish quiz'), quizPub);
    const quizSave = button('Save quiz', () => quizForm.requestSubmit(), 'btn btn-primary'); quizForm.append(quizSave);
    quizForm.addEventListener('submit', async (event) => {
      event.preventDefault(); quizSave.disabled = true;
      try {
        const p = { course_id: selectedCourseId, title: quizForm.elements.title.value.trim(), description: quizForm.elements.description.value.trim(), time_limit_seconds: Number(quizForm.elements.time_limit_seconds.value), pass_percent: Number(quizForm.elements.pass_percent.value), is_published: quizPub.checked };
        const id = quizForm.elements.id.value.trim();
        const result = id ? await supabase.from('cwu_quizzes').update(p).eq('id', id) : await supabase.from('cwu_quizzes').insert(p);
        if (result.error) throw result.error; await render();
      } catch (error) { quizForm.append(message(readableError(error), true)); }
      finally { quizSave.disabled = false; }
    });
    quizBox.append(quizForm); output.append(quizBox);
  };
  courseSelect.addEventListener('change', render);
  parent.append(s);
  await render();
}

async function adminUsers(parent) {
  if (profile.role !== 'admin') return;
  const s = section('Users and roles', 'Only an existing administrator can change the application role. Auth credentials are never exposed here.');
  const output = createElement('div');
  const load = button('Refresh users', async () => {
    load.disabled = true;
    try {
      const { data, error } = await supabase.from('cwu_profiles').select('id,full_name,role,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      output.replaceChildren();
      (data || []).forEach((item) => {
        const row = createElement('div', undefined, 'admin-row');
        row.append(createElement('span', `${item.full_name || 'Unnamed'} — ${item.id}`));
        const select = document.createElement('select');
        ['student','teacher','admin'].forEach((role) => select.append(new Option(role, role)));
        select.value = item.role;
        const save = button('Save role', async () => {
          save.disabled = true;
          try { const { error } = await supabase.rpc('cwu_admin_set_user_role', { p_user_id: item.id, p_role: select.value }); if (error) throw error; await load.click(); }
          catch (error) { output.append(message(readableError(error), true)); }
          finally { save.disabled = false; }
        });
        row.append(select, save); output.append(row);
      });
    } catch (error) { output.replaceChildren(message(readableError(error), true)); }
    finally { load.disabled = false; }
  });
  s.append(load, output); parent.append(s); await load.click();
}

async function certificates(parent) {
  if (profile.role !== 'admin') return;
  const s = section('Certificates', 'Issued certificates are read-only here; certificate issuance remains controlled by the eligibility RPC.');
  const output = createElement('div');
  try {
    const { data, error } = await supabase.from('cwu_certificates').select('id,certificate_number,student_id,course_id,issued_at,certificate_url').order('issued_at', { ascending: false });
    if (error) throw error;
    (data || []).forEach((c) => s.append(createElement('p', `${c.certificate_number} — ${c.student_id} — ${c.course_id} — ${new Date(c.issued_at).toLocaleDateString()}`)));
    if (!data?.length) s.append(createElement('p', 'No certificates have been issued yet.', 'empty-state'));
  } catch (error) { s.append(message(readableError(error), true)); }
  parent.append(s);
}

async function refreshAdmin() {
  await loadCourses();
  root.replaceChildren(message(`Signed in as ${profile.role}. Supabase RLS protects every database write.`));
  const content = createElement('div', undefined, 'stack');
  courseEditor(content);
  await contentEditor(content);
  await adminUsers(content);
  await certificates(content);
  root.append(content);
}

async function init() {
  if (!root) return;
  root.hidden = false;
  try {
    user = await waitForAuth();
    if (!user?.email_confirmed_at) throw new Error('A verified account is required for admin or teacher tools.');
    profile = await getCurrentUserProfile();
    if (!['admin', 'teacher'].includes(profile?.role)) throw new Error('Your account is not authorized for admin or teacher tools.');
    await refreshAdmin();
  } catch (error) { root.replaceChildren(message(readableError(error), true)); }
}

init();
