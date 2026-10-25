import { supabase } from './supabase-client.js';

export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to read your profile.');
  const { data, error } = await supabase.from('cwu_profiles').select('id,full_name,role,avatar_url,created_at,updated_at').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Your CWU profile has not been created yet.');
  return { ...data, uid: data.id, name: data.full_name, displayName: data.full_name, photoURL: data.avatar_url };
}

export async function updateCurrentUserProfile(changes) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to update your profile.');
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new TypeError('Profile changes must be an object.');
  const fullName = changes.name ?? changes.displayName;
  if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length > 100)) throw new TypeError('Name must be a string of at most 100 characters.');
  const avatarUrl = changes.photoURL;
  if (avatarUrl !== undefined && (typeof avatarUrl !== 'string' || avatarUrl.length > 2048)) throw new TypeError('Photo URL is invalid.');
  const update = { updated_at: new Date().toISOString() };
  if (fullName !== undefined) update.full_name = fullName.trim();
  if (avatarUrl !== undefined) update.avatar_url = avatarUrl;
  const { error } = await supabase.from('cwu_profiles').update(update).eq('id', user.id);
  if (error) throw error;
}
