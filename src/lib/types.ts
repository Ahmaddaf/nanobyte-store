export type Kind = "laptop" | "accessory" | "part" | "charger" | "storage";
export type Condition = "new" | "used" | "refurb";

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** one of the keys in components/CategoryIcon */
  icon: string;
  sort: number;
}

export interface ProductImage {
  /** full-size image (≈1200px, compressed on upload) */
  path: string;
  /** small thumbnail (≈400px) used in lists */
  thumb: string;
  sort: number;
}

export interface Product {
  id: string;
  sku: string;
  kind: Kind;
  category_id: string | null;
  brand: string | null;
  name: string;
  // laptop fields (null for other kinds)
  cpu: string | null;
  cpu_family: string | null;
  cpu_gen: string | null;
  ram_gb: number | null;
  storage_type: "SSD" | "HDD" | null;
  storage_gb: number | null;
  gpu: string | null;
  screen: string | null;
  battery: string | null;
  // shared
  condition: Condition | null;
  warranty: string | null;
  /** kind-specific fields for non-laptop products */
  attrs: Record<string, string>;
  price: number | null;
  old_price: number | null;
  price_on_request: boolean;
  quantity: number;
  is_offer: boolean;
  description: string | null;
  images: ProductImage[];
  created_at: string;
  price_updated_at: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
  sort: number;
}

export interface Settings {
  store_name: string;
  /** WhatsApp number in international format, digits only, e.g. 249126111169 */
  whatsapp: string;
  phone_primary: string;
  phone_secondary: string | null;
  address: string;
  map_url: string | null;
  hours: string;
  delivery_note: string;
  facebook_url: string | null;
  tiktok_url: string | null;
  price_note: string | null;
  services_text: string;
}

export interface Catalog {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: Settings;
  fetchedAt: number;
}
