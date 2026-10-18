(function () {
  if (window.CWU_FIREBASE && window.CWU_FIREBASE.isConfigured) {
    import('../features/firebase-auth.js?v=6').catch((error) => {
      console.error('Firebase authentication could not be initialized.', error);
      document.querySelectorAll('[data-firebase-auth] .status-message').forEach((status) => {
        status.textContent = 'Firebase Authentication could not be initialized. Check your connection, Firebase Web configuration, and Authentication availability. Sign-in and account creation are disabled.';
        status.classList.add('error');
      });
      document.querySelectorAll('[data-firebase-auth]').forEach((form) => form.setAttribute('aria-busy', 'false'));
    });
    return;
  }

  document.querySelectorAll('.notice').forEach((notice) => {
    notice.textContent = 'Firebase Authentication is unavailable because this site has no complete Firebase Web configuration. Sign-in, account creation, and profile access are disabled.';
  });
  document.querySelectorAll('.page-heading > p:not(.eyebrow)').forEach((paragraph) => {
    paragraph.textContent = 'Authentication is unavailable because Firebase is not configured for this site.';
  });

  document.querySelectorAll('[data-firebase-auth]').forEach((form) => {
    const status = form.querySelector('.status-message');
    status.textContent = 'Authentication is unavailable. Firebase is not configured; sign-in, account creation, password reset, and profile access are disabled.';
    status.classList.add('error');
    form.setAttribute('aria-busy', 'false');
  });

  document.querySelectorAll('[data-password-reset]').forEach((button) => {
    button.disabled = true;
  });
}());
