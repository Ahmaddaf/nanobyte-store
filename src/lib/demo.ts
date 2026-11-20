/**
 * SAMPLE DATA FOR LOCAL PREVIEW ONLY.
 * Loaded only when NEXT_PUBLIC_DEMO=1. Production builds never set it, so
 * customers only ever see the real products from the database.
 */
import { DEFAULT_SETTINGS } from "./config";
import type { Catalog, Category, Product } from "./types";

const categories: Category[] = [
  { id: "c1", slug: "new-laptops", name: "لابتوبات جديدة", icon: "laptop", sort: 1 },
  { id: "c2", slug: "used-laptops", name: "لابتوبات مستعملة", icon: "used", sort: 2 },
  { id: "c3", slug: "accessories", name: "إكسسوارات", icon: "mouse", sort: 3 },
  { id: "c4", slug: "parts", name: "قطع غيار", icon: "chip", sort: 4 },
  { id: "c5", slug: "chargers", name: "شواحن وبطاريات", icon: "battery", sort: 5 },
  { id: "c6", slug: "storage", name: "رام وتخزين", icon: "ram", sort: 6 },
];

const base = {
  cpu: null, cpu_family: null, cpu_gen: null, ram_gb: null, storage_type: null, storage_gb: null,
  gpu: null, screen: null, battery: null, condition: null, warranty: null, attrs: {},
  price: null, old_price: null, price_on_request: false, quantity: 1, is_offer: false,
  description: null, images: [], price_updated_at: null, brand: null,
} satisfies Partial<Product>;

let n = 0;
const day = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const p = (o: Partial<Product> & Pick<Product, "name" | "kind">): Product => {
  n++;
  return { ...base, id: `d${n}`, sku: `NB-${String(100 + n).padStart(4, "0")}`, category_id: null, created_at: day(n), price_updated_at: day(1), ...o } as Product;
};

const products: Product[] = [
  p({ kind: "laptop", category_id: "c2", brand: "HP", name: "HP EliteBook 840 G6", cpu: "Core i5-8365U", cpu_family: "Core i5", cpu_gen: "8", ram_gb: 8, storage_type: "SSD", storage_gb: 256, gpu: "Intel UHD 620", screen: "14 بوصة FHD", battery: "جيدة", condition: "used", price: 450000, old_price: 500000, quantity: 3, description: "جهاز أعمال خفيف ومتين، مناسب للطلاب والموظفين وبرامج المكتب." }),
  p({ kind: "laptop", category_id: "c2", brand: "Dell", name: "Dell Latitude 5490", cpu: "Core i7-8650U", cpu_family: "Core i7", cpu_gen: "8", ram_gb: 16, storage_type: "SSD", storage_gb: 512, gpu: "Intel UHD 620", screen: "14 بوصة", battery: "ممتازة", condition: "used", price: 560000, quantity: 2 }),
  p({ kind: "laptop", category_id: "c2", brand: "Lenovo", name: "Lenovo ThinkPad T14 Gen 1", cpu: "Core i5-10310U", cpu_family: "Core i5", cpu_gen: "10", ram_gb: 16, storage_type: "SSD", storage_gb: 256, gpu: "Intel UHD", screen: "14 بوصة FHD", battery: "جيدة", condition: "refurb", price: 610000, quantity: 1 }),
  p({ kind: "laptop", category_id: "c1", brand: "HP", name: "HP 250 G9", cpu: "Core i3-1215U", cpu_family: "Core i3", cpu_gen: "12", ram_gb: 8, storage_type: "SSD", storage_gb: 256, gpu: "Intel UHD", screen: "15.6 بوصة", condition: "new", price: 690000, old_price: 720000, quantity: 4, warranty: "سنة" }),
  p({ kind: "laptop", category_id: "c1", brand: "Lenovo", name: "Lenovo IdeaPad Slim 3", cpu: "Ryzen 5 7520U", cpu_family: "Ryzen 5", cpu_gen: "7000", ram_gb: 8, storage_type: "SSD", storage_gb: 512, gpu: "AMD Radeon", screen: "15.6 بوصة FHD", condition: "new", price: null, price_on_request: true, quantity: 2 }),
  p({ kind: "laptop", category_id: "c2", brand: "Dell", name: "Dell Latitude 7490", cpu: "Core i5-8350U", cpu_family: "Core i5", cpu_gen: "8", ram_gb: 8, storage_type: "SSD", storage_gb: 256, gpu: "Intel UHD 620", screen: "14 بوصة FHD", condition: "used", price: 470000, quantity: 0 }),
  p({ kind: "charger", category_id: "c5", brand: "HP", name: "شاحن لابتوب HP 65W", attrs: { type: "شاحن لابتوب", power: "65W", tip: "أزرق رفيع", compat: "HP EliteBook / ProBook" }, price: 25000, old_price: 30000, quantity: 10, is_offer: true }),
  p({ kind: "storage", category_id: "c6", brand: "Kingston", name: "رام لابتوب DDR4 8GB", attrs: { type: "RAM", capacity: "8GB", interface: "DDR4", for: "لابتوب" }, price: 38000, quantity: 6 }),
  p({ kind: "storage", category_id: "c6", brand: "Samsung", name: "SSD سامسونج 512GB", attrs: { type: "SSD", capacity: "512GB", interface: "SATA", for: "الاثنين" }, price: 52000, old_price: 58000, quantity: 5 }),
  p({ kind: "accessory", category_id: "c3", brand: "Logitech", name: "ماوس لاسلكي Logitech M185", attrs: { type: "ماوس", compat: "كل اللابتوبات", color: "رمادي" }, price: 12000, quantity: 8 }),
  p({ kind: "part", category_id: "c4", brand: "HP", name: "كيبورد HP EliteBook 840 G5/G6", attrs: { type: "كيبورد", compat: "HP 840 G5 / G6" }, price: 30000, quantity: 2 }),
];

export function demoCatalog(): Catalog {
  return {
    products,
    categories,
    banners: [],
    settings: DEFAULT_SETTINGS,
    fetchedAt: Date.now(),
  };
}
