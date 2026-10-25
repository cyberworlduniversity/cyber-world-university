import { supabase } from '../supabase/supabase-client.js';

const loginLink = document.querySelector('[data-home-auth="login"]');
const registerLink = document.querySelector('[data-home-auth="register"]');
const dashboardLink = document.querySelector('[data-home-dashboard]');

if (loginLink && registerLink && dashboardLink) {
  supabase.auth.getSession().then(({ data }) => {
    const signedIn = Boolean(data.session?.user?.email_confirmed_at);
    loginLink.hidden = signedIn;
    registerLink.hidden = signedIn;
    dashboardLink.hidden = !signedIn;
  }).catch((error) => console.error('Could not read the current Supabase sign-in state.', error));
  supabase.auth.onAuthStateChange((_event, session) => {
    const signedIn = Boolean(session?.user?.email_confirmed_at);
    loginLink.hidden = signedIn;
    registerLink.hidden = signedIn;
    dashboardLink.hidden = !signedIn;
  });
}
