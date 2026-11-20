import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL, isConfigured } from "./config";

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client. Uses ONLY the public "anon" key: everything it can
 * read or write is limited by Row Level Security policies in the database.
 * The secret service-role key is never shipped to the browser.
 */
export function supabase(): SupabaseClient {
  if (!isConfigured) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "nb-auth" },
    });
  }
  return client;
}

/** Public URL of a file in the product images bucket. Absolute URLs are returned unchanged. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
