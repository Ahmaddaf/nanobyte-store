import type { Category, Product } from "./types";
import { CONDITION_LABEL, discountPercent, formatStorage } from "./format";
import { KIND_LABEL } from "./specs";

/** Arabic + Latin normalisation so "لينوفو", "Lenovo" and "lenovo" all match. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "") // tashkeel + tatweel
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/(جيجا|جيقا|قيقا|غيغا|جيجابايت|جيبي)/g, "gb")
    .replace(/(تيرا|تيرابايت)/g, "tb")
    .replace(/(\d+)\s*(gb|tb)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

const BRAND_ALIASES: Record<string, string> = {
  hp: "اتش بي اتشبي هيوليت",
  dell: "ديل",
  lenovo: "لينوفو لنوفو",
  apple: "ابل ماك ماكبوك macbook",
  asus: "اسوس ازوس",
  acer: "ايسر اسير",
  toshiba: "توشيبا",
  microsoft: "مايكروسوفت سيرفس surface",
  samsung: "سامسونج",
  msi: "ام اس اي",
};

/** How people type product words in Arabic, so "زيون كوادرو" finds "Xeon … Quadro". */
const WORD_ALIASES: [RegExp, string][] = [
  [/\bram\b/, "رام ذاكره"],
  [/\bssd\b/, "اس اس دي هارد"],
  [/\bhdd\b/, "هارد"],
  [/\bnvme\b/, "ان في مي"],
  [/\bi3\b/, "كور اي 3"],
  [/\bi5\b/, "كور اي 5"],
  [/\bi7\b/, "كور اي 7"],
  [/\bi9\b/, "كور اي 9"],
  [/\bintel\b/, "انتل"],
  [/\bxeon\b/, "زيون"],
  [/\bryzen\b/, "رايزن"],
  [/\bamd\b/, "اي ام دي"],
  [/\bceleron\b/, "سيليرون"],
  [/\bpentium\b/, "بنتيوم"],
  [/\bnvidia\b/, "انفيديا نفيديا"],
  [/\bquadro\b/, "كوادرو كرت شاشه"],
  [/\bgeforce\b/, "جيفورس كرت شاشه"],
  [/\brtx\b/, "ار تي اكس"],
  [/\bgtx\b/, "جي تي اكس"],
  [/\bradeon\b/, "راديون"],
  [/\bprecision\b/, "بريسيجن بريسيشن"],
  [/\blatitude\b/, "لاتيتيود"],
  [/\belitebook\b/, "اليت بوك اليتبوك"],
  [/\bprobook\b/, "برو بوك بروبوك"],
  [/\bthinkpad\b/, "ثينك باد ثنك باد"],
  [/\bideapad\b/, "ايديا باد"],
  [/\binspiron\b/, "انسبايرون"],
  [/\bvostro\b/, "فوسترو"],
  [/\bxps\b/, "اكس بي اس"],
  [/\bmacbook\b/, "ماك بوك"],
  [/\bsurface\b/, "سيرفس"],
  [/\bworkstation\b/, "ورك ستيشن وركستيشن"],
  [/\bgaming\b/, "جيمنج قيمنق العاب"],
  [/\b(fhd|1080p)\b/, "فل اتش دي"],
  [/\btouch\b/, "تاتش لمس"],
];

export function haystack(p: Product, categories: Category[]): string {
  const cat = categories.find((c) => c.id === p.category_id)?.name ?? "";
  const brand = (p.brand ?? "").toLowerCase();
  const parts = [
    p.name,
    p.sku,
    p.brand,
    BRAND_ALIASES[brand],
    p.cpu,
    p.cpu_family,
    p.cpu_gen ? `الجيل ${p.cpu_gen} gen${p.cpu_gen} ${p.cpu_gen}th` : "",
    p.ram_gb ? `${p.ram_gb}gb رام ${p.ram_gb}` : "",
    p.storage_gb ? `${p.storage_type ?? ""} ${formatStorage(p.storage_gb)}` : "",
    p.gpu,
    p.screen,
    p.condition ? CONDITION_LABEL[p.condition] : "",
    KIND_LABEL[p.kind],
    cat,
    ...Object.values(p.attrs ?? {}),
    p.description,
  ];
  let h = normalize(parts.filter(Boolean).join(" "));
  for (const [re, add] of WORD_ALIASES) if (re.test(h)) h += " " + normalize(add);
  return h;
}

export function matches(hay: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return q.split(" ").every((tok) => hay.includes(tok));
}

// ---------------------------------------------------------------------------
// Filters (all kept in the URL so links can be shared and Back works)
// ---------------------------------------------------------------------------

export type SortKey = "new" | "price_asc" | "price_desc" | "offers";

export const SORT_LABEL: Record<SortKey, string> = {
  new: "الأحدث",
  price_asc: "السعر: من الأقل",
  price_desc: "السعر: من الأعلى",
  offers: "العروض أولاً",
};

