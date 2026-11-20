"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Info, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { clearCart, removeFromCart, setQty, useCart } from "@/lib/cart";
import { createStore } from "@/lib/store";
import { CURRENCY, formatPrice, specLine } from "@/lib/format";
import { cartMessage, waLink, type CustomerInfo, type OrderLine } from "@/lib/whatsapp";
import { BottomNav, TopBar } from "@/components/Chrome";
import { ProductThumb, SpecText } from "@/components/ProductBits";
import { productHref } from "@/components/ProductCard";
import { ChatIcon } from "@/components/icons";

const customerStore = createStore<CustomerInfo>("nb-customer-v1", { name: "", delivery: "pickup", city: "", address: "", note: "" });

export default function CartView() {
  const items = useCart();
  const customer = customerStore.use();
  const { catalog, settings } = useCatalog();

  // always use the latest name/price/stock from the catalogue
  const lines = useMemo(
    () =>
      items.map((i) => {
        const p = catalog?.products.find((x) => x.id === i.id);
        return {
          item: i,
          product: p,
          price: p ? (p.price_on_request ? null : p.price) : i.price,
          name: p?.name ?? i.name,
          unavailable: Boolean(catalog) && (!p || p.quantity <= 0),
        };
      }),
    [items, catalog],
  );

  const orderLines: OrderLine[] = lines
    .filter((l) => !l.unavailable)
    .map((l) => ({ name: l.name, sku: l.item.sku, qty: l.item.qty, price: l.price }));
  const priced = orderLines.filter((l) => l.price != null);
  const total = priced.reduce((s, l) => s + (l.price ?? 0) * l.qty, 0);
  const message = cartMessage(orderLines, customer);
  const set = (patch: Partial<CustomerInfo>) => customerStore.set((c) => ({ ...c, ...patch }));

  if (!items.length) {
    return (
      <div className="pb-nav">
        <TopBar title="سلة الطلب" />
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <ShoppingBag className="size-14 text-art" strokeWidth={1.4} />
          <p className="text-base font-semibold">السلة فاضية</p>
          <p className="text-sm text-muted">أضف المنتجات اللي عايزها، وبعدها أرسل الطلب كله في رسالة واتساب واحدة.</p>
          <Link href="/shop/" className="mt-2 flex h-12 items-center rounded-2xl bg-primary px-6 text-[15px] font-semibold text-white">
            تصفّح المنتجات
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="pb-[110px]">
      <TopBar
        title="سلة الطلب"
        actions={
          <button type="button" onClick={clearCart} className="flex h-11 items-center rounded-xl px-3 text-[13px] font-medium text-muted">
            تفريغ
          </button>
        }
      />

      <main className="mx-auto flex max-w-2xl flex-col gap-3.5 p-4">
        <section aria-label="المنتجات" className="rounded-[20px] border border-line bg-card px-3.5">
          {lines.map(({ item, product, price, name, unavailable }) => (
            <div key={item.id} className="flex gap-3 border-b border-line py-3.5">
              <Link href={product ? productHref(product) : "#"} className="shrink-0">
                {product ? (
                  <ProductThumb product={product} size="sm" className="size-[76px] rounded-[14px]" />
                ) : (
                  <span className="block size-[76px] rounded-[14px] bg-tile" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span dir="auto" className="line-clamp-2 text-right text-sm font-semibold">
                  {name}
                </span>
                <span className="text-xs text-muted">
                  {product && <SpecText product={product} />}
                  {product && specLine(product) ? " · " : ""}
                  <bdi>{item.sku}</bdi>
                </span>
                {unavailable ? (
                  <span className="mt-1 self-start rounded-lg bg-red-bg px-2 py-0.5 text-xs font-semibold text-red-ink">غير متوفر حالياً</span>
                ) : (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[15px] font-bold">
                      {price != null ? (
                        <>
                          {formatPrice(price * item.qty)} <span className="text-xs font-medium">{CURRENCY}</span>
                        </>
                      ) : (
                        <span className="text-sm text-primary-ink">يُحدد عند الطلب</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1 rounded-xl bg-field p-0.5">
                      <button
                        type="button"
                        aria-label="زيادة الكمية"
                        disabled={product ? item.qty >= Math.max(1, product.quantity) : false}
                        onClick={() => setQty(item.id, item.qty + 1)}
                        className="flex size-9 items-center justify-center rounded-[10px] bg-card text-ink disabled:opacity-40"
                      >
                        <Plus className="size-[18px]" />
                      </button>
                      <span className="min-w-[22px] text-center text-[15px] font-semibold">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="إنقاص الكمية"
                        onClick={() => setQty(item.id, item.qty - 1)}
                        className="flex size-9 items-center justify-center rounded-[10px] bg-card text-ink"
                      >
                        <Minus className="size-[18px]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label={`حذف ${name} من السلة`}
                onClick={() => removeFromCart(item.id)}
                className="flex size-9 shrink-0 items-center justify-center self-start text-faint"
              >
                <Trash2 className="size-[19px]" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between py-3.5">
            <span className="text-[15px] font-semibold">الإجمالي</span>
            <span className="text-xl font-bold">
              {formatPrice(total)} <span className="text-[13px] font-medium">{CURRENCY}</span>
            </span>
          </div>
          {priced.length < orderLines.length && (
            <p className="-mt-1.5 pb-3 text-xs text-muted">+ منتجات سعرها يُحدد عند الطلب</p>
          )}
        </section>

        <section aria-label="الاستلام" className="flex flex-col gap-3 rounded-[20px] border border-line bg-card px-3.5 py-4">
          <h2 className="text-base font-bold">طريقة الاستلام</h2>
          <div role="group" aria-label="طريقة الاستلام" className="flex gap-1 rounded-xl bg-field p-1">
            {(["pickup", "delivery"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={customer.delivery === d}
                onClick={() => set({ delivery: d })}
                className={`h-10 flex-1 rounded-[9px] text-sm ${customer.delivery === d ? "border border-line bg-card font-bold text-primary-ink" : "font-medium text-muted"}`}
              >
                {d === "pickup" ? "استلام من المحل" : "توصيل"}
              </button>
            ))}
          </div>
          {customer.delivery === "delivery" ? (
            <>
              <p className="text-xs text-muted">{settings.delivery_note}. نتفق معاك على رسوم التوصيل في واتساب.</p>
              <Field label="المدينة / الولاية" value={customer.city} onChange={(v) => set({ city: v })} placeholder="مثال: الخرطوم بحري" />
              <Field label="العنوان" value={customer.address} onChange={(v) => set({ address: v })} placeholder="الحي، أقرب معلم" />
            </>
          ) : (
            <p className="text-xs text-muted">
              {settings.address} — {settings.hours}
            </p>
          )}
        </section>

        <section aria-label="بياناتك" className="flex flex-col gap-3 rounded-[20px] border border-line bg-card px-3.5 py-4">
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-base font-bold">بياناتك</h2>
            <span className="text-xs text-muted">(اختياري)</span>
          </div>
          <Field label="الاسم" value={customer.name} onChange={(v) => set({ name: v })} placeholder="مثال: محمد أحمد" />
          <Field label="ملاحظة" value={customer.note} onChange={(v) => set({ note: v })} placeholder="أي تفاصيل إضافية…" textarea />
        </section>

        <section aria-label="معاينة رسالة واتساب" className="flex flex-col gap-3 rounded-[20px] border border-line bg-card px-3.5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">الرسالة التي ستُرسل</h2>
            <span className="text-xs text-muted">
              إلى: <span className="ltr font-semibold text-ink">{settings.phone_primary}</span>
            </span>
          </div>
          <div className="rounded-2xl bg-[#e9f1e6] p-3.5 dark:bg-[#17251b]">
            <div dir="auto" className="rounded-[14px] rounded-bl-[4px] bg-[#d7f5c8] px-3.5 py-3 text-[13.5px] leading-[1.7] break-words whitespace-pre-line text-[#13261a] dark:bg-[#1f4a2c] dark:text-[#e8f6ec]">
              {message}
            </div>
          </div>
        </section>

        <div className="flex items-start gap-2.5 rounded-2xl bg-tint px-3.5 py-3 text-on-tint">
          <Info className="mt-0.5 size-5 shrink-0" />
          <p className="text-[13px] leading-relaxed">الطلب ما بيتأكد إلا بعد ما ترسل الرسالة ونرد عليك في واتساب بالسعر النهائي والتوصيل.</p>
        </div>
      </main>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card px-4 pt-3">
        <div className="mx-auto max-w-2xl">
          {orderLines.length ? (
            <a
              href={waLink(settings.whatsapp, message)}
              target="_blank"
              rel="noopener"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green text-base font-bold text-white"
            >
              <ChatIcon className="size-[22px]" />
              أرسل الطلب عبر واتساب
            </a>
          ) : (
            <p className="py-4 text-center text-sm text-muted">المنتجات في السلة غير متوفرة حالياً.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const cls = "rounded-xl border border-line bg-card px-3.5 text-sm text-ink outline-none focus:border-primary";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium">{label}</span>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${cls} resize-none py-3`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${cls} h-12`} />
      )}
    </label>
  );
}
