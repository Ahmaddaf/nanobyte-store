"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/lib/types";
import { ConditionBadge, DiscountBadge, Price, ProductThumb, SpecText } from "./ProductBits";

export function productHref(p: Product) {
  return `/p/?id=${encodeURIComponent(p.sku)}`;
}

export function ProductCard({ product: p }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const out = p.quantity <= 0;
  return (
    <article className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-card">
      <Link href={productHref(p)} className="flex flex-col text-ink">
        <span className="relative">
          <ProductThumb product={p} className={`aspect-[4/3] w-full ${out ? "opacity-60" : ""}`} />
          <ConditionBadge condition={p.condition} className="absolute top-2.5 right-2.5" />
          <DiscountBadge product={p} className="absolute top-2.5 left-2.5" />
          {out && (
            <span className="absolute inset-x-2.5 bottom-2.5 rounded-lg bg-ink/80 py-1 text-center text-xs font-semibold text-bg">
              نفد من المخزون
            </span>
          )}
        </span>
        <span className="flex flex-col gap-1 px-3 pt-2.5">
          <span dir="auto" className="line-clamp-2 min-h-[38px] text-right text-sm leading-[1.35] font-semibold">
            {p.name}
          </span>
          <SpecText product={p} className="line-clamp-2 text-xs leading-snug text-muted" />
        </span>
      </Link>
      <div className="mt-auto flex items-end justify-between gap-1.5 px-3 pt-2 pb-3">
        <Price product={p} />
        {!out && (
          <button
            type="button"
            onClick={() => {
              addToCart(p);
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
            aria-label={`أضف ${p.name} للسلة`}
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-colors ${added ? "bg-green" : "bg-primary active:bg-primary-dark"}`}
          >
            {added ? <Check className="size-5" strokeWidth={2.4} /> : <Plus className="size-5" strokeWidth={2.2} />}
          </button>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-card">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-col gap-2 p-3">
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-3/5 rounded" />
        <div className="skeleton mt-2 h-5 w-2/5 rounded" />
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
