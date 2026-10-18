(function () {
  const steps = document.querySelectorAll('#roadmap-steps .roadmap-button');
  const status = document.getElementById('roadmap-status');
  steps.forEach((button, index) => {
    button.addEventListener('click', () => {
      steps.forEach((step) => {
        step.removeAttribute('aria-current');
        step.setAttribute('aria-pressed', 'false');
      });
      button.setAttribute('aria-current', 'step');
      button.setAttribute('aria-pressed', 'true');
      status.textContent = `Focus selected: step ${index + 1} — ${button.textContent}. Your choice is not saved.`;
    });
  });
}());
