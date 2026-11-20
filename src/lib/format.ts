import type { Condition, Product } from "./types";

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const CURRENCY = "ج.س";

export function formatPrice(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return nf.format(n);
}

export function discountPercent(p: Pick<Product, "price" | "old_price">): number | null {
  if (!p.price || !p.old_price || p.old_price <= p.price) return null;
  const pct = Math.round(((p.old_price - p.price) / p.old_price) * 100);
  return pct > 0 ? pct : null;
}

export function hasDiscount(p: Product): boolean {
  return discountPercent(p) !== null;
}

export const CONDITION_LABEL: Record<Condition, string> = {
  new: "جديد",
  used: "مستعمل",
  refurb: "مجدد",
};

export function formatStorage(gb: number | null | undefined): string {
  if (!gb) return "";
  // stored in GB; 1000 = 1TB
  return gb >= 1000 ? `${+(gb / 1000).toFixed(1)}TB` : `${gb}GB`;
}

/** Short spec summary parts used on cards, e.g. ["Core i5", "الجيل 8", "8GB", "SSD 256GB"] */
export function specParts(p: Product): string[] {
  if (p.kind === "laptop") {
    const parts: string[] = [];
    if (p.cpu_family) parts.push(p.cpu_family);
    else if (p.cpu) parts.push(p.cpu);
    if (p.cpu_gen) parts.push(genLabel(p.cpu_gen));
    if (p.ram_gb) parts.push(`${p.ram_gb}GB`);
    if (p.storage_gb) parts.push(`${p.storage_type ?? ""} ${formatStorage(p.storage_gb)}`.trim());
    return parts;
  }
  return Object.values(p.attrs ?? {})
    .filter(Boolean)
    .slice(0, 3);
}

export function specLine(p: Product): string {
  return specParts(p).join(" · ");
}

/** "8" -> "الجيل 8"; free text such as "Ryzen 5000" is kept as is. */
export function genLabel(gen: string): string {
  return /^\d+$/.test(gen.trim()) ? `الجيل ${gen.trim()}` : gen;
}

export function relativeDays(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days === 2) return "قبل يومين";
  if (days <= 10) return `قبل ${days} أيام`;
  return `قبل ${days} يوم`;
}
