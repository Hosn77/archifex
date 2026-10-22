import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "./supabase/config";

/**
 * Optional comma-separated fallback for bootstrapping a provider account before
 * the platform_admins migration has been applied.
 */
export function getPlatformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks the provider allowlist using the caller's own session. The
 * platform_admins table is self-readable only (user_id = auth.uid()), so this
 * check cannot be used to discover other administrators.
 */
export async function isPlatformAdmin(
  supabase: SupabaseClient,
  user: User | null,
): Promise<boolean> {
  if (!user) return false;

  const email = user.email?.trim().toLowerCase();
  if (email && getPlatformAdminEmails().includes(email)) return true;

  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

/**
 * Server-only Supabase client with the service role. Never import this module
 * from a Client Component and never expose the key to the browser.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
