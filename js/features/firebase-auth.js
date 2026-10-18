import {
  auth,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from '../firebase/auth-client.js';
import { getCurrentUserProfile } from '../firebase/profiles.js';

const messages = {
  'auth/email-already-in-use': 'An account already exists for this email. Try signing in instead.',
  'auth/configuration-not-found': 'Firebase Authentication is not configured for this project. In Firebase Console, open Authentication and enable Email/Password sign-in.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Unable to reach Firebase. Check your connection and try again.',
  'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this Firebase project.',
  'auth/too-many-requests': 'Too many attempts. Wait a while before trying again.',
  'auth/weak-password': 'Choose a stronger password with at least 8 characters.'
};

function userMessage(error) {
  if (!messages[error.code]) {
    console.error('Firebase authentication request failed.', error.code || 'unknown-error');
  }
  return messages[error.code] || 'Authentication could not be completed. Try again or contact support.';
}

function updateStatus(status, message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function setBusy(form, busy, loadingLabel) {
  const submit = form.querySelector('[type="submit"]');
  if (!submit) return;
  if (!submit.dataset.idleLabel) submit.dataset.idleLabel = submit.textContent;
  submit.disabled = busy;
  submit.textContent = busy ? loadingLabel : submit.dataset.idleLabel;
}

function bindLogin(form) {
  const status = form.querySelector('.status-message');
  const emailInput = form.elements.email;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateStatus(status, '');
    if (!form.reportValidity()) return;
    setBusy(form, true, 'Signing in...');
    updateStatus(status, 'Signing in...');

    try {
      const persistence = form.elements.remember.checked
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const result = await signInWithEmailAndPassword(auth, emailInput.value.trim(), form.elements.password.value);
      if (!result.user.emailVerified) {
        let verificationSent = false;
        try {
          await sendEmailVerification(result.user);
          verificationSent = true;
        } finally {
          await signOut(auth);
        }
        updateStatus(status, verificationSent
          ? 'Your email is not verified. We sent another verification link; check your inbox before signing in.'
          : 'Your email is not verified. Sign in again after verifying your address.');
        return;
      }
      updateStatus(status, 'You are signed in. Your CWU profile is connected; dashboard learning data remains a demo.');
      window.CWU.showToast('Signed in with Firebase.');
    } catch (error) {
      updateStatus(status, userMessage(error), true);
    } finally {
      setBusy(form, false);
    }
  });

  const forgotButton = document.querySelector('[data-demo-forgot]');
  if (forgotButton) {
    forgotButton.addEventListener('click', async () => {
      updateStatus(status, '');
      if (!emailInput.value.trim()) {
        emailInput.setCustomValidity('Enter your email address to request a password reset.');
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
        await sendPasswordResetEmail(auth, emailInput.value.trim());
        updateStatus(status, 'If an account exists for that address, Firebase has sent a password-reset link.');
      } catch (error) {
        updateStatus(status, userMessage(error), true);
      } finally {
        forgotButton.disabled = false;
        forgotButton.textContent = idleLabel;
      }
    });
  }

  let authStateVersion = 0;
  onAuthStateChanged(auth, async (user) => {
    const currentVersion = ++authStateVersion;
    let logoutButton = document.getElementById('firebase-logout');
    if (!user) {
      if (logoutButton) logoutButton.hidden = true;
      window.dispatchEvent(new CustomEvent('cwu:profile-changed', { detail: null }));
      return;
    }

    if (!logoutButton) {
      logoutButton = document.createElement('button');
      logoutButton.type = 'button';
      logoutButton.id = 'firebase-logout';
      logoutButton.className = 'inline-btn';
      logoutButton.textContent = 'Sign out';
      logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = 'Signing out...';
        updateStatus(status, 'Signing out...');
        try {
          await signOut(auth);
          updateStatus(status, 'You have been signed out.');
        } catch (error) {
          updateStatus(status, userMessage(error), true);
        } finally {
          logoutButton.disabled = false;
          logoutButton.textContent = 'Sign out';
        }
      });
      status.insertAdjacentElement('afterend', logoutButton);
    }
    logoutButton.hidden = false;

    updateStatus(status, 'Loading your CWU profile...');
    try {
      const profile = await getCurrentUserProfile();
      if (currentVersion !== authStateVersion || auth.currentUser?.uid !== user.uid) return;
      window.dispatchEvent(new CustomEvent('cwu:profile-changed', { detail: profile }));
      updateStatus(status, `Signed in as ${profile.name || user.displayName || user.email}. Role: ${profile.role}.`);
    } catch (error) {
      if (currentVersion !== authStateVersion) return;
      console.error('Could not load the signed-in user profile.', error.code || error.message || 'profile-load-failed');
      updateStatus(status, 'You are signed in, but your CWU profile could not be loaded. Try again shortly or contact support.', true);
    }
  });
}

function bindRegistration(form) {
  const status = form.querySelector('.status-message');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateStatus(status, '');
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
    let accountCreated = false;
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.elements.email.value.trim(),
        password.value
      );
      accountCreated = true;
      await updateProfile(credential.user, { displayName: form.elements.name.value.trim() });
      await getCurrentUserProfile();
      await sendEmailVerification(credential.user);
      await signOut(auth);
      updateStatus(status, 'Account created. Check your email and verify the address before signing in.');
      form.reset();
    } catch (error) {
      if (accountCreated) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Could not sign out after incomplete account setup.', signOutError.code || 'unknown-error');
        }
        updateStatus(status, 'The account was created, but setup did not finish. Try signing in to resend verification or contact support.', true);
      } else {
        updateStatus(status, userMessage(error), true);
      }
    } finally {
      setBusy(form, false);
    }
  });
}

document.querySelectorAll('[data-demo-auth]').forEach((form) => {
  const mode = form.dataset.demoAuth;
  form.dataset.demoAuth = `firebase-${mode}`;
  if (mode === 'register') {
    document.title = 'Create Account | Cyber World University';
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.textContent = 'Create account';
    const passwordLabel = form.querySelector('label[for="register-password"]');
    if (passwordLabel) passwordLabel.textContent = 'Password';
    bindRegistration(form);
  } else {
    document.title = 'Login | Cyber World University';
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.textContent = 'Sign in';
    const rememberLabel = form.querySelector('label[for="remember-me"]');
    if (rememberLabel) rememberLabel.textContent = 'Keep me signed in on this device';
    bindLogin(form);
  }
});

document.querySelectorAll('.notice').forEach((notice) => {
  if (notice.textContent.includes('Demo authentication only')) {
    notice.textContent = 'Firebase Authentication is connected. Verify your email address before signing in. Roles and protected learning data are not yet configured.';
  } else if (notice.textContent.includes('Account creation and role authorization')) {
    notice.textContent = 'Firebase Authentication is connected. Verify your email address before signing in. Role authorization and protected learning data are not yet configured. Never enter a password you use elsewhere.';
  }
});

document.querySelectorAll('.page-heading > p').forEach((paragraph) => {
  if (paragraph.textContent.includes('Preview the sign-in experience')) {
    paragraph.textContent = 'Sign in to your CWU account.';
  } else if (paragraph.textContent.includes('This demo form validates its fields')) {
    paragraph.textContent = 'Create a CWU learner account. Firebase Authentication must be enabled in the project.';
  }
});