export interface Filters {
  q: string;
  cat: string; // category slug
  brand: string[];
  cond: string[];
  cpu: string[];
  gen: string[];
  ram: string[];
  sto: string[];
  min: number | null;
  max: number | null;
  stock: boolean;
  offers: boolean;
  sort: SortKey;
}

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);

export function parseFilters(sp: URLSearchParams): Filters {
  const sort = sp.get("sort") as SortKey | null;
  return {
    q: sp.get("q") ?? "",
    cat: sp.get("cat") ?? "",
    brand: list(sp.get("brand")),
    cond: list(sp.get("cond")),
    cpu: list(sp.get("cpu")),
    gen: list(sp.get("gen")),
    ram: list(sp.get("ram")),
    sto: list(sp.get("sto")),
    min: num(sp.get("min")),
    max: num(sp.get("max")),
    stock: sp.get("stock") === "1",
    offers: sp.get("offers") === "1",
    sort: sort && sort in SORT_LABEL ? sort : "new",
  };
}

export function filtersToQuery(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.cat) sp.set("cat", f.cat);
  if (f.brand.length) sp.set("brand", f.brand.join(","));
  if (f.cond.length) sp.set("cond", f.cond.join(","));
  if (f.cpu.length) sp.set("cpu", f.cpu.join(","));
  if (f.gen.length) sp.set("gen", f.gen.join(","));
  if (f.ram.length) sp.set("ram", f.ram.join(","));
  if (f.sto.length) sp.set("sto", f.sto.join(","));
  if (f.min != null) sp.set("min", String(f.min));
  if (f.max != null) sp.set("max", String(f.max));
  if (f.stock) sp.set("stock", "1");
  if (f.offers) sp.set("offers", "1");
  if (f.sort !== "new") sp.set("sort", f.sort);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(f: Filters): number {
  return (
    f.brand.length + f.cond.length + f.cpu.length + f.gen.length + f.ram.length + f.sto.length +
    (f.min != null ? 1 : 0) + (f.max != null ? 1 : 0) + (f.stock ? 1 : 0)
  );
}

export const storageKey = (p: Product) =>
  p.storage_gb ? `${p.storage_type ?? ""} ${formatStorage(p.storage_gb)}`.trim() : "";

export function isOffer(p: Product) {
  return p.is_offer || discountPercent(p) !== null;
}

/** Filters everything except the facet named in `skip` (so each facet shows what is still available). */
export function applyFilters(
  products: Product[],
  f: Filters,
  categories: Category[],
  hay: Map<string, string>,
  skip?: keyof Filters,
): Product[] {
  const catId = f.cat ? categories.find((c) => c.slug === f.cat)?.id : undefined;
  return products.filter((p) => {
    if (f.cat && skip !== "cat" && p.category_id !== catId) return false;
    if (f.offers && !isOffer(p)) return false;
    if (f.q && !matches(hay.get(p.id) ?? "", f.q)) return false;
    if (skip !== "brand" && f.brand.length && !f.brand.includes(p.brand ?? "")) return false;
    if (skip !== "cond" && f.cond.length && !f.cond.includes(p.condition ?? "")) return false;
    if (skip !== "cpu" && f.cpu.length && !f.cpu.includes(p.cpu_family ?? "")) return false;
    if (skip !== "gen" && f.gen.length && !f.gen.includes(p.cpu_gen ?? "")) return false;
    if (skip !== "ram" && f.ram.length && !f.ram.includes(String(p.ram_gb ?? ""))) return false;
    if (skip !== "sto" && f.sto.length && !f.sto.includes(storageKey(p))) return false;
    if (f.min != null && (p.price == null || p.price < f.min)) return false;
    if (f.max != null && (p.price == null || p.price > f.max)) return false;
    if (f.stock && p.quantity <= 0) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const arr = [...products];
  const inStock = (p: Product) => (p.quantity > 0 ? 0 : 1);
  const price = (p: Product, dir: 1 | -1) => (p.price == null ? Infinity : dir * p.price);
  arr.sort((a, b) => {
    // out-of-stock items always go last
    const s = inStock(a) - inStock(b);
    if (s) return s;
    switch (sort) {
      case "price_asc":
        return price(a, 1) - price(b, 1);
      case "price_desc":
        return price(a, -1) - price(b, -1);
      case "offers":
        return (discountPercent(b) ?? (b.is_offer ? 0.5 : 0)) - (discountPercent(a) ?? (a.is_offer ? 0.5 : 0));
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
  return arr;
}

export function facetValues<T extends string>(products: Product[], pick: (p: Product) => T | null | undefined): T[] {
  const set = new Set<T>();
  for (const p of products) {
    const v = pick(p);
    if (v) set.add(v);
  }
  return [...set];
}
