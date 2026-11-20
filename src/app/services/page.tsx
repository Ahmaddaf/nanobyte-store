import type { Metadata } from "next";
import ServicesView from "./ServicesView";

export const metadata: Metadata = { title: "خدمات الصيانة" };

export default function Page() {
  return <ServicesView />;
}
