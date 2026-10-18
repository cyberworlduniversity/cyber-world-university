import { appCheck, auth, functions, httpsCallable, onAuthStateChanged, signOut } from './auth-client.js';

export { auth, onAuthStateChanged, signOut };

export function callLms(name, data = {}) {
  if (!appCheck) {
    return Promise.reject(Object.assign(
      new Error('App Check is not configured for this CWU web app. Backend operations are unavailable until Firebase Console setup and a site key are provided.'),
      { code: 'cwu/app-check-not-configured' }
    ));
  }
  return httpsCallable(functions, name)(data).then((result) => result.data);
}

export function waitForAuth() {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
}

export function readableError(error) {
  const knownMessages = {
    'cwu/app-check-not-configured': error.message,
    'auth/network-request-failed': 'A network error prevented this request. Check your connection and try again.',
    'functions/unavailable': 'The CWU backend is currently unavailable.',
    'functions/failed-precondition': error.message || 'This operation is not currently available.',
    'functions/permission-denied': 'Your account is not authorized to perform this action.',
    'functions/unauthenticated': 'Sign in with a verified account to continue.',
    'functions/not-found': 'The requested record is unavailable.',
    'functions/resource-exhausted': 'The configured limit has been reached.',
    'functions/internal': 'The CWU backend could not complete the request. The service may be unavailable or not deployed.'
  };
  return knownMessages[error.code] || error.message || 'The request failed. Please try again later.';
}

export function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

export function createElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
