"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Percent, Wrench } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { isOffer, sortProducts } from "@/lib/search";
import { waLink } from "@/lib/whatsapp";
import { BottomNav, CartButton, DesktopNav, Logo, SectionHead, ThemeButton } from "@/components/Chrome";
import { BannerCarousel, ContactCard, SearchBar, StoreNotice } from "@/components/HomeParts";
import { ProductGrid, ProductGridSkeleton, productHref } from "@/components/ProductCard";
import { Price, ProductThumb, DiscountBadge } from "@/components/ProductBits";
import { CategoryIcon, ChatIcon } from "@/components/icons";
import { Footer } from "@/components/Footer";

export default function HomeView() {
  const { catalog, status, settings } = useCatalog();
  const products = useMemo(() => catalog?.products ?? [], [catalog]);

  const newest = useMemo(() => sortProducts(products, "new").slice(0, 6), [products]);
  const offers = useMemo(() => sortProducts(products.filter(isOffer), "offers").slice(0, 10), [products]);
  const brands = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of products) if (p.brand && p.kind === "laptop") count.set(p.brand, (count.get(p.brand) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([b]) => b);
  }, [products]);

  const loading = !catalog && status === "loading";

  return (
    <div className="pb-nav md:pb-10">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-3.5 pb-3.5">
          <div className="flex items-center justify-between">
            <Logo />
            <DesktopNav />
            <div className="flex items-center gap-1.5">
              <ThemeButton />
              <CartButton />
            </div>
          </div>
          <SearchBar />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-[26px] pt-4">
        {!catalog && (status === "unconfigured" || status === "error") && <StoreNotice status={status} />}

        <BannerCarousel banners={catalog?.banners ?? []} />

        <section aria-label="الأقسام">
          <SectionHead title="الأقسام" href="/categories/" />
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-3 sm:grid-cols-8">
            {loading &&
              Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="skeleton size-[60px] rounded-[18px]" />
                  <div className="skeleton h-3 w-12 rounded" />
                </div>
              ))}
            {catalog?.categories.map((c) => (
              <CatTile key={c.id} href={`/shop/?cat=${encodeURIComponent(c.slug)}`} label={c.name} icon={<CategoryIcon name={c.icon} className="size-[26px]" />} />
            ))}
            {catalog && (
              <>
                <CatTile href="/shop/?offers=1" label="العروض" icon={<Percent className="size-[26px]" strokeWidth={1.8} />} />
                <CatTile href="/services/" label="الصيانة" icon={<Wrench className="size-[26px]" strokeWidth={1.8} />} />
              </>
            )}
          </div>
        </section>

        <section aria-label="وصل حديثاً">
          <SectionHead title="وصل حديثاً" href="/shop/" />
          {brands.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3.5">
              <Link href="/shop/" className="flex h-[38px] shrink-0 items-center rounded-full bg-ink px-4 text-[13px] font-semibold text-bg">
                الكل
              </Link>
              {brands.map((b) => (
                <Link
                  key={b}
                  href={`/shop/?brand=${encodeURIComponent(b)}`}
                  className="flex h-[38px] shrink-0 items-center rounded-full border border-line bg-card px-4 text-[13px] font-medium text-ink"
                >
                  {b}
                </Link>
              ))}
            </div>
          )}
          <div className="px-4">
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : newest.length ? (
              <ProductGrid products={newest} />
            ) : catalog ? (
              <EmptyStore whatsapp={settings.whatsapp} />
            ) : null}
          </div>
        </section>

        {offers.length > 0 && (
          <section aria-label="عروض وتخفيضات">
            <SectionHead title="عروض وتخفيضات" href="/shop/?offers=1" />
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {offers.map((p) => (
                <Link
                  key={p.id}
                  href={productHref(p)}
                  className="flex w-[150px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-line bg-card text-ink"
                >
                  <span className="relative">
                    <ProductThumb product={p} size="sm" className="aspect-square w-full" />
                    <DiscountBadge product={p} className="absolute top-2 left-2" />
                  </span>
                  <span className="flex flex-col gap-1 p-2.5">
                    <span dir="auto" className="line-clamp-2 min-h-[35px] text-right text-[13px] leading-snug font-semibold">
                      {p.name}
                    </span>
                    <Price product={p} size="sm" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-label="خدمات الصيانة" className="px-4">
          <div className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-tint text-primary-ink">
                <Wrench className="size-[26px]" strokeWidth={1.8} />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold">خدمات الصيانة</h2>
                <p className="text-[13px] leading-relaxed text-muted">{settings.services_text}</p>
              </div>
            </div>
            <Link href="/services/" className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-green text-[15px] font-semibold text-white">
              <ChatIcon className="size-5" />
              اسأل عن صيانة جهازك
            </Link>
          </div>
        </section>

        <div className="px-4">
          <ContactCard s={settings} />
        </div>

        <Footer s={settings} />
      </main>

      <BottomNav />
    </div>
  );
}

function CatTile({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 text-ink">
      <span className="flex size-[60px] items-center justify-center rounded-[18px] border border-line bg-card text-primary-ink">{icon}</span>
      <span className="text-center text-xs leading-snug font-medium">{label}</span>
    </Link>
  );
}

function EmptyStore({ whatsapp }: { whatsapp: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-line bg-card px-6 py-8 text-center">
      <p className="text-[15px] font-semibold">نجهّز المنتجات هنا قريباً</p>
      <p className="text-sm text-muted">وفي الوقت ده، اسألنا عن أي جهاز أو قطعة عبر واتساب.</p>
      <a href={waLink(whatsapp, "السلام عليكم نانو بايت، أريد أسأل عن:")} target="_blank" rel="noopener" className="flex h-11 items-center gap-2 rounded-xl bg-green px-5 text-sm font-semibold text-white">
        <ChatIcon className="size-5" />
        راسلنا على واتساب
      </a>
    </div>
  );
}

