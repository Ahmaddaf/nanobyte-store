"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { listProducts, type AdminProduct } from "@/lib/admin";
import { matches, normalize } from "@/lib/search";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuickRow } from "@/components/admin/QuickRow";
import { Card, Notice, Spinner } from "@/components/admin/ui";

const TABS = [
  { key: "all", label: "الكل" },
  { key: "visible", label: "ظاهر" },
  { key: "hidden", label: "مخفي" },
  { key: "out", label: "نفد" },
  { key: "offers", label: "عروض" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function ProductsAdmin() {
  return (
    <AdminShell
      title="المنتجات"
      back="/admin/"
      actions={
        <Link href="/admin/product/" className="flex h-10 items-center gap-1 rounded-xl bg-primary px-3 text-sm font-semibold text-white">
          <Plus className="size-5" />
          إضافة
        </Link>
      }
    >
      <List />
    </AdminShell>
  );
}

function List() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = (TABS.find((t) => t.key === sp.get("f"))?.key ?? "all") as Tab;
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminProduct[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listProducts().then(setItems).catch((e: Error) => setErr(e.message));
  }, []);

  const shown = useMemo(() => {
    if (!items) return [];
    return items.filter((p) => {
      if (tab === "visible" && !p.is_visible) return false;
      if (tab === "hidden" && p.is_visible) return false;
      if (tab === "out" && p.quantity > 0) return false;
      if (tab === "offers" && !(p.is_offer || (p.old_price && p.price && p.old_price > p.price))) return false;
      if (q && !matches(normalize([p.name, p.sku, p.brand, p.cpu, p.cpu_family].filter(Boolean).join(" ")), q)) return false;
      return true;
    });
  }, [items, tab, q]);

  return (
    <>
      <label className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-card px-3.5 text-faint">
        <Search className="size-5 shrink-0" />
        <span className="sr-only">بحث في المنتجات</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو رقم المنتج…" className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none" />
      </label>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => router.replace(`/admin/products/${t.key === "all" ? "" : `?f=${t.key}`}`, { scroll: false })}
            className={`h-10 shrink-0 rounded-full px-4 text-[13px] ${tab === t.key ? "bg-ink font-semibold text-bg" : "border border-line bg-card font-medium text-ink"}`}
          >
            {t.label}
            {items && <span className="ms-1 opacity-70">({countFor(items, t.key)})</span>}
          </button>
        ))}
      </div>
      {err && <Notice kind="error">{err}</Notice>}
      <Card>
        {!items && !err && <Spinner />}
        {items && shown.length === 0 && <p className="py-8 text-center text-sm text-muted">ما في منتجات هنا.</p>}
        {shown.map((p) => (
          <QuickRow key={p.id} product={p} onChanged={(np) => setItems((l) => l?.map((x) => (x.id === np.id ? np : x)) ?? null)} onError={setErr} />
        ))}
      </Card>
    </>
  );
}

function countFor(items: AdminProduct[], tab: Tab) {
  return items.filter((p) =>
    tab === "all" ? true : tab === "visible" ? p.is_visible : tab === "hidden" ? !p.is_visible : tab === "out" ? p.quantity <= 0 : p.is_offer || (p.old_price && p.price && p.old_price > p.price),
  ).length;
}
