(function () {
  const printButton = document.querySelector('[data-print-preview]');
  if (printButton) printButton.addEventListener('click', () => window.print());

  const dashboard = document.querySelector('.dashboard-main');
  if (!dashboard) return;

  const courseId = new URLSearchParams(window.location.search).get('course');
  if (!courseId) return;

  const course = (window.CWU_COURSES || []).find((item) => item.id === courseId);
  const section = document.createElement('section');
  section.className = 'dashboard-card';
  section.setAttribute('aria-labelledby', 'selected-course-title');

  const heading = document.createElement('h2');
  heading.id = 'selected-course-title';
  heading.textContent = 'Course selected';
  section.append(heading);

  const description = document.createElement('p');
  const link = document.createElement('a');
  link.className = 'btn btn-primary';

  if (course) {
    description.textContent = `${course.title} is ready to continue in this sample dashboard. Enrollment and progress are not saved.`;
    link.href = `course-details.html?id=${encodeURIComponent(course.id)}`;
    link.textContent = 'Continue to course';
  } else {
    description.textContent = 'The selected course could not be found. Browse the catalog to choose a course.';
    link.href = 'courses.html';
    link.textContent = 'Browse courses';
  }

  section.append(description, link);
  dashboard.insertBefore(section, dashboard.children[1] || null);
}());
