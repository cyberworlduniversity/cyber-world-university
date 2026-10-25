import { supabase } from '../supabase/supabase-client.js';

const PRIMARY_ADMIN_EMAIL = 'ehemanathan143@gmail.com';

const messages = {
  'invalid_credentials': 'The email or password is incorrect.',
  'email_not_confirmed': 'Verify your email address before signing in.',
  'user_already_exists': 'An account could not be created with these details. If you already have a CWU account, try signing in or resetting your password.',
  'weak_password': 'Choose a stronger password with at least 8 characters.'
};

function userMessage(error) {
  const text = String(error?.message || '').toLowerCase();
  if (text.includes('invalid login credentials')) return messages.invalid_credentials;
  if (text.includes('email not confirmed')) return messages.email_not_confirmed;
  if (text.includes('already registered') || text.includes('already exists')) return messages.user_already_exists;
  if (text.includes('password')) return messages.weak_password;
  console.error('Supabase authentication request failed.', error);
  return error?.message || 'Authentication could not be completed. Try again or contact support.';
}

function updateStatus(status, message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function setBusy(form, busy, loadingLabel) {
  const submit = form.querySelector('[type="submit"]');
  form.setAttribute('aria-busy', String(busy));
  if (!submit) return;
  if (!submit.dataset.idleLabel) submit.dataset.idleLabel = submit.textContent;
  submit.disabled = busy;
  submit.textContent = busy ? loadingLabel : submit.dataset.idleLabel;
}

async function ensureProfile(user, name = '') {
  if (!user) return;
  const { error } = await supabase.from('cwu_profiles').upsert({
    id: user.id,
    full_name: name || user.user_metadata?.full_name || '',
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  if (error) console.warn('CWU profile synchronization was not completed.', error.message);
}

function bindLogin(form) {
  const status = form.querySelector('.status-message');
  const emailInput = form.elements.email;
  updateStatus(status, 'Supabase Authentication is ready.');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    setBusy(form, true, 'Signing in...');
    updateStatus(status, 'Signing in...');
    try {
      const requestedEmail = emailInput.value.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value.trim(),
        password: form.elements.password.value
      });
      if (error) throw error;
      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Email not confirmed');
      }
      await ensureProfile(data.user);

      const signedInEmail = String(data.user.email || requestedEmail).trim().toLowerCase();
      const isPrimaryAdmin = signedInEmail === PRIMARY_ADMIN_EMAIL;
      updateStatus(status, isPrimaryAdmin ? 'Admin sign-in successful. Opening the earning panel…' : 'You are signed in.');
      window.CWU?.showToast?.(isPrimaryAdmin ? 'Admin signed in successfully.' : 'Signed in successfully.');
      setTimeout(() => {
        window.location.href = isPrimaryAdmin ? 'admin-panel.html' : 'student-dashboard.html';
      }, 500);
    } catch (error) {
      updateStatus(status, userMessage(error), true);
    } finally {
      setBusy(form, false);
    }
  });

  const forgotButton = document.querySelector('[data-password-reset]');
  forgotButton?.addEventListener('click', async () => {
    if (!emailInput.value.trim()) {
      emailInput.setCustomValidity('Enter your email address first.');
      emailInput.reportValidity();
      emailInput.setCustomValidity('');
      emailInput.focus();
      return;
    }
    forgotButton.disabled = true;
    const idleLabel = forgotButton.textContent;
    forgotButton.textContent = 'Sending reset link...';
    updateStatus(status, 'Sending password-reset email...');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput.value.trim(), {
        redirectTo: `${window.location.origin}/pages/login.html`
      });
      if (error) throw error;
      updateStatus(status, 'If an account exists for that address, a password-reset link has been sent.');
    } catch (error) {
      updateStatus(status, userMessage(error), true);
    } finally {
      forgotButton.disabled = false;
      forgotButton.textContent = idleLabel;
    }
  });
}

function bindRegistration(form) {
  const status = form.querySelector('.status-message');
  updateStatus(status, 'Supabase Authentication is ready.');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const password = form.elements.password;
    const confirmation = form.elements.confirmPassword;
    if (password.value !== confirmation.value) {
      updateStatus(status, 'The password fields do not match.', true);
      confirmation.focus();
      return;
    }
    setBusy(form, true, 'Creating account...');
    updateStatus(status, 'Creating your account...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.elements.email.value.trim(),
        password: password.value,
        options: { data: { full_name: form.elements.name.value.trim() } }
      });
      if (error) throw error;
      if (data.user) await ensureProfile(data.user, form.elements.name.value.trim());
      updateStatus(status, data.session
        ? 'Your account was created and you are signed in.'
        : 'Your account was created. Check your email to verify your address before signing in.');
      form.reset();
    } catch (error) {
      updateStatus(status, userMessage(error), true);
    } finally {
      setBusy(form, false);
    }
  });
}

function publishAuth(user) {
  window.dispatchEvent(new CustomEvent('cwu:profile-changed', { detail: user || null }));
}

document.querySelectorAll('[data-supabase-auth]').forEach((form) => {
  const mode = form.dataset.supabaseAuth;
  if (mode === 'register') bindRegistration(form);
  else bindLogin(form);
  setBusy(form, false);
});

supabase.auth.getSession().then(({ data }) => publishAuth(data.session?.user || null));
supabase.auth.onAuthStateChange((_event, session) => publishAuth(session?.user || null));
