const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onUserCreated, onUserDeleted } = require('firebase-functions/v2/identity');

initializeApp();

const firestore = getFirestore();
const allowedRoles = new Set(['student', 'teacher', 'admin']);

exports.createUserProfile = onUserCreated(async (event) => {
  const user = event.data;
  const auth = getAuth();
  const role = allowedRoles.has(user.customClaims && user.customClaims.role)
    ? user.customClaims.role
    : 'student';

  if (role !== (user.customClaims && user.customClaims.role)) {
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      role
    });
  }

  const profileRef = firestore.collection('users').doc(user.uid);
  await firestore.runTransaction(async (transaction) => {
    const profile = await transaction.get(profileRef);
    if (profile.exists) return;

    transaction.create(profileRef, {
      uid: user.uid,
      name: user.displayName || '',
      displayName: user.displayName || '',
      email: user.email || '',
      emailVerified: Boolean(user.emailVerified),
      photoURL: user.photoURL || '',
      role,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });
});

exports.deleteUserProfile = onUserDeleted(async (event) => {
  await firestore.collection('users').doc(event.data.uid).delete();
});
