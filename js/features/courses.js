(function () {
  const courses = window.CWU_COURSES || [];
  const uniqueCourseValues = (key) => [...new Set(courses.flatMap((course) => course[key] || []))]
    .sort((first, second) => first.localeCompare(second));

  const courseTotals = {
    courses: courses.length,
    topics: courses.reduce((total, course) => total + course.topics, 0),
    modules: courses.reduce((total, course) => total + course.modules, 0)
  };
  document.querySelectorAll('[data-cwu-stat]').forEach((stat) => {
    stat.textContent = String(courseTotals[stat.dataset.cwuStat] ?? 0);
  });

  function courseImageSource(course) {
    const pagePrefix = window.location.pathname.includes('/pages/') ? '../' : '';
    return `${pagePrefix}${course.image}`;
  }

  function createCourseImage(course, className) {
    const frame = document.createElement('div');
    frame.className = `course-card-image ${className}`;
    const element = document.createElement('img');
    element.className = 'course-card-image-source';
    element.src = courseImageSource(course);
    element.alt = course.imageAlt || `${course.title} course artwork`;
    element.width = 800;
    element.height = 450;
    element.loading = 'lazy';
    element.decoding = 'async';
    element.addEventListener('error', () => {
      element.hidden = true;
      frame.classList.add('is-fallback');
      frame.setAttribute('role', 'img');
      frame.setAttribute('aria-label', `Course image unavailable for ${course.title}`);
      const message = document.createElement('span');
      message.className = 'course-image-fallback-message';
      message.textContent = 'Image unavailable · CWU';
      frame.append(message);
    }, { once: true });

    const overlay = document.createElement('span');
    overlay.className = 'course-image-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    const badge = document.createElement('span');
    badge.className = 'course-image-category';
    badge.textContent = course.category;
    overlay.append(badge);
    frame.append(element, overlay);
    return frame;
  }

  const featured = document.getElementById('featured-course-grid');
  if (featured) {
    const visualNames = ['one', 'two', 'three', 'four', 'five', 'six'];
    courses.slice(0, 6).forEach((course, index) => {
      const card = document.createElement('article');
      card.className = 'course-card reveal';
      const visual = document.createElement('div');
      visual.className = `course-visual course-visual-${visualNames[index % visualNames.length]}`;
      visual.classList.add('has-image');
      visual.append(createCourseImage(course, 'featured-course-image'));
      const body = document.createElement('div');
      body.className = 'course-body';
      const tags = document.createElement('div');
      tags.className = 'tag-row';
      const category = document.createElement('span');
      category.className = 'course-tag';
      category.textContent = course.category;
      const level = document.createElement('span');
      level.className = 'course-level';
      level.textContent = course.level;
      tags.append(category, level);
      const heading = document.createElement('h3');
      heading.textContent = course.title;
      const details = document.createElement('ul');
      [`${course.duration}`, `${course.topics} topics`, course.certificate ? 'Certificate available' : 'No certificate'].forEach((value) => {
        const item = document.createElement('li');
        item.textContent = value;
        details.append(item);
      });
      const description = document.createElement('p');
      description.textContent = course.description;
      const progress = document.createElement('p');
      progress.className = 'course-progress-note';
      progress.textContent = 'Progress: not tracked in this demo';
      const link = document.createElement('a');
      link.className = 'btn btn-primary';
      link.href = `pages/course-details.html?id=${encodeURIComponent(course.id)}`;
      link.textContent = 'View course';
      body.append(tags, heading, details, description, progress, link);
      card.append(visual, body);
      featured.append(card);
    });
  }

  const catalog = document.getElementById('course-catalog');
  if (catalog) {
    const search = document.getElementById('course-search');
    const category = document.getElementById('category-filter');
    const level = document.getElementById('level-filter');
    const duration = document.getElementById('duration-filter');
    const certificate = document.getElementById('certificate-filter');
    const technology = document.getElementById('technology-filter');
    const learningType = document.getElementById('learning-type-filter');
    const clearSearch = document.getElementById('clear-course-search');
    const clearFilters = document.getElementById('clear-course-filters');
    const count = document.getElementById('course-result-count');

    uniqueCourseValues('technologies').forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      technology.append(option);
    });
    uniqueCourseValues('learningType').forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      learningType.append(option);
    });

    function renderCourses() {
      const query = (search.value || '').trim().toLowerCase();
      clearSearch.disabled = !search.value;
      clearFilters.disabled = !query && !category.value && !level.value && !duration.value
        && !certificate.value && !technology.value && !learningType.value;
      const matches = courses.filter((course) => {
        const searchText = [
          course.title,
          course.category,
          course.description,
          course.level,
          course.learningType,
          ...(course.technologies || []),
          ...(course.skills || [])
        ].join(' ').toLowerCase();
        const textMatches = searchText.includes(query);
        const categoryMatches = !category.value || course.category === category.value;
        const levelMatches = !level.value || course.level === level.value;
        const hours = Number.parseInt(course.duration, 10);
        const durationMatches = !duration.value
          || (duration.value === 'short' && hours <= 4)
          || (duration.value === 'medium' && hours >= 5 && hours <= 6)
          || (duration.value === 'long' && hours >= 7);
        const certificateMatches = !certificate.value
          || (certificate.value === 'yes' && course.certificate)
          || (certificate.value === 'no' && !course.certificate);
        const technologyMatches = !technology.value || (course.technologies || []).includes(technology.value);
        const learningTypeMatches = !learningType.value || course.learningType === learningType.value;
        return textMatches && categoryMatches && levelMatches && durationMatches && certificateMatches
          && technologyMatches && learningTypeMatches;
      });

      catalog.replaceChildren();
      matches.forEach((course) => {
        const card = document.createElement('article');
        card.className = 'catalog-card';
        const courseImage = createCourseImage(course, 'catalog-course-image');
        const title = document.createElement('h2');
        title.textContent = course.title;
        const tags = document.createElement('ul');
        tags.className = 'badge-list';
        [
          course.category,
          course.level,
          course.duration,
          `${course.topics} topics`,
          `${course.modules} modules`,
          course.certificate ? 'Certificate available' : 'No certificate',
          course.learningType
        ].forEach((value) => {
          const item = document.createElement('li');
          item.textContent = value;
          tags.append(item);
        });
        const description = document.createElement('p');
        description.textContent = course.description;
        const progress = document.createElement('p');
        progress.className = 'course-progress-note';
        progress.textContent = 'Progress: not tracked in this demo';
        const link = document.createElement('a');
        link.className = 'btn btn-primary';
        link.href = `course-details.html?id=${encodeURIComponent(course.id)}`;
        link.textContent = 'View course';
        card.append(courseImage, title, tags, description, progress, link);
        catalog.append(card);
      });
      count.textContent = `${matches.length} ${matches.length === 1 ? 'course' : 'courses'} found.`;
      if (!matches.length) catalog.innerHTML = '<p class="empty-state">No courses match your filters. Try broadening your search.</p>';
    }

    [search, category, level, duration, certificate, technology, learningType].forEach((control) => {
      control.addEventListener(control === search ? 'input' : 'change', renderCourses);
    });
    clearSearch.addEventListener('click', () => {
      search.value = '';
      search.focus();
      renderCourses();
    });
    clearFilters.addEventListener('click', () => {
      [search, category, level, duration, certificate, technology, learningType].forEach((control) => {
        control.value = '';
      });
      renderCourses();
      search.focus();
    });
    renderCourses();
  }

  const technologyCatalog = document.getElementById('technology-catalog');
  if (technologyCatalog) {
    Object.entries(window.CWU_TECHNOLOGIES || {}).forEach(([categoryName, items]) => {
      const card = document.createElement('article');
      card.className = 'content-card';
      const heading = document.createElement('h3');
      heading.textContent = categoryName;
      const list = document.createElement('ul');
      list.className = 'tech-list';
      items.forEach((technology) => {
        const item = document.createElement('li');
        item.textContent = technology;
        list.append(item);
      });
      card.append(heading, list);
      technologyCatalog.append(card);
    });
  }

  const detailTitle = document.getElementById('course-title');
  if (detailTitle) {
    const params = new URLSearchParams(window.location.search);
    const selectedCourse = courses.find((course) => course.id === params.get('id')) || courses[0];
    detailTitle.textContent = selectedCourse.title;
    document.getElementById('course-description').textContent = selectedCourse.description;
    document.getElementById('course-outline-intro').textContent = selectedCourse.description;
    if (selectedCourse.image) {
      const gallery = document.createElement('div');
      gallery.className = 'course-gallery';
      gallery.setAttribute('aria-label', `${selectedCourse.title} course image`);
      gallery.append(createCourseImage(selectedCourse, 'detail-course-image'));
      document.querySelector('.page-content .content-grid').before(gallery);
    }
    const metadata = document.getElementById('course-meta');
    [selectedCourse.category, selectedCourse.level, selectedCourse.duration, `${selectedCourse.topics} topics`, `${selectedCourse.modules} modules`, selectedCourse.certificate ? 'Certificate available' : 'No certificate'].forEach((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      metadata.append(item);
    });

    const courseId = encodeURIComponent(selectedCourse.id);
    document.getElementById('course-login-link').href = `login.html?course=${courseId}`;
    document.getElementById('course-register-link').href = `register.html?course=${courseId}`;
    document.getElementById('course-practice-link').href = `quizzes.html?course=${courseId}&assessment=practice`;
    document.getElementById('course-final-link').href = `quizzes.html?course=${courseId}&assessment=final`;

    const learningOutcomes = document.getElementById('course-learning-outcomes');
    [
      `Understand core concepts in ${selectedCourse.category.toLowerCase()}.`,
      `Apply safe, structured workflows to ${selectedCourse.title.toLowerCase()}.`,
      'Identify next steps for continued learning and responsible practice.'
    ].forEach((outcome) => {
      const item = document.createElement('li');
      item.textContent = outcome;
      learningOutcomes.append(item);
    });
    document.getElementById('course-requirements').textContent = selectedCourse.level === 'Beginner'
      ? 'No prior cybersecurity experience is required. A computer and an interest in responsible technology are recommended.'
      : 'Foundational knowledge in the course area is recommended. All security testing must take place in authorized environments.';

    const outline = selectedCourse.id === 'cwu-cyber-001'
      ? ['Computer and networking fundamentals', 'Operating systems and Linux basics', 'Security concepts, threats, malware, and phishing', 'Password security, authentication, access control, and encryption', 'Web and network security, social engineering, and vulnerability management', 'Risk management, security monitoring, incident response, and digital forensics', 'Threat intelligence, security policies, privacy, and career paths', 'Final review and knowledge check']
      : selectedCourse.id === 'cwu-kali-002'
        ? ['Phase 1 — Kali/Linux Fundamentals', 'Phase 2 — System & Networking Fundamentals', 'Phase 3 — Ethical Hacking Tools in isolated authorized labs', 'Phase 4 — Security Testing & Analysis', 'Phase 5 — Practical Ethical Hacking with written permission', 'Final exam and certificate eligibility overview']
        : [`${selectedCourse.title}: core concepts`, 'Tools, terminology, and safe workflows', 'Guided learning activities and study material', 'Knowledge check and final review'];
    const list = document.getElementById('course-outline');
    outline.forEach((topic) => {
      const item = document.createElement('li');
      item.textContent = topic;
      list.append(item);
    });
    if (selectedCourse.id === 'cwu-kali-002' || selectedCourse.category === 'Ethical Hacking') {
      document.getElementById('course-safety').hidden = false;
    }
  }
}());
