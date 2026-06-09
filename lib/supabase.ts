import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_supabase) {
      const url = process.env.SUPABASE_URL || "";
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      _supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return Reflect.get(_supabase, prop, receiver);
  },
});
