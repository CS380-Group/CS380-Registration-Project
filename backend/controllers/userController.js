// backend/controllers/userController.js
import { supabaseAnon, supabaseAdmin } from "../config/supabase.js";

class UserController {
    async signUp(req, res, next) {

        console.log("[controller] userController module loaded");

        try {
            console.log("[signup] hit", new Date().toISOString());
            console.log("[signup] body", req.body);

            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: "email and password are required" });
            }

            // 1) Create auth user with anon client
            const { data, error } = await supabaseAnon.auth.signUp({ email, password });
            if (error) {
                console.error("signUp auth error:", error);
                // Always return the full error object for debug:
                return res.status(400).json({ error: error.message || error.description || JSON.stringify(error) });
            }

            const user = data.user; // When email confirmations are on, user may exist but no session yet
            if (!user) {
                // Confirmation email flow
                return res.status(200).json({ message: "Signup initiated. Check your email to confirm." });
            }

            // === FAST PATH: return immediately (no app-table write yet) ===
            return res.status(201).json({ user: { id: user.id, email: user.email } });

            // === OPTIONAL: enable this later to seed your profiles table ===
            // const { error: upsertErr } = await supabaseAdmin
            //   .from("profiles")
            //   .upsert(
            //     { id: user.id, email: user.email, created_at: new Date().toISOString() },
            //     { onConflict: "id" }
            //   );
            // if (upsertErr) {
            //   console.error("signUp profiles upsert error:", upsertErr);
            //   return res.status(400).json({ error: upsertErr.message });
            // }
            // return res.status(201).json({ user: { id: user.id, email: user.email } });
        } catch (err) {
            next(err);
        }
    }

    async signIn(req, res, next) {
        try {
            console.log("[signin] hit", new Date().toISOString());
            console.log("[signin] body", req.body);

            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: "email and password are required" });
            }

            const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
            if (error) {
                console.error("signIn error:", error);
                return res.status(401).json({ error: error.message || error.description || JSON.stringify(error) });
            }

            return res.json({ access_token: data.session.access_token });
        } catch (err) {
            next(err);
        }
    }
}

export default new UserController();
