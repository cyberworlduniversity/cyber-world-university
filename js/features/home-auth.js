const loginLink = document.querySelector('[data-home-auth="login"]');
const registerLink = document.querySelector('[data-home-auth="register"]');
const dashboardLink = document.querySelector('[data-home-dashboard]');

if (loginLink && registerLink && dashboardLink) {
  import('../supabase/supabase-client.js').then(({ supabase }) => {
    const render = (session) => {
      const signedIn = Boolean(session?.user?.email_confirmed_at);
      loginLink.hidden = signedIn;
      registerLink.hidden = signedIn;
      dashboardLink.hidden = !signedIn;
    };
    supabase.auth.getSession().then(({ data }) => render(data.session)).catch((error) => console.error('Could not read the current Supabase sign-in state.', error));
    supabase.auth.onAuthStateChange((_event, session) => render(session));
  }).catch((error) => console.error('Supabase homepage authentication could not be initialized.', error));
}
