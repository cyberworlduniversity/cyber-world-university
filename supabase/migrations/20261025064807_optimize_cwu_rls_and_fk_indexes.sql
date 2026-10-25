-- CWU production database optimization
-- Applied to Supabase project plmjrdokggqprmmylflu on 2026-10-25.

create index if not exists cwu_certificates_course_idx on public.cwu_certificates (course_id);
create index if not exists cwu_courses_instructor_idx on public.cwu_courses (instructor_id);
create index if not exists cwu_lesson_progress_lesson_idx on public.cwu_lesson_progress (lesson_id);
create index if not exists cwu_quiz_answers_question_idx on public.cwu_quiz_answers (question_id);
create index if not exists cwu_quiz_attempts_quiz_idx on public.cwu_quiz_attempts (quiz_id);
create index if not exists cwu_quizzes_lesson_idx on public.cwu_quizzes (lesson_id);

alter policy cwu_certificates_admin_write on public.cwu_certificates
  using (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

alter policy cwu_courses_admin_write on public.cwu_courses
  using (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

alter policy cwu_courses_teacher_update on public.cwu_courses
  using (instructor_id = (select auth.uid()) and cwu_has_role(array['teacher']))
  with check (instructor_id = (select auth.uid()) and cwu_has_role(array['teacher']));

alter policy cwu_enrollments_admin_write on public.cwu_enrollments
  using (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

alter policy cwu_enrollments_student_read on public.cwu_enrollments
  using (student_id = (select auth.uid()));

alter policy cwu_progress_student_read on public.cwu_lesson_progress
  using (student_id = (select auth.uid()));

alter policy cwu_lessons_admin_write on public.cwu_lessons
  using (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

alter policy cwu_profiles_select_self_or_staff on public.cwu_profiles
  using (id = (select auth.uid()) or cwu_has_role(array['admin']) or cwu_is_assigned_teacher_for_student(id));

alter policy cwu_profiles_update_self on public.cwu_profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy cwu_answers_student_read on public.cwu_quiz_answers
  using (exists (select 1 from public.cwu_quiz_attempts a where a.id = cwu_quiz_answers.attempt_id and a.student_id = (select auth.uid()) and a.submitted_at is not null));

alter policy cwu_attempts_student_read on public.cwu_quiz_attempts
  using (student_id = (select auth.uid()));

alter policy cwu_quizzes_admin_write on public.cwu_quizzes
  using (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.cwu_profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
