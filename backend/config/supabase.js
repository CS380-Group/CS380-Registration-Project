// backend/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Ensure .env is loaded even if server.js hasn't run yet
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;                  // anon/public key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;  // service role (server only)

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL in backend/.env");
if (!SUPABASE_ANON_KEY) throw new Error("Missing SUPABASE_ANON_KEY in backend/.env");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in backend/.env");

// Admin client: bypasses RLS, for server-only tasks (e.g., public /slots reads)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Anon client: for auth flows (signUp / signInWithPassword) and user-context ops
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Per-request client using a user's bearer token (used in authenticate middleware)
export function makeSupabaseClient(token) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    });
}

// Backward compatibility for files importing default
export default supabaseAdmin;
