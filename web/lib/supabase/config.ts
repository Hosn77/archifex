/**
 * Supabase dashboard sometimes gives the REST endpoint
 * (https://project.supabase.co/rest/v1) instead of the project URL.
 * The JS SDK appends /auth/v1 and /rest/v1 itself, so strip those suffixes
 * to avoid requests such as /rest/v1/auth/v1/token.
 */
export function normalizeSupabaseUrl(value: string | undefined) {
  if (!value) return value;

  return value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "")
    .replace(/\/auth\/v1$/, "")
    .replace(/\/+$/, "");
}

export function getSupabaseConfig() {
  return {
    url: normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}
