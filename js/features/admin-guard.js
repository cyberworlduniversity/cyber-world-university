import { supabase } from '../supabase/supabase-client.js';

const PRIMARY_ADMIN_EMAIL = 'ehemanathan143@gmail.com';

async function guardAdminPanel() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  const email = String(user?.email || '').trim().toLowerCase();

  if (!user || email !== PRIMARY_ADMIN_EMAIL) {
    if (user) await supabase.auth.signOut();
    window.location.replace('login.html?admin=required');
    return false;
  }

  return true;
}

window.CWU_ADMIN_GUARD = guardAdminPanel();
