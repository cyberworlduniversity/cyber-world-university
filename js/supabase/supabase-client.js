import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://plmjrdokggqprmmylflu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gZblcIsqUvAFbOOhRl-AdQ_3BmMN_z5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export { SUPABASE_URL };
