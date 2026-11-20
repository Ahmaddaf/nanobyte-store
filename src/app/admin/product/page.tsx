import { Suspense } from "react";
import ProductEditorPage from "./ProductEditor";

export default function Page() {
  return (
    <Suspense>
      <ProductEditorPage />
    </Suspense>
  );
}
