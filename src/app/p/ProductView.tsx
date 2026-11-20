"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Check, Info, PackageX, Share2, ShoppingBag, Truck } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { addToCart } from "@/lib/cart";
import { CURRENCY, discountPercent, formatPrice, relativeDays, specLine } from "@/lib/format";
import { specRows } from "@/lib/specs";
import { imageUrl } from "@/lib/supabase";
import { productMessage, productUrl, waLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";
import { CartButton, TopBar } from "@/components/Chrome";
import { DiscountBadge, Price, ProductPlaceholder, ProductThumb, SpecText } from "@/components/ProductBits";
import { productHref } from "@/components/ProductCard";
import { ChatIcon, SPEC_ICONS } from "@/components/icons";
import { StoreNotice } from "@/components/HomeParts";
import { Toast, useToast } from "@/components/Toast";

export default function ProductView() {
  const sp = useSearchParams();
  const id = (sp.get("id") ?? "").trim();
  const { catalog, status, settings } = useCatalog();
  const product = useMemo(
    () => catalog?.products.find((p) => p.sku.toLowerCase() === id.toLowerCase() || p.id === id),
    [catalog, id],
  );
  const { msg, show } = useToast();

  const share = async () => {
    if (!product) return;
    const url = productUrl(product.sku);
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `${product.name} — نانو بايت`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      show({ text: "تم نسخ رابط المنتج" });
    } catch {
      /* user cancelled */
    }
  };

  const actions = (
    <>
      {product && (
        <button type="button" onClick={share} aria-label="مشاركة رابط المنتج" className="flex size-11 items-center justify-center rounded-xl text-ink">
          <Share2 className="size-[21px]" />
        </button>
      )}
      <CartButton bordered={false} />
    </>
  );

  if (!catalog) {
    return (
      <>
        <TopBar title="تفاصيل المنتج" actions={actions} />
        {status === "loading" ? (
          <div className="mx-auto max-w-5xl">
            <div className="skeleton h-[290px] w-full" />
            <div className="flex flex-col gap-3 p-4">
              <div className="skeleton h-7 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-20 w-full rounded-2xl" />
            </div>
          </div>
        ) : (
          <div className="pt-4">
            <StoreNotice status={status === "unconfigured" ? "unconfigured" : "error"} />
          </div>
        )}
      </>
    );
  }

  if (!product) {
    return (
      <>
        <TopBar title="تفاصيل المنتج" actions={actions} />
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <PackageX className="size-12 text-art" strokeWidth={1.5} />
          <p className="text-[15px] font-semibold">المنتج ده ما موجود حالياً</p>
          <p className="text-sm text-muted">ممكن يكون اتباع أو اتشال من المتجر.</p>
          <Link href="/shop/" className="mt-2 flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">
            تصفّح المنتجات
          </Link>
        </div>
      </>
    );
  }

  const p = product;
  const out = p.quantity <= 0;
  const disc = discountPercent(p);
  const updated = relativeDays(p.price_updated_at);
  const similar = catalog.products
    .filter((x) => x.id !== p.id && x.category_id === p.category_id && x.quantity > 0)
    .sort((a, b) => Math.abs((a.price ?? 0) - (p.price ?? 0)) - Math.abs((b.price ?? 0) - (p.price ?? 0)))
    .slice(0, 8);

  return (
    <div className="pb-[110px]">
      <TopBar title="تفاصيل المنتج" actions={actions} />

      <div className="mx-auto max-w-5xl md:grid md:grid-cols-2 md:gap-8 md:p-6">
        <Gallery product={p} />

        <div className="flex flex-col gap-5 px-4 pt-1.5 pb-6 md:px-0">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {p.brand && <span className="rounded-lg bg-tint px-2.5 py-1 text-xs font-semibold text-on-tint">{p.brand}</span>}
              {out ? (
                <span className="rounded-lg bg-red-bg px-2.5 py-1 text-xs font-semibold text-red-ink">نفد من المخزون</span>
              ) : (
                <span className="flex items-center gap-1 rounded-lg bg-green-bg px-2.5 py-1 text-xs font-semibold text-green-ink">
                  <Check className="size-3.5" strokeWidth={2.6} />
                  متوفر{p.quantity <= 5 ? ` · ${p.quantity} ${p.quantity === 1 ? "قطعة" : "قطع"}` : ""}
                </span>
              )}
              <span className="rounded-lg bg-field px-2.5 py-1 text-xs text-muted">
                رقم المنتج <span className="ltr font-semibold">{p.sku}</span>
              </span>
            </div>
            <h2 dir="auto" className="text-right text-[23px] leading-tight font-bold">
              {p.name}
            </h2>
            {specLine(p) && <SpecText product={p} className="text-sm leading-normal text-muted" />}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-field px-4 py-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted">السعر{updated && !p.price_on_request ? ` · محدّث ${updated}` : ""}</span>
              <Price product={p} size="lg" />
            </div>
            {disc && p.old_price && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[13px] text-faint line-through">
                  {formatPrice(p.old_price)} {CURRENCY}
                </span>
                <span className="rounded-lg bg-magenta px-2 py-0.5 text-xs font-bold text-white">وفّر {disc}%</span>
              </div>
            )}
          </div>
          {settings.price_note && (
            <p className="-mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {settings.price_note}
            </p>
          )}

          <section aria-label="المواصفات" className="flex flex-col gap-3">
            <h3 className="text-[17px] font-bold">المواصفات</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {specRows(p).map((r) => {
                const Icon = SPEC_ICONS[r.icon];
                return (
                  <div key={r.label} className="flex flex-col gap-1.5 rounded-[14px] bg-field p-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <Icon className="size-[18px] text-primary-ink" strokeWidth={1.8} aria-hidden="true" />
                      {r.label}
                    </span>
                    <span className="text-sm leading-snug font-semibold">
                      <bdi>{r.value}</bdi>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {p.description && (
            <section aria-label="الوصف" className="flex flex-col gap-2">
              <h3 className="text-[17px] font-bold">الوصف</h3>
              <p className="text-sm leading-7 whitespace-pre-line text-muted">{p.description}</p>
            </section>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3.5">
            <Truck className="mt-0.5 size-5 shrink-0 text-primary-ink" />
            <div className="flex flex-col gap-0.5 text-[13px] leading-relaxed">
              <span className="font-semibold">{settings.delivery_note}</span>
              <span className="text-muted">أو استلمه من المحل: {settings.address}</span>
            </div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-label="منتجات مشابهة" className="mx-auto flex max-w-5xl flex-col gap-3">
          <h3 className="px-4 text-[17px] font-bold">قد يعجبك أيضاً</h3>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
            {similar.map((s) => (
              <Link key={s.id} href={productHref(s)} className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-card text-ink">
                <span className="relative">
                  <ProductThumb product={s} size="sm" className="aspect-square w-full" />
                  <DiscountBadge product={s} className="absolute top-2 left-2" />
                </span>
                <span className="flex flex-col gap-1 p-2.5">
                  <span dir="auto" className="line-clamp-1 text-right text-[13px] font-semibold">
                    {s.name}
                  </span>
                  <SpecText product={s} className="line-clamp-1 text-xs text-muted" />
                  <Price product={s} size="sm" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card px-4 pt-3">
        <div className="mx-auto flex max-w-5xl gap-2.5">
          <a
            href={waLink(settings.whatsapp, productMessage(p))}
            target="_blank"
            rel="noopener"
            className="flex h-[54px] flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-green text-[15px] font-bold text-white"
          >
            <ChatIcon className="size-[21px]" />
            {out ? "اسأل عن توفره" : "اطلب عبر واتساب"}
          </a>
          {!out && (
            <button
              type="button"
              onClick={() => {
                addToCart(p);
                show({ text: "أُضيف للسلة", link: { href: "/cart/", label: "عرض السلة" } });
              }}
              className="flex h-[54px] flex-1 items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-primary-ink text-[15px] font-semibold text-primary-ink"
            >
              <ShoppingBag className="size-5" strokeWidth={2} />
              أضف للسلة
            </button>
          )}
        </div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}

function Gallery({ product: p }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const imgs = p.images;
  const go = (n: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: -n * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col">
      <div className="relative">
        {imgs.length ? (
          <div
            ref={ref}
            onScroll={(e) => setI(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))}
            className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-white md:rounded-3xl"
          >
            {imgs.map((im, n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={im.path}
                src={imageUrl(im.path) ?? ""}
                alt={`${p.name} — صورة ${n + 1}`}
                loading={n === 0 ? "eager" : "lazy"}
                decoding="async"
                className="size-full shrink-0 snap-center object-contain"
              />
            ))}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center bg-tile md:rounded-3xl">
            <ProductPlaceholder kind={p.kind} size="lg" />
          </div>
        )}
        <DiscountBadge product={p} className="absolute top-3.5 left-3.5 text-[13px]" />
        {imgs.length > 1 && (
          <span className="ltr absolute bottom-3.5 left-3.5 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
            {i + 1} / {imgs.length}
          </span>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3 md:px-0">
          {imgs.map((im, n) => (
            <button
              key={im.path}
              type="button"
              aria-label={`صورة ${n + 1}`}
              onClick={() => go(n)}
              className={`size-[58px] shrink-0 overflow-hidden rounded-xl bg-tile ${n === i ? "border-2 border-primary" : "border border-line"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(im.thumb || im.path) ?? ""} alt="" loading="lazy" className="size-full bg-white object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
