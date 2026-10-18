const loginLink = document.querySelector('[data-home-auth="login"]');
const registerLink = document.querySelector('[data-home-auth="register"]');
const dashboardLink = document.querySelector('[data-home-dashboard]');

if (window.CWU_FIREBASE && window.CWU_FIREBASE.isConfigured
    && loginLink && registerLink && dashboardLink) {
  import('../firebase/auth-client.js')
    .then(({ auth, onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        const signedIn = Boolean(user);
        loginLink.hidden = signedIn;
        registerLink.hidden = signedIn;
        dashboardLink.hidden = !signedIn;
      }, (error) => {
        console.error('Could not read the current sign-in state on the homepage.', error.code || error.message || 'auth-state-failed');
      });
    })
    .catch((error) => {
      console.error('Homepage sign-in state could not be initialized.', error.code || error.message || 'auth-init-failed');
    });
}
