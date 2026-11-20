"use client";

import Link from "next/link";
import { ChevronRight, Percent, Wrench } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { BottomNav, CartButton, TopBar } from "@/components/Chrome";
import { CategoryIcon } from "@/components/icons";
import { StoreNotice } from "@/components/HomeParts";

export default function CategoriesView() {
  const { catalog, status } = useCatalog();
  const counts = new Map<string, number>();
  for (const p of catalog?.products ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);

  return (
    <div className="pb-nav md:pb-10">
      <TopBar title="الأقسام" actions={<CartButton bordered={false} />} />
      <main className="mx-auto flex max-w-3xl flex-col gap-2.5 p-4">
        {!catalog && (status === "unconfigured" || status === "error") && <StoreNotice status={status} />}
        {!catalog &&
          status === "loading" &&
          Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-[72px] rounded-2xl" />)}
        {catalog?.categories.map((c) => (
          <Row
            key={c.id}
            href={`/shop/?cat=${encodeURIComponent(c.slug)}`}
            icon={<CategoryIcon name={c.icon} className="size-6" />}
            title={c.name}
            sub={`${counts.get(c.id) ?? 0} منتج`}
          />
        ))}
        {catalog && (
          <>
            <Row href="/shop/?offers=1" icon={<Percent className="size-6" strokeWidth={1.8} />} title="العروض والتخفيضات" />
            <Row href="/services/" icon={<Wrench className="size-6" strokeWidth={1.8} />} title="خدمات الصيانة" />
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Row({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <Link href={href} className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-line bg-card px-3.5 text-ink">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-tint text-primary-ink">{icon}</span>
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-semibold">{title}</span>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </span>
      <ChevronRight className="size-5 rotate-180 text-faint" />
    </Link>
  );
}
