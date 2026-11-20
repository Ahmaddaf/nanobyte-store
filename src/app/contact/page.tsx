import type { Metadata } from "next";
import ContactView from "./ContactView";

export const metadata: Metadata = { title: "تواصل معنا" };

export default function Page() {
  return <ContactView />;
}
