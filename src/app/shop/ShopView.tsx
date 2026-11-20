"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownUp, SearchX, SlidersHorizontal } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import {
  activeFilterCount,
  applyFilters,
  filtersToQuery,
  haystack,
  parseFilters,
  SORT_LABEL,
  sortProducts,
  type Filters,
  type SortKey,
} from "@/lib/search";
import { BottomNav, CartButton, TopBar } from "@/components/Chrome";
import { SearchBar, StoreNotice } from "@/components/HomeParts";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductCard";
import { FilterSheet } from "@/components/FilterSheet";

export default function ShopView() {
  const sp = useSearchParams();
  const router = useRouter();
  const { catalog, status } = useCatalog();
  const [sheet, setSheet] = useState(false);

  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);
  const products = useMemo(() => catalog?.products ?? [], [catalog]);
  const categories = useMemo(() => catalog?.categories ?? [], [catalog]);
  const hay = useMemo(() => new Map(products.map((p) => [p.id, haystack(p, categories)])), [products, categories]);

  const results = useMemo(
    () => sortProducts(applyFilters(products, filters, categories, hay), filters.sort),
    [products, filters, categories, hay],
  );

  const go = (f: Filters) => router.replace(`/shop/${filtersToQuery(f)}`, { scroll: false });

  const cat = categories.find((c) => c.slug === filters.cat);
  const title = filters.offers ? "العروض والتخفيضات" : cat ? cat.name : filters.q ? "نتائج البحث" : "كل المنتجات";
  const nActive = activeFilterCount(filters);

  return (
    <div className="pb-nav md:pb-10">
      <TopBar title={title} actions={<CartButton bordered={false} />} />

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 bg-card px-4 pt-3 pb-3">
          <SearchBar key={filters.q} initial={filters.q} onSubmit={(q) => go({ ...filters, q })} />
          {categories.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              <Chip on={!filters.cat && !filters.offers} onClick={() => go({ ...filters, cat: "", offers: false })}>
                الكل
              </Chip>
              <Chip on={filters.offers} onClick={() => go({ ...filters, offers: !filters.offers })}>
                العروض
              </Chip>
              {categories.map((c) => (
                <Chip key={c.id} on={filters.cat === c.slug} onClick={() => go({ ...filters, cat: filters.cat === c.slug ? "" : c.slug })}>
                  {c.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div className="sticky top-[60px] z-20 flex items-center justify-between gap-2 border-y border-line bg-bg/95 px-4 py-2 backdrop-blur">
          <span className="text-[13px] text-muted">{catalog ? `${results.length} منتج` : "…"}</span>
          <div className="flex items-center gap-2">
            <label className="relative flex h-10 items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-[13px] font-medium text-ink">
              <ArrowDownUp className="size-4 text-muted" />
              <span className="sr-only">ترتيب حسب</span>
              <select
                value={filters.sort}
                onChange={(e) => go({ ...filters, sort: e.target.value as SortKey })}
                className="appearance-none bg-transparent pe-1 outline-none"
              >
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setSheet(true)}
              className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold ${nActive ? "bg-primary text-white" : "border border-line bg-card text-ink"}`}
            >
              <SlidersHorizontal className="size-4" />
              فلاتر{nActive ? ` (${nActive})` : ""}
            </button>
          </div>
        </div>

        <main className="px-4 pt-4">
          {!catalog && (status === "unconfigured" || status === "error") && <StoreNotice status={status} />}
          {!catalog && status === "loading" && <ProductGridSkeleton count={6} />}
          {catalog && results.length > 0 && <ProductGrid products={results} />}
          {catalog && results.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <SearchX className="size-12 text-art" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold">ما لقينا منتجات بالشروط دي</p>
              <p className="max-w-xs text-sm text-muted">جرّب كلمة بحث أبسط أو امسح بعض الفلاتر. وممكن تسألنا عن أي جهاز عبر واتساب.</p>
              <div className="flex gap-2">
                <Link href="/shop/" className="flex h-11 items-center rounded-xl border border-line bg-card px-4 text-sm font-semibold text-ink">
                  مسح البحث والفلاتر
                </Link>
                <Link href="/contact/" className="flex h-11 items-center rounded-xl bg-green px-4 text-sm font-semibold text-white">
                  اسألنا
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {sheet && (
      <FilterSheet
        open={sheet}
        onClose={() => setSheet(false)}
        products={products}
        categories={categories}
        hay={hay}
        filters={filters}
        onApply={go}
      />
      )}
      <BottomNav />
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`h-[38px] shrink-0 rounded-full px-4 text-[13px] ${on ? "bg-ink font-semibold text-bg" : "border border-line bg-card font-medium text-ink"}`}
    >
      {children}
    </button>
  );
}
