(function () {
  const homeForm = document.getElementById('contactForm');
  const homeStatus = document.getElementById('formStatus');
  if (homeForm && homeStatus) {
    homeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!homeForm.reportValidity()) {
        homeStatus.textContent = 'Please check the highlighted fields and try again.';
        return;
      }
      homeStatus.textContent = 'Demo only: your message has not been sent or stored. Contact submissions will be connected to a backend in a later phase.';
      window.CWU.showToast('Demo form validated; no message was sent.');
      homeForm.reset();
    });
  }

  const form = document.getElementById('contact-page-form');
  if (!form) return;
  const status = document.getElementById('contact-status');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.classList.remove('error');
    if (!form.reportValidity()) {
      status.textContent = 'Please complete each field with valid information.';
      status.classList.add('error');
      return;
    }
    status.textContent = 'Demo only: your message was validated locally but not sent or stored.';
    form.reset();
    window.CWU.showToast('Message validated; no message was sent.');
  });
}());
