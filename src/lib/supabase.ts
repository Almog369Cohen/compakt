import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Browser-safe Supabase client.
 * Returns null when env vars are missing (e.g. during build or local dev without .env).
 */
let _browserClient: ReturnType<typeof createBrowserClient> | null = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    _browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
} catch {
  _browserClient = null;
}
export const supabase = _browserClient;

/**
 * Server-only Supabase client with service role key.
 * Use only in API routes / server components — never expose to the browser.
 */
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing SUPABASE env vars for service client");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
