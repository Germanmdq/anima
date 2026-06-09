import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// This key needs to be in .env.local as NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
