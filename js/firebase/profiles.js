import { doc, getDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { auth, db } from './auth-client.js';

const profileRetryDelays = [0, 250, 500, 1000, 2000, 3000, 5000];

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to read your profile.');

  const profileRef = doc(db, 'users', user.uid);
  let profile;
  for (const retryDelay of profileRetryDelays) {
    if (retryDelay) await delay(retryDelay);
    profile = await getDoc(profileRef);
    if (profile.exists()) break;
  }
  if (!profile.exists()) throw new Error('Your user profile has not been created yet. Contact support if this continues.');
  if (auth.currentUser?.uid !== user.uid) throw new Error('Your sign-in session changed while the profile was loading.');

  const data = profile.data();
  if (data.uid !== user.uid) throw new Error('The loaded profile does not match the signed-in account.');

  const name = [data.name, data.displayName, user.displayName]
    .find((value) => typeof value === 'string' && value.trim()) || '';
  if (data.name !== name || data.displayName !== name) {
    await updateDoc(profileRef, {
      name,
      displayName: name,
      updatedAt: serverTimestamp()
    });
    data.name = name;
    data.displayName = name;
  }

  return data;
}

export async function updateCurrentUserProfile(changes) {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to update your profile.');
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new TypeError('Profile changes must be an object.');
  }

  const fields = Object.keys(changes);
  if (!fields.length || fields.some((field) => !['name', 'displayName', 'photoURL'].includes(field))) {
    throw new TypeError('Only name and photoURL can be updated.');
  }

  const update = {};
  if (Object.hasOwn(changes, 'name') || Object.hasOwn(changes, 'displayName')) {
    const name = Object.hasOwn(changes, 'name') ? changes.name : changes.displayName;
    if (Object.hasOwn(changes, 'name') && Object.hasOwn(changes, 'displayName')
      && changes.name !== changes.displayName) {
      throw new TypeError('Name and displayName must match.');
    }
    if (typeof name !== 'string' || name.trim().length > 100) {
      throw new TypeError('Name must be a string of at most 100 characters.');
    }
    update.name = name.trim();
    update.displayName = name.trim();
  }

  if (Object.hasOwn(changes, 'photoURL')) {
    if (typeof changes.photoURL !== 'string' || changes.photoURL.length > 2048) {
      throw new TypeError('Photo URL must be a string of at most 2048 characters.');
    }
    if (changes.photoURL) {
      let url;
      try {
        url = new URL(changes.photoURL);
      } catch {
        throw new TypeError('Photo URL must be a valid HTTPS URL.');
      }
      if (url.protocol !== 'https:') throw new TypeError('Photo URL must use HTTPS.');
    }
    update.photoURL = changes.photoURL;
  }

  update.updatedAt = serverTimestamp();
  await updateDoc(doc(db, 'users', user.uid), update);
}
