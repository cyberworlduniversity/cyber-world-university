import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js';
import { connectFirestoreEmulator, getFirestore } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { connectStorageEmulator, getStorage } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

const firebaseSetup = window.CWU_FIREBASE;
if (!firebaseSetup || !firebaseSetup.isConfigured) {
  throw new Error('Firebase Web app configuration is incomplete.');
}

const app = initializeApp(firebaseSetup.config);
const appCheck = typeof firebaseSetup.appCheckSiteKey === 'string'
  && firebaseSetup.appCheckSiteKey.trim()
  ? initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(firebaseSetup.appCheckSiteKey.trim()),
    isTokenAutoRefreshEnabled: true
  })
  : null;
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const storage = getStorage(app);

if (firebaseSetup.useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export {
  app,
  appCheck,
  auth,
  db,
  functions,
  storage,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  httpsCallable
};
