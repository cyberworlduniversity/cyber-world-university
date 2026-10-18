import { deleteObject, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import { auth, storage } from './auth-client.js';

const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const maximumSize = 5 * 1024 * 1024;

function currentAvatarFolder() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to manage your avatar.');
  return ref(storage, `users/${user.uid}/avatar`);
}

export async function uploadCurrentUserAvatar(file) {
  if (!(file instanceof Blob)) throw new TypeError('Choose an image file to upload.');
  if (!allowedTypes.has(file.type)) throw new TypeError('Avatar must be a PNG, JPEG, or WebP image.');
  if (file.size >= maximumSize) throw new RangeError('Avatar must be smaller than 5 MiB.');

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const avatar = ref(currentAvatarFolder(), `avatar.${extension}`);
  await uploadBytes(avatar, file, { contentType: file.type });
}

export async function deleteCurrentUserAvatar(extension) {
  if (!['png', 'jpg', 'webp'].includes(extension)) {
    throw new TypeError('Avatar extension must be png, jpg, or webp.');
  }
  await deleteObject(ref(currentAvatarFolder(), `avatar.${extension}`));
}
