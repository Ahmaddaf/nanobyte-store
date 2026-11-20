"use client";

import { Truck } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { BottomNav, TopBar } from "@/components/Chrome";
import { ContactCard } from "@/components/HomeParts";
import { Footer } from "@/components/Footer";

export default function ContactView() {
  const { settings } = useCatalog();
  return (
    <div className="pb-nav md:pb-10">
      <TopBar title="تواصل معنا" />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <ContactCard s={settings} />
        <div className="flex items-start gap-3 rounded-[20px] border border-line bg-card p-4">
          <Truck className="mt-0.5 size-6 shrink-0 text-primary-ink" />
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold">التوصيل</h2>
            <p className="text-sm leading-relaxed text-muted">{settings.delivery_note}. رسوم ومدة التوصيل نتفق عليها في واتساب حسب المكان.</p>
          </div>
        </div>
        {settings.map_url && (
          <a
            href={settings.map_url}
            target="_blank"
            rel="noopener"
            className="flex h-12 items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-white"
          >
            افتح موقع المحل في الخريطة
          </a>
        )}
        <Footer s={settings} />
      </main>
      <BottomNav />
    </div>
  );
}
