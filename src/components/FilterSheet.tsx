"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { genLabel } from "@/lib/format";
import { applyFilters, facetValues, storageKey, type Filters } from "@/lib/search";
import type { Category, Product } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  hay: Map<string, string>;
  filters: Filters;
  onApply: (f: Filters) => void;
}

const numSort = (a: string, b: string) => (parseFloat(a) || 0) - (parseFloat(b) || 0);

export function FilterSheet({ open, onClose, products, categories, hay, filters, onApply }: Props) {
  // the sheet is mounted fresh each time it opens, so the draft starts from the current filters
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const facets = useMemo(() => {
    const base = (skip: keyof Filters) => applyFilters(products, draft, categories, hay, skip);
    return {
      brand: facetValues(base("brand"), (p) => p.brand).sort(),
      cpu: facetValues(base("cpu"), (p) => p.cpu_family).sort(),
      gen: facetValues(base("gen"), (p) => p.cpu_gen).sort(numSort),
      ram: facetValues(base("ram"), (p) => (p.ram_gb ? String(p.ram_gb) : null)).sort(numSort),
      sto: facetValues(base("sto"), (p) => storageKey(p) || null).sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
    };
  }, [products, draft, categories, hay]);

  const resultCount = useMemo(() => applyFilters(products, draft, categories, hay).length, [products, draft, categories, hay]);

  if (!open) return null;

  const toggle = (key: "brand" | "cond" | "cpu" | "gen" | "ram" | "sto", v: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));

  const group = (title: string, key: "brand" | "cond" | "cpu" | "gen" | "ram" | "sto", values: string[], label: (v: string) => string = (v) => v) => {
    const shown = [...new Set([...values, ...draft[key]])];
    if (!shown.length) return null;
    return (
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-[15px] font-bold">{title}</legend>
        <div className="flex flex-wrap gap-2">
          {shown.map((v) => {
            const on = draft[key].includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(key, v)}
                className={`h-10 rounded-full border px-4 text-[13px] ${on ? "border-ink bg-ink font-semibold text-bg" : "border-line bg-card font-medium text-ink"}`}
              >
                <span dir="auto">{label(v)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="الفلاتر">
      <button type="button" aria-label="إغلاق" onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div className="relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[26px] bg-bg md:rounded-[26px]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-bold">الفلاتر</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="flex size-11 items-center justify-center rounded-xl text-ink">
            <X className="size-6" />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-4 py-5">
          {group("الشركة", "brand", facets.brand)}
          {group("المعالج", "cpu", facets.cpu)}
          {group("جيل المعالج", "gen", facets.gen, genLabel)}
          {group("الرام", "ram", facets.ram, (v) => `${v}GB`)}
          {group("التخزين", "sto", facets.sto)}

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[15px] font-bold">السعر (ج.س)</legend>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1.5 text-xs text-muted">
                من
                <input
                  inputMode="numeric"
                  value={draft.min ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null }))}
                  placeholder="0"
                  className="h-12 rounded-xl border border-line bg-card px-3 text-[15px] text-ink outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-muted">
                إلى
                <input
                  inputMode="numeric"
                  value={draft.max ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null }))}
                  placeholder="بدون حد"
                  className="h-12 rounded-xl border border-line bg-card px-3 text-[15px] text-ink outline-none focus:border-primary"
                />
              </label>
            </div>
          </fieldset>

          <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4">
            <span className="text-[15px] font-semibold">المتوفر فقط</span>
            <input
              type="checkbox"
              checked={draft.stock}
              onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.checked }))}
              className="size-5 accent-[var(--primary)]"
            />
          </label>
        </div>

        <div className="safe-bottom flex gap-2.5 border-t border-line px-4 pt-3">
          <button
            type="button"
            onClick={() => setDraft({ ...draft, brand: [], cond: [], cpu: [], gen: [], ram: [], sto: [], min: null, max: null, stock: false })}
            className="h-[52px] flex-1 rounded-2xl border border-line bg-card text-[15px] font-semibold text-ink"
          >
            مسح الكل
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="h-[52px] flex-[1.6] rounded-2xl bg-primary text-[15px] font-bold text-white"
          >
            عرض {resultCount} منتج
          </button>
        </div>
      </div>
    </div>
  );
}
