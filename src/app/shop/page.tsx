import type { Metadata } from "next";
import { Suspense } from "react";
import ShopView from "./ShopView";
import { ProductGridSkeleton } from "@/components/ProductCard";

export const metadata: Metadata = { title: "المنتجات" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl p-4 pt-[140px]">
          <ProductGridSkeleton count={6} />
        </div>
      }
    >
      <ShopView />
    </Suspense>
  );
}
