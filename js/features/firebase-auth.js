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
  form.setAttribute('aria-busy', String(busy));
  if (!submit) return;
  if (!submit.dataset.idleLabel) submit.dataset.idleLabel = submit.textContent;
  submit.disabled = busy;
  submit.textContent = busy ? loadingLabel : submit.dataset.idleLabel;
}

function bindLogin(form) {
  const status = form.querySelector('.status-message');
  const emailInput = form.elements.email;
  let isLoginRequestActive = false;
  updateStatus(status, 'Firebase Authentication is initializing...');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateStatus(status, '');
    if (!form.reportValidity()) return;
    setBusy(form, true, 'Signing in...');
    updateStatus(status, 'Signing in...');
    isLoginRequestActive = true;

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
      updateStatus(status, 'You are signed in with Firebase. CWU profiles, course enrollment, and protected learning features are not configured.');
      window.CWU.showToast('Signed in with Firebase.');
    } catch (error) {
      updateStatus(status, userMessage(error), true);
    } finally {
      isLoginRequestActive = false;
      setBusy(form, false);
    }
  });

  const forgotButton = document.querySelector('[data-password-reset]');
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
    forgotButton.disabled = false;
  }

  let authStateVersion = 0;
  onAuthStateChanged(auth, (user) => {
    const currentVersion = ++authStateVersion;
    let logoutButton = document.getElementById('firebase-logout');
    if (!user) {
      if (logoutButton) logoutButton.hidden = true;
      window.dispatchEvent(new CustomEvent('cwu:profile-changed', { detail: null }));
      return;
    }

    if (!user.emailVerified) {
      if (logoutButton) logoutButton.hidden = true;
      window.dispatchEvent(new CustomEvent('cwu:profile-changed', { detail: null }));
      if (!isLoginRequestActive) {
        updateStatus(status, 'Email verification is required. Signing out of the unverified session.');
        signOut(auth).then(() => {
          updateStatus(status, 'Email verification is required before signing in. Check your inbox for the verification link.');
        }).catch((error) => {
          updateStatus(status, `Email verification is required, but sign-out failed. ${userMessage(error)}`, true);
        });
      }
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
    if (currentVersion === authStateVersion && auth.currentUser?.uid === user.uid) {
      updateStatus(status, 'You are signed in with Firebase. Profile and role-based learning features are not configured.');
    }
  });
}

function bindRegistration(form) {
  const status = form.querySelector('.status-message');
  updateStatus(status, 'Firebase Authentication is initializing...');
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
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(
        auth,
        form.elements.email.value.trim(),
        password.value
      );
    } catch (error) {
      updateStatus(status, userMessage(error), true);
      setBusy(form, false);
      return;
    }

    let profileNameSaved = true;
    let verificationError = null;
    let signOutError = null;
    try {
      await updateProfile(credential.user, { displayName: form.elements.name.value.trim() });
    } catch (error) {
      profileNameSaved = false;
      console.error('Firebase account was created, but its display name could not be saved.', error.code || 'profile-update-failed');
    }
    try {
      await sendEmailVerification(credential.user);
    } catch (error) {
      verificationError = error;
      console.error('Firebase account was created, but its verification email could not be sent.', error.code || 'verification-email-failed');
    } finally {
      try {
        await signOut(auth);
      } catch (error) {
        signOutError = error;
        console.error('Firebase account was created, but sign-out did not complete.', error.code || 'sign-out-failed');
      }
    }

    if (verificationError) {
      const signOutWarning = signOutError ? ' Sign-out also failed; close this browser session and contact support.' : '';
      updateStatus(
        status,
        `Your Firebase account was created, but the verification email could not be sent. ${userMessage(verificationError)} Try signing in later to request another verification link.${signOutWarning}`,
        true
      );
    } else {
      const nameNotice = profileNameSaved ? '' : ' Your display name could not be saved.';
      const signOutWarning = signOutError ? ' Sign-out did not complete; close this browser session before continuing.' : '';
      updateStatus(
        status,
        `Your Firebase sign-in account was created and a verification email was sent. Verify your email before signing in. CWU learner profiles, enrollments, and protected features are not configured.${nameNotice}${signOutWarning}`,
        Boolean(signOutError)
      );
      form.reset();
    }
    form.setAttribute('aria-busy', 'false');
    setBusy(form, false);
    const status = form.querySelector('.status-message');
    if (status.textContent === 'Firebase Authentication is initializing...') {
      updateStatus(status, 'Firebase Authentication is ready. CWU profiles, role assignments, and protected learning features are not configured.');
    }
  });
}

document.querySelectorAll('[data-firebase-auth]').forEach((form) => {
  const mode = form.dataset.firebaseAuth;
  form.dataset.firebaseAuth = `firebase-${mode}`;
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
  setBusy(form, false);
  const status = form.querySelector('.status-message');
  if (status.textContent === 'Firebase Authentication is initializing...') {
    updateStatus(status, 'Firebase Authentication is ready. CWU profiles, role assignments, and protected learning features are not configured.');
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
