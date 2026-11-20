import type { Metadata } from "next";
import { Suspense } from "react";
import ProductView from "./ProductView";

export const metadata: Metadata = { title: "تفاصيل المنتج" };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-[350px] w-full" />}>
      <ProductView />
    </Suspense>
  );
}
