(function () {
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      document.querySelectorAll('.filter-btn').forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      document.querySelectorAll('.feature-card[data-category]').forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
      });
    });
  });

  document.querySelectorAll('.faq-question').forEach((button, index) => {
    const item = button.closest('.faq-item');
    const answer = item && item.querySelector('.faq-answer');
    if (!item || !answer) return;
    if (!answer.id) answer.id = `faq-answer-${index + 1}`;
    if (!button.id) button.id = `faq-question-${index + 1}`;
    button.setAttribute('aria-controls', answer.id);
    answer.setAttribute('role', 'region');
    answer.setAttribute('aria-labelledby', button.id);
    answer.setAttribute('aria-hidden', String(!item.classList.contains('active')));
    button.addEventListener('click', () => {
      const opening = !item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach((candidate) => {
        candidate.classList.remove('active');
        const candidateButton = candidate.querySelector('.faq-question');
        if (candidateButton) candidateButton.setAttribute('aria-expanded', 'false');
        const candidateAnswer = candidate.querySelector('.faq-answer');
        if (candidateAnswer) candidateAnswer.setAttribute('aria-hidden', 'true');
      });
      if (opening) {
        item.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');
      }
    });
  });

  document.querySelectorAll('.feature-card .inline-btn').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'pages/courses.html';
    });
  });

  document.querySelectorAll('.article-card .inline-btn').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'pages/blog.html';
    });
  });

  const certificateButton = document.querySelector('.certificate-copy .btn');
  if (certificateButton) {
    certificateButton.addEventListener('click', () => {
      window.location.href = 'pages/verify-certificate.html';
    });
  }
}());
