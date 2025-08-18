// frontend/src/config/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
});

export function makeSupabaseClient(token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
        auth: { persistSession: true, autoRefreshToken: true },
    });
}

export default supabase;
