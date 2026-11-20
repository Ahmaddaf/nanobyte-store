"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { afterChange, quickUpdate, type AdminProduct } from "@/lib/admin";
import { ProductThumb } from "@/components/ProductBits";
import { MoneyInput, Toggle } from "./ui";

/** One product with the everyday edits: price, shown/hidden, in stock. */
export function QuickRow({ product, onChanged, onError }: { product: AdminProduct; onChanged: (p: AdminProduct) => void; onError: (m: string) => void }) {
  const [price, setPrice] = useState<number | null>(product.price);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const p = product;
  const dirty = price !== p.price;

  async function patch(change: Partial<AdminProduct>) {
    setSaving(true);
    try {
      await quickUpdate(p.id, change);
      onChanged({ ...p, ...change });
      afterChange();
      return true;
    } catch (e) {
      onError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-line py-3 first:border-t-0">
      <div className="flex items-center gap-2.5">
        <ProductThumb product={p} size="sm" className="size-12 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span dir="auto" className="truncate text-right text-sm font-semibold">
            {p.name}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <bdi>{p.sku}</bdi>
            <span>· الكمية {p.quantity}</span>
            {p.quantity <= 0 && <span className="rounded-md bg-red-bg px-1.5 text-[11px] font-semibold text-red-ink">نفد</span>}
            {!p.is_visible && <span className="rounded-md bg-field px-1.5 text-[11px] font-semibold text-muted">مخفي</span>}
            {p.price_on_request && <span className="rounded-md bg-tint px-1.5 text-[11px] font-semibold text-on-tint">اسأل عن السعر</span>}
          </span>
        </div>
        <Link href={`/admin/product/?id=${p.id}`} aria-label={`تعديل ${p.name}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink">
          <Pencil className="size-[18px]" />
        </Link>
      </div>
      {!p.price_on_request && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <MoneyInput value={price} onChange={setPrice} placeholder="السعر" aria-label={`سعر ${p.name}`} />
          </div>
          <button
            type="button"
            disabled={!dirty || saving || price == null}
            onClick={async () => {
              if (await patch({ price })) {
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              }
            }}
            className={`flex h-12 min-w-[64px] items-center justify-center rounded-xl px-3 text-sm font-semibold disabled:opacity-40 ${saved ? "bg-green text-white" : "bg-ink text-bg"}`}
          >
            {saved ? <Check className="size-5" /> : "حفظ"}
          </button>
        </div>
      )}
      <div className="flex gap-5 text-[13px]">
        <span className="flex items-center gap-2">
          <Toggle label="ظاهر في المتجر" on={p.is_visible} disabled={saving} onChange={(v) => patch({ is_visible: v })} />
          ظاهر
        </span>
        <span className="flex items-center gap-2">
          <Toggle label="متوفر في المخزون" on={p.quantity > 0} disabled={saving} onChange={(v) => patch({ quantity: v ? Math.max(1, p.quantity) : 0 })} />
          متوفر
        </span>
        <span className="flex items-center gap-2">
          <Toggle label="ضمن العروض" on={p.is_offer} disabled={saving} onChange={(v) => patch({ is_offer: v })} />
          عرض
        </span>
      </div>
    </div>
  );
}
