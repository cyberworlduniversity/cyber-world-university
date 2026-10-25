import { supabase } from './supabase-client.js';

export { supabase };
export const auth = supabase.auth;
export function onAuthStateChanged(callback) { const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null)); return () => subscription.unsubscribe(); }
export function signOut() { return supabase.auth.signOut(); }
export async function waitForAuth() { const { data: { session } } = await supabase.auth.getSession(); return session?.user || null; }
async function requireUser() { const user = await waitForAuth(); if (!user || !user.email_confirmed_at) { const error = new Error('Sign in with a verified account to continue.'); error.code = 'unauthenticated'; throw error; } return user; }

export async function callLms(name, data = {}) {
  const user = await waitForAuth();
  if (name === 'listPublishedCourses') {
    const { data: courses, error } = await supabase.from('cwu_courses').select('id,title,slug,description,category,level,duration_minutes,instructor_id,thumbnail_url,is_published,is_archived,price_inr').eq('is_published', true).eq('is_archived', false).order('created_at', { ascending: false });
    if (error) throw error;
    let enrollmentMap = new Map();
    if (user?.email_confirmed_at) { const { data: enrollments, error: enrollmentError } = await supabase.from('cwu_enrollments').select('course_id,status').eq('student_id', user.id); if (enrollmentError) throw enrollmentError; enrollmentMap = new Map((enrollments || []).map((item) => [item.course_id, item.status])); }
    const instructorIds = [...new Set((courses || []).map((c) => c.instructor_id).filter(Boolean))]; let instructors = new Map();
    if (instructorIds.length) { const { data: profiles, error: profileError } = await supabase.from('cwu_profiles').select('id,full_name').in('id', instructorIds); if (profileError) throw profileError; instructors = new Map((profiles || []).map((p) => [p.id, p.full_name])); }
    return { courses: (courses || []).map((course) => ({ id: course.id, title: course.title, slug: course.slug, description: course.description, category: course.category, level: course.level, duration: course.duration_minutes ? `${course.duration_minutes} min` : '', instructor: instructors.get(course.instructor_id) || 'CWU instructional team', thumbnail: course.thumbnail_url, price: Number(course.price_inr || 0), currency: 'INR', status: 'published', enrollmentStatus: enrollmentMap.get(course.id) || null })) };
  }
  if (name === 'enrollInCourse') { await requireUser(); const { data: result, error } = await supabase.rpc('cwu_enroll_in_free_course', { p_course_id: data.courseId }); if (error) throw error; return { enrollment: Array.isArray(result) ? result[0] : result }; }
  if (name === 'updateLessonProgress') { await requireUser(); const { data: result, error } = await supabase.rpc('cwu_complete_lesson', { p_lesson_id: data.lessonId }); if (error) throw error; return Array.isArray(result) ? result[0] : result; }
  if (name === 'issueCourseCertificate') { await requireUser(); const { data: result, error } = await supabase.rpc('cwu_issue_course_certificate', { p_course_id: data.courseId }); if (error) throw error; return { status: 'issued', ...(Array.isArray(result) ? result[0] : result) }; }
  if (name === 'startQuizAttempt') { await requireUser(); const { data: result, error } = await supabase.rpc('cwu_start_quiz_attempt', { p_quiz_id: data.quizId }); if (error) throw error; return Array.isArray(result) ? result[0] : result; }
  if (name === 'submitQuizAttempt') { await requireUser(); const { data: result, error } = await supabase.rpc('cwu_submit_quiz_attempt', { p_attempt_id: data.attemptId, p_answers: data.answers || [] }); if (error) throw error; return Array.isArray(result) ? result[0] : result; }
  if (name === 'verifyCertificate') { const { data: result, error } = await supabase.rpc('cwu_verify_certificate', { p_verification_code: data.verificationCode }); if (error) throw error; return Array.isArray(result) ? result[0] : result; }
  if (name === 'getEnrolledCourseContent') { await requireUser(); const { data: lessons, error } = await supabase.from('cwu_lessons').select('*').eq('course_id', data.courseId).eq('is_published', true).order('sort_order'); if (error) throw error; return { lessons: (lessons || []).map((lesson) => ({ id: lesson.id, title: lesson.title, description: lesson.description, content: lesson.content, videoUrl: lesson.video_url, materialUrl: lesson.material_url, order: lesson.sort_order })) }; }
  if (name === 'listEnrolledCourseQuizzes') { await requireUser(); const { data: quizzes, error } = await supabase.from('cwu_quizzes').select('id,title,description,time_limit_seconds,pass_percent,version').eq('course_id', data.courseId).eq('is_published', true).order('created_at'); if (error) throw error; return { quizzes: quizzes || [] }; }
  if (name === 'getStudentDashboard') { const currentUser = await requireUser(); const [{ data: enrollments, error: enrollmentError }, { data: progress, error: progressError }, { data: certificates, error: certificateError }] = await Promise.all([supabase.from('cwu_enrollments').select('id,course_id,status,enrolled_at,completed_at').eq('student_id', currentUser.id), supabase.from('cwu_lesson_progress').select('lesson_id,completed,progress_percent,updated_at').eq('student_id', currentUser.id), supabase.from('cwu_certificates').select('id,certificate_number,course_id,issued_at,certificate_url').eq('student_id', currentUser.id)]); if (enrollmentError) throw enrollmentError; if (progressError) throw progressError; if (certificateError) throw certificateError; return { enrollments: enrollments || [], progress: progress || [], certificates: certificates || [], quizAttempts: [] }; }
  const error = new Error(`Supabase LMS operation is not implemented: ${name}`); error.code = 'cwu/not-implemented'; throw error;
}
export function readableError(error) { if (error?.code === 'unauthenticated' || error?.code === 'PGRST301') return 'Sign in with a verified account to continue.'; if (error?.code === '42501') return 'Your account is not authorized to perform this action.'; return error?.message || 'The request failed. Please try again later.'; }
export function setStatus(element, message, isError = false) { if (!element) return; element.textContent = message; element.classList.toggle('error', isError); }
export function createElement(tag, text, className) { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; if (className) element.className = className; return element; }
