import { SITE_URL } from "./config";
import { CURRENCY, formatPrice } from "./format";
import type { Product } from "./types";

/** wa.me link; `number` is international digits only (e.g. 249126111169). */
export function waLink(number: string, text?: string): string {
  const n = number.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function productUrl(sku: string): string {
  const base = SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/p/?id=${encodeURIComponent(sku)}`;
}

export function priceText(price: number | null, onRequest = false): string {
  if (onRequest || price == null) return "يُحدد عند الطلب";
  return `${formatPrice(price)} ${CURRENCY}`;
}

export function productMessage(p: Product): string {
  const lines = [
    "السلام عليكم نانو بايت، أريد طلب هذا المنتج:",
    "",
    p.name,
    `رقم المنتج: ${p.sku}`,
    `السعر: ${priceText(p.price, p.price_on_request)}`,
    productUrl(p.sku),
  ];
  if (p.quantity <= 0) lines[0] = "السلام عليكم نانو بايت، هل هذا المنتج متوفر؟";
  return lines.join("\n");
}

export interface OrderLine {
  name: string;
  sku: string;
  qty: number;
  price: number | null;
}

export interface CustomerInfo {
  name: string;
  delivery: "pickup" | "delivery";
  city: string;
  address: string;
  note: string;
}

export function cartMessage(lines: OrderLine[], customer: CustomerInfo, orderNo?: string | null): string {
  const out: string[] = ["السلام عليكم نانو بايت، أريد طلب:", ""];
  lines.forEach((l, i) => {
    out.push(`${i + 1}) ${l.name}`);
    out.push(`رقم المنتج: ${l.sku} — الكمية: ${l.qty}`);
    out.push(`السعر: ${priceText(l.price)}${l.price != null && l.qty > 1 ? ` × ${l.qty}` : ""}`);
    out.push(productUrl(l.sku));
    out.push("");
  });
  const known = lines.filter((l) => l.price != null);
  const total = known.reduce((s, l) => s + (l.price ?? 0) * l.qty, 0);
  if (known.length) {
    out.push(`الإجمالي: ${formatPrice(total)} ${CURRENCY}${known.length < lines.length ? " + منتجات سعرها يُحدد عند الطلب" : ""}`);
  }
  if (orderNo) out.push(`رقم الطلب: #${orderNo}`);
  out.push(customer.delivery === "delivery" ? "الاستلام: توصيل" : "الاستلام: من المحل");
  if (customer.delivery === "delivery" && customer.city.trim()) out.push(`المدينة / الولاية: ${customer.city.trim()}`);
  if (customer.delivery === "delivery" && customer.address.trim()) out.push(`العنوان: ${customer.address.trim()}`);
  if (customer.name.trim()) out.push(`الاسم: ${customer.name.trim()}`);
  if (customer.note.trim()) out.push(`ملاحظة: ${customer.note.trim()}`);
  return out.join("\n");
}
