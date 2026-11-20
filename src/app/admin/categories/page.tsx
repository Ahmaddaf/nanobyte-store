"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { afterChange, deleteCategory, listCategories, saveCategory, type AdminCategory } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, Notice, Spinner, TextInput, Toggle } from "@/components/admin/ui";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/icons";

/** Latin slug for the category link, e.g. "Gaming Laptops" -> "gaming-laptops". */
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesAdmin() {
  return (
    <AdminShell title="الأقسام" back="/admin/more/" adminOnly>
      <Categories />
    </AdminShell>
  );
}

function Categories() {
  const [items, setItems] = useState<AdminCategory[] | null>(null);
  const [edit, setEdit] = useState<Partial<AdminCategory> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => listCategories().then(setItems).catch((e: Error) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await load();
      afterChange();
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function move(i: number, dir: -1 | 1) {
    if (!items) return;
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[i];
    const b = items[j];
    await run(async () => {
      await saveCategory({ ...a, sort: b.sort === a.sort ? b.sort + dir : b.sort });
      await saveCategory({ ...b, sort: a.sort });
    });
  }

  if (!items) return err ? <Notice kind="error">{err}</Notice> : <Spinner />;

  return (
    <>
      {err && <Notice kind="error">{err}</Notice>}
      <Card>
        {items.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2.5 border-t border-line py-2.5 first:border-t-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tint text-primary-ink">
              <CategoryIcon name={c.icon} className="size-[22px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{c.name}</span>
              <span className="ltr truncate text-xs text-muted">{c.slug}</span>
            </span>
            <Toggle label={`إظهار ${c.name}`} on={c.is_visible} disabled={busy} onChange={(v) => run(() => saveCategory({ ...c, is_visible: v }))} />
            <div className="flex flex-col">
              <button type="button" aria-label="لأعلى" disabled={busy || i === 0} onClick={() => move(i, -1)} className="flex size-7 items-center justify-center disabled:opacity-30">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" aria-label="لأسفل" disabled={busy || i === items.length - 1} onClick={() => move(i, 1)} className="flex size-7 items-center justify-center disabled:opacity-30">
                <ArrowDown className="size-4" />
              </button>
            </div>
            <button type="button" aria-label={`تعديل ${c.name}`} onClick={() => setEdit(c)} className="flex size-10 items-center justify-center rounded-xl border border-line">
              <Pencil className="size-4" />
            </button>
          </div>
        ))}
      </Card>

      {!edit && (
        <Button variant="outline" onClick={() => setEdit({ name: "", slug: "", icon: "box", is_visible: true, sort: (items.at(-1)?.sort ?? 0) + 1 })}>
          <Plus className="size-5" /> إضافة قسم
        </Button>
      )}

      {edit && (
        <Card title={edit.id ? "تعديل القسم" : "قسم جديد"}>
          <Field label="اسم القسم">
            <TextInput value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="مثال: لابتوبات جيمنج" />
          </Field>
          <Field label="الاسم في الرابط (إنجليزي)" hint="حروف إنجليزية صغيرة وأرقام فقط، مثال: gaming-laptops">
            <TextInput ltr value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} placeholder="gaming-laptops" />
          </Field>
          <Field label="الأيقونة">
            <div className="grid grid-cols-7 gap-1.5">
              {Object.keys(CATEGORY_ICONS).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={k}
                  aria-pressed={edit.icon === k}
                  onClick={() => setEdit({ ...edit, icon: k })}
                  className={`flex aspect-square items-center justify-center rounded-xl ${edit.icon === k ? "bg-primary text-white" : "border border-line bg-card text-ink"}`}
                >
                  <CategoryIcon name={k} className="size-5" />
                </button>
              ))}
            </div>
          </Field>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              loading={busy}
              onClick={async () => {
                if (!edit.name?.trim()) return setErr("اكتب اسم القسم.");
                if (!edit.slug) return setErr("اكتب الاسم الإنجليزي للرابط.");
                if (await run(() => saveCategory(edit as AdminCategory))) setEdit(null);
              }}
            >
              حفظ
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setEdit(null)}>
              إلغاء
            </Button>
          </div>
          {edit.id && (
            <button
              type="button"
              className="flex min-h-11 items-center gap-2 text-sm font-semibold text-red-ink"
              onClick={async () => {
                if (await run(() => deleteCategory(edit.id!))) setEdit(null);
              }}
            >
              <Trash2 className="size-5" /> حذف القسم (المنتجات اللي فيه تبقى بدون قسم)
            </button>
          )}
        </Card>
      )}
    </>
  );
}
