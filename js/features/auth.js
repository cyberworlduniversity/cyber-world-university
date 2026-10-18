(function () {
  const requestedCourse = new URLSearchParams(window.location.search).get('course');
  const courseQuery = requestedCourse && /^cwu-[a-z0-9-]{1,40}$/.test(requestedCourse)
    ? `?course=${encodeURIComponent(requestedCourse)}`
    : '';

  if (window.CWU_FIREBASE && window.CWU_FIREBASE.isConfigured) {
    import('../features/firebase-auth.js?v=3').catch((error) => {
      console.error('Firebase authentication could not be initialized.', error);
      document.querySelectorAll('[data-demo-auth] .status-message').forEach((status) => {
        status.textContent = 'Firebase could not be initialized. Check the Web app configuration and load this page from a local HTTP server.';
        status.classList.add('error');
      });
    });
    return;
  }

  document.querySelectorAll('[data-demo-auth]').forEach((form) => {
    const status = form.querySelector('.status-message');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.classList.remove('error');
      if (!form.reportValidity()) return;

      if (form.dataset.demoAuth === 'register') {
        const password = form.elements.password;
        const confirmation = form.elements.confirmPassword;
        if (password.value !== confirmation.value) {
          status.textContent = 'The password fields do not match.';
          status.classList.add('error');
          confirmation.focus();
          return;
        }
        status.textContent = 'Demo only: the form is valid, but no account was created and no information was stored.';
      } else {
        status.textContent = 'Demo only: the form is valid, but no credentials were checked and no account was authenticated.';
      }

      const dashboardLink = document.createElement('a');
      dashboardLink.href = `student-dashboard.html${courseQuery}`;
      dashboardLink.textContent = 'Open the sample student dashboard';
      status.append(document.createElement('br'), dashboardLink);
      form.reset();
      window.CWU.showToast('Demo form validated; no account was created.');
    });
  });

  document.querySelectorAll('[data-demo-forgot]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      window.CWU.showToast('Password recovery will be available with backend authentication.');
    });
  });
}());
