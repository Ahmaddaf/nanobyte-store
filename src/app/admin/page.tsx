"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ClipboardList, EyeOff, LayoutGrid, Package, PackageX, Percent, Plus, Store, Users } from "lucide-react";
import { listProducts, pendingOrdersCount, type AdminProduct } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuickRow } from "@/components/admin/QuickRow";
import { Card, Notice, Spinner } from "@/components/admin/ui";

export default function AdminHome() {
  return <AdminShell title="لوحة التحكم" dark>{({ isAdmin, name }) => <Home isAdmin={isAdmin} name={name} />}</AdminShell>;
}

function Home({ isAdmin, name }: { isAdmin: boolean; name: string | null }) {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [orders, setOrders] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listProducts().then(setProducts).catch((e: Error) => setErr(e.message));
    pendingOrdersCount().then(setOrders).catch(() => setOrders(null));
  }, []);

  const total = products?.length ?? 0;
  const out = products?.filter((p) => p.quantity <= 0).length ?? 0;
  const hidden = products?.filter((p) => !p.is_visible).length ?? 0;

  const actions = [
    { href: "/admin/product/", label: "إضافة منتج", sub: "صور + مواصفات + سعر", Icon: Plus, primary: true },
    { href: "/admin/products/", label: "تعديل الأسعار", sub: "تعديل سريع للمنتجات", Icon: Package },
    isAdmin
      ? { href: "/admin/prices/", label: "تغيير كل الأسعار", sub: "بنسبة مئوية", Icon: Percent }
      : { href: "/admin/products/?f=out", label: "النافد", sub: "منتجات نفدت", Icon: PackageX },
    isAdmin
      ? { href: "/admin/categories/", label: "الأقسام", sub: "إضافة وترتيب", Icon: LayoutGrid }
      : { href: "/admin/products/?f=hidden", label: "المخفية", sub: "منتجات مخفية", Icon: EyeOff },
  ];

  return (
    <>
      <div className="-mx-4 -mt-4 flex items-center justify-between bg-[#16132e] px-4 pb-4 text-white">
        <span className="flex items-center gap-2 text-[13px]">
          <span className="size-2.5 rounded-full bg-[#3ddc84]" />
          أهلاً {name ?? ""} — المتجر يعمل
        </span>
        <Link href="/" className="flex min-h-9 items-center gap-0.5 text-[13px] font-semibold text-[#cdbbff]">
          <Store className="size-4" />
          فتح المتجر
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {actions.map(({ href, label, sub, Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className={`flex min-h-[104px] flex-col gap-2.5 rounded-[18px] p-3.5 ${primary ? "bg-primary text-white" : "border border-line bg-card text-ink"}`}
          >
            <span className={`flex size-10 items-center justify-center rounded-xl ${primary ? "bg-white/20" : "bg-tint text-primary-ink"}`}>
              <Icon className="size-[21px]" strokeWidth={primary ? 2.2 : 1.8} />
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] font-bold">{label}</span>
              <span className={`text-xs ${primary ? "text-white/80" : "text-muted"}`}>{sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="طلبات جديدة" value={orders} Icon={ClipboardList} tone="bg-amber-bg text-amber-ink" />
        <Stat label="منتجات نفدت" value={products ? out : null} Icon={PackageX} tone="bg-red-bg text-red-ink" href="/admin/products/?f=out" />
        <Stat label="منتجات مخفية" value={products ? hidden : null} Icon={EyeOff} tone="bg-field text-muted" href="/admin/products/?f=hidden" />
        <Stat label="كل المنتجات" value={products ? total : null} Icon={Package} tone="bg-tint text-on-tint" href="/admin/products/" />
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      <Card
        title="آخر المنتجات"
        action={
          <Link href="/admin/products/" className="flex min-h-9 items-center text-[13px] font-medium text-primary-ink">
            كل المنتجات
            <ChevronLeft className="size-4" />
          </Link>
        }
      >
        {!products && !err && <Spinner />}
        {products && products.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted">
            لسه ما في منتجات.
            <Link href="/admin/product/" className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 font-semibold text-white">
              <Plus className="size-5" />
              أضف أول منتج
            </Link>
          </div>
        )}
        {products?.slice(0, 5).map((p) => (
          <QuickRow
            key={p.id}
            product={p}
            onChanged={(np) => setProducts((list) => list?.map((x) => (x.id === np.id ? np : x)) ?? null)}
            onError={setErr}
          />
        ))}
      </Card>

      {isAdmin && (
        <Link href="/admin/staff/" className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-card px-4 text-ink">
          <Users className="size-5 text-primary-ink" />
          <span className="flex-1 text-sm font-medium">الموظفين والصلاحيات</span>
          <ChevronLeft className="size-4 text-faint" />
        </Link>
      )}
    </>
  );
}

function Stat({ label, value, Icon, tone, href }: { label: string; value: number | null; Icon: typeof Package; tone: string; href?: string }) {
  const inner = (
    <>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col">
        <span className="text-[22px] leading-tight font-bold">{value ?? "—"}</span>
        <span className="text-xs text-muted">{label}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 text-ink";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
