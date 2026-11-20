import type { Metadata } from "next";
import CategoriesView from "./CategoriesView";

export const metadata: Metadata = { title: "الأقسام" };

export default function Page() {
  return <CategoriesView />;
}
