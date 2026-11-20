"use client";

import { STORAGE_BUCKET } from "./config";
import { refreshCatalog } from "./catalog";
import { compressImage } from "./image";
import { supabase } from "./supabase";
import type { Category, Product, ProductImage, Settings } from "./types";
import type { Role } from "./auth";

export type AdminImage = ProductImage & { id: string };
export type AdminProduct = Omit<Product, "images"> & { is_visible: boolean; updated_at: string; images: AdminImage[] };

const PRODUCT_SELECT = "*, images:product_images(id,path,thumb,sort)";

function fail(e: { message: string } | null): asserts e is null {
  if (e) throw new Error(friendly(e.message));
}

export function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("row-level security") || m.includes("permission denied") || m.includes("not_allowed"))
    return "ما عندك صلاحية للعملية دي.";
  if (m.includes("failed to fetch") || m.includes("network")) return "مشكلة في الاتصال بالإنترنت. حاول تاني.";
  if (m.includes("duplicate key") && m.includes("slug")) return "في قسم بنفس الرابط. غيّر الاسم الإنجليزي.";
  if (m.includes("duplicate key")) return "العنصر ده موجود من قبل.";
  if (m.includes("check constraint")) return "في قيمة غير صحيحة في البيانات. راجع الحقول.";
  if (m.includes("jwt") || m.includes("token")) return "انتهت الجلسة. سجّل دخول تاني.";
  return msg;
}

function sortImages(p: AdminProduct): AdminProduct {
  return {
    ...p,
    attrs: p.attrs ?? {},
    images: [...(p.images ?? [])].sort((a, b) => a.sort - b.sort),
    price: p.price == null ? null : Number(p.price),
    old_price: p.old_price == null ? null : Number(p.old_price),
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export async function listProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase().from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  fail(error);
  return (data as AdminProduct[]).map(sortImages);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase().from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  fail(error);
  return data ? sortImages(data as AdminProduct) : null;
}

export type ProductDraft = Omit<AdminProduct, "sku" | "images" | "created_at" | "updated_at" | "price_updated_at"> & {
  sku?: string;
};

const EDITABLE: (keyof ProductDraft)[] = [
  "kind", "category_id", "brand", "name", "cpu", "cpu_family", "cpu_gen", "ram_gb", "storage_type", "storage_gb",
  "gpu", "screen", "battery", "condition", "warranty", "attrs", "price", "old_price", "price_on_request",
  "quantity", "is_visible", "is_offer", "description",
];

export async function saveProduct(draft: ProductDraft, isNew: boolean): Promise<AdminProduct> {
  const row: Record<string, unknown> = { id: draft.id };
  for (const k of EDITABLE) row[k] = draft[k];
  const sb = supabase();
  const q = isNew ? sb.from("products").insert(row) : sb.from("products").update(row).eq("id", draft.id);
  const { data, error } = await q.select(PRODUCT_SELECT).single();
  fail(error);
  return sortImages(data as AdminProduct);
}

export async function quickUpdate(id: string, patch: Partial<Pick<Product, "price" | "quantity" | "is_offer">> & { is_visible?: boolean }) {
  const { error } = await supabase().from("products").update(patch).eq("id", id);
  fail(error);
}

export async function deleteProduct(p: AdminProduct) {
  const sb = supabase();
  const files = p.images.flatMap((i) => [i.path, i.thumb]);
  if (files.length) await sb.storage.from(STORAGE_BUCKET).remove(files);
  const { error } = await sb.from("products").delete().eq("id", p.id);
  fail(error);
}

/** Compresses and uploads photos, then links them to the product. */
export async function uploadImages(productId: string, files: File[], startSort: number, onProgress?: (done: number) => void) {
  const sb = supabase();
  let done = 0;
  for (const [n, file] of files.entries()) {
    const { full, thumb, ext } = await compressImage(file);
    const key = crypto.randomUUID();
    const path = `${productId}/${key}.${ext}`;
    const tpath = `${productId}/${key}-t.${ext}`;
    const type = ext === "webp" ? "image/webp" : "image/jpeg";
    const up1 = await sb.storage.from(STORAGE_BUCKET).upload(path, full, { contentType: type, cacheControl: "31536000" });
    fail(up1.error);
    const up2 = await sb.storage.from(STORAGE_BUCKET).upload(tpath, thumb, { contentType: type, cacheControl: "31536000" });
    fail(up2.error);
    const { error } = await sb.from("product_images").insert({ product_id: productId, path, thumb: tpath, sort: startSort + n });
    fail(error);
    onProgress?.(++done);
  }
}

export async function deleteImage(img: AdminImage) {
  const sb = supabase();
  await sb.storage.from(STORAGE_BUCKET).remove([img.path, img.thumb]);
  const { error } = await sb.from("product_images").delete().eq("id", img.id);
  fail(error);
}

export async function setImageSort(items: { id: string; sort: number }[]) {
  const sb = supabase();
  for (const { id, sort } of items) {
    const { error } = await sb.from("product_images").update({ sort }).eq("id", id);
    fail(error);
  }
}

/** "Core i5-8365U" -> { family: "Core i5", gen: "8" }; "Ryzen 5 5500U" -> { family: "Ryzen 5" } */
export function guessCpu(cpu: string): { family: string | null; gen: string | null } {
  const s = cpu.trim();
  let family: string | null = null;
  let gen: string | null = null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/ultra\s*([3579])/i))) family = `Core Ultra ${m[1]}`;
  else if ((m = s.match(/\bi([3579])\b|\bi([3579])-/i))) family = `Core i${m[1] ?? m[2]}`;
  else if ((m = s.match(/ryzen\s*([3579])/i))) family = `Ryzen ${m[1]}`;
  else if (/celeron/i.test(s)) family = "Celeron";
  else if (/pentium/i.test(s)) family = "Pentium";
  else if ((m = s.match(/\bm([1-5])\b/i))) family = `Apple M${m[1]}`;
  const model = s.match(/i[3579]-(\d{4,5})/i)?.[1];
  if (model) gen = model.length === 5 ? model.slice(0, 2) : model[0] === "1" ? model.slice(0, 2) : model[0];
  return { family, gen };
}

