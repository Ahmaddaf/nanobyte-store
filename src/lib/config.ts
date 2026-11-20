import type { Settings } from "./types";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Public address of the store, used in WhatsApp messages and share links. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
/** Local preview only: shows sample products. Never enable in production. */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO === "1";

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const STORAGE_BUCKET = "products";

/**
 * Real store details confirmed by the owner. The live values come from the
 * `settings` table (editable from the dashboard); these are only the fallback
 * shown before the first load.
 */
export const DEFAULT_SETTINGS: Settings = {
  store_name: "نانو بايت تكنولوجي",
  whatsapp: "249126111169",
  phone_primary: "0126111169",
  phone_secondary: "0912342256",
  address: "أم درمان - الشهداء - عمارة الهانم",
  map_url: "https://maps.app.goo.gl/2hZUwaVUf4EwqMuRA",
  hours: "من 9:00 صباحاً إلى 7:00 مساءً",
  delivery_note: "توصيل داخل ولاية الخرطوم ولكل الولايات الآمنة",
  facebook_url: "https://www.facebook.com/share/1EC5sgwS9M/",
  tiktok_url: "https://www.tiktok.com/@nano.byte.technol",
  price_note: "الأسعار تتغير باستمرار، ونؤكد لك السعر النهائي عند الطلب.",
  services_text:
    "صيانة اللابتوبات وتغيير القطع. اكتب لنا موديل جهازك والمشكلة، ونرد عليك بالتكلفة والمدة.",
};
