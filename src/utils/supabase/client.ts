import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Supabase Browser Client
 * Digunakan untuk operasi database langsung dari browser / client components.
 */
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Supabase Server / Admin Client
 * Jika SUPABASE_SERVICE_ROLE_KEY disetel di server, client ini akan otomatis
 * mem-bypass Row Level Security (RLS) untuk rute API backend.
 */
export function getSupabaseServerClient() {
  const key = supabaseServiceRoleKey || supabaseAnonKey || "placeholder-anon-key";
  return createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Mengecek apakah kredensial Supabase sudah dikonfigurasi di environment
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}

/**
 * Factory function untuk membuat instans Supabase client baru jika dibutuhkan
 */
export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  );
}
