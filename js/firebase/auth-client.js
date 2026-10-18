import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { connectFirestoreEmulator, getFirestore } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (firebaseSetup.useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export {
  app,
  auth,
  db,
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
  updateProfile
};