// ---------------------------------------------------------------------------
// Categories (admin)
// ---------------------------------------------------------------------------
export type AdminCategory = Category & { is_visible: boolean };

export async function listCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase().from("categories").select("id,slug,name,icon,sort,is_visible").order("sort");
  fail(error);
  return data as AdminCategory[];
}

export async function saveCategory(c: Partial<AdminCategory> & { name: string; slug: string }) {
  const sb = supabase();
  const row = { name: c.name.trim(), slug: c.slug, icon: c.icon ?? "box", sort: c.sort ?? 0, is_visible: c.is_visible ?? true };
  const { error } = c.id ? await sb.from("categories").update(row).eq("id", c.id) : await sb.from("categories").insert(row);
  fail(error);
}

export async function deleteCategory(id: string) {
  const { error } = await supabase().from("categories").delete().eq("id", id);
  fail(error);
}

// ---------------------------------------------------------------------------
// Settings (admin)
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase().from("settings").select("*").eq("id", 1).single();
  fail(error);
  return data as Settings;
}

export async function saveSettings(s: Partial<Settings>) {
  const { error } = await supabase().from("settings").update({ ...s, updated_at: new Date().toISOString() }).eq("id", 1);
  fail(error);
}

export async function adjustPrices(percent: number, categoryId: string | null, roundTo: number): Promise<number> {
  const { data, error } = await supabase().rpc("adjust_prices", { p_percent: percent, p_category: categoryId, p_round_to: roundTo });
  fail(error);
  return data as number;
}

// ---------------------------------------------------------------------------
// Staff (admin)
// ---------------------------------------------------------------------------
export interface StaffMember { user_id: string; email: string; name: string | null; role: Role; created_at: string }
export interface Invite { email: string; name: string | null; role: Role; created_at: string }

export async function listStaff(): Promise<{ members: StaffMember[]; invites: Invite[] }> {
  const sb = supabase();
  const [m, i] = await Promise.all([
    sb.from("staff").select("user_id,email,name,role,created_at").order("created_at"),
    sb.from("staff_invites").select("email,name,role,created_at").is("used_at", null).order("created_at"),
  ]);
  fail(m.error);
  fail(i.error);
  return { members: m.data as StaffMember[], invites: i.data as Invite[] };
}

export async function inviteStaff(email: string, name: string, role: Role) {
  const { error } = await supabase()
    .from("staff_invites")
    .upsert({ email: email.trim().toLowerCase(), name: name.trim() || null, role, used_at: null }, { onConflict: "email" });
  fail(error);
}

export async function cancelInvite(email: string) {
  const { error } = await supabase().from("staff_invites").delete().eq("email", email);
  fail(error);
}

export async function setStaffRole(userId: string, role: Role) {
  const { error } = await supabase().from("staff").update({ role }).eq("user_id", userId);
  fail(error);
}

export async function removeStaff(userId: string) {
  const { error } = await supabase().from("staff").delete().eq("user_id", userId);
  fail(error);
}

// ---------------------------------------------------------------------------
// Dashboard numbers
// ---------------------------------------------------------------------------
export async function pendingOrdersCount(): Promise<number> {
  const { count, error } = await supabase().from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");
  fail(error);
  return count ?? 0;
}

/** After any change, refresh the public catalogue cached on this phone. */
export function afterChange() {
  void refreshCatalog();
}
