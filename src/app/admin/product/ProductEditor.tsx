"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ExternalLink, Eye, Minus, Plus, Star, Trash2, X } from "lucide-react";
import {
  afterChange,
  deleteImage,
  deleteProduct,
  getProduct,
  guessCpu,
  listCategories,
  saveProduct,
  setImageSort,
  uploadImages,
  type AdminCategory,
  type AdminProduct,
  type ProductDraft,
} from "@/lib/admin";
import { validateImage } from "@/lib/image";
import { imageUrl } from "@/lib/supabase";
import { KIND_FIELDS, KIND_LABEL } from "@/lib/specs";
import { discountPercent } from "@/lib/format";
import type { Condition, Kind, Product } from "@/lib/types";
import { AdminShell, useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, Field, MoneyInput, Notice, Segmented, Select, Spinner, TextArea, TextInput, Toggle } from "@/components/admin/ui";
import { ProductCard } from "@/components/ProductCard";
import { SpecText } from "@/components/ProductBits";
import { specRows } from "@/lib/specs";

const MAX_IMAGES = 8;
const BRANDS = ["HP", "Dell", "Lenovo", "Apple", "Asus", "Acer", "Toshiba", "Microsoft", "Samsung", "MSI", "Huawei"];
const GENS = ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"];
const RAMS = [2, 4, 8, 12, 16, 24, 32, 64];
const STORAGES = [128, 240, 256, 320, 500, 512, 1000, 2000];
const SCREENS = ["11.6 بوصة", "12.5 بوصة", "13.3 بوصة", "14 بوصة", "14 بوصة FHD", "15.6 بوصة", "15.6 بوصة FHD", "17.3 بوصة"];
const BATTERY = ["ممتازة", "جيدة جداً", "جيدة", "متوسطة", "تحتاج تغيير"];
const GPUS = ["Intel UHD", "Intel UHD 620", "Intel Iris Xe", "AMD Radeon", "NVIDIA GeForce MX", "NVIDIA GTX 1650", "NVIDIA RTX 3050"];

/** category slug that fits each kind (used to pre-select the section) */
const KIND_CAT: Record<Kind, string> = {
  laptop: "used-laptops",
  accessory: "accessories",
  part: "parts",
  charger: "chargers",
  storage: "storage",
};

type Pic = { key: string; existing?: AdminProduct["images"][number]; file?: File; url: string };

function emptyDraft(): ProductDraft {
  return {
    id: crypto.randomUUID(),
    kind: "laptop",
    category_id: null,
    brand: null,
    name: "",
    cpu: null,
    cpu_family: null,
    cpu_gen: null,
    ram_gb: null,
    storage_type: "SSD",
    storage_gb: null,
    gpu: null,
    screen: null,
    battery: null,
    condition: "used",
    warranty: null,
    attrs: {},
    price: null,
    old_price: null,
    price_on_request: false,
    quantity: 1,
    is_visible: true,
    is_offer: false,
    description: null,
  };
}

export default function ProductEditorPage() {
  const sp = useSearchParams();
  const id = sp.get("id");
  return (
    <AdminShell title={id ? "تعديل منتج" : "إضافة منتج"} back="/admin/products/">
      <Editor key={id ?? "new"} id={id} />
    </AdminShell>
  );
}

function Editor({ id }: { id: string | null }) {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [draft, setDraft] = useState<ProductDraft | null>(id ? null : emptyDraft());
  const [saved, setSaved] = useState<AdminProduct | null>(null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [pics, setPics] = useState<Pic[]>([]);
  const [removed, setRemoved] = useState<Pic[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(() => {
    try {
      const f = sessionStorage.getItem("nb-flash");
      sessionStorage.removeItem("nb-flash");
      return f;
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !saved;

  useEffect(() => {
    listCategories()
      .then((cs) => {
        setCats(cs);
        // a new product starts in the section that fits its type
        if (!id)
          setDraft((d) => {
            if (!d || d.category_id) return d;
            const slug = d.kind === "laptop" ? (d.condition === "new" ? "new-laptops" : "used-laptops") : KIND_CAT[d.kind];
            return { ...d, category_id: cs.find((x) => x.slug === slug)?.id ?? null };
          });
      })
      .catch((e: Error) => setErr(e.message));
    if (!id) return;
    getProduct(id)
      .then((p) => {
        if (!p) return setErr("المنتج ده ما موجود.");
        setSaved(p);
        setDraft(toDraft(p));
        setPics(p.images.map((im) => ({ key: im.id, existing: im, url: imageUrl(im.thumb || im.path) ?? "" })));
      })
      .catch((e: Error) => setErr(e.message));
  }, [id]);

  // free the preview URLs of new photos when leaving the page
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const setAttr = (k: string, v: string) => setDraft((d) => (d ? { ...d, attrs: { ...d.attrs, [k]: v } } : d));

  const previewProduct: Product | null = useMemo(() => {
    if (!draft) return null;
    return {
      ...draft,
      sku: saved?.sku ?? "NB-جديد",
      created_at: saved?.created_at ?? new Date().toISOString(),
      price_updated_at: new Date().toISOString(),
      images: pics.map((p, i) => ({ path: p.existing?.path ?? p.url, thumb: p.existing?.thumb ?? p.url, sort: i })),
    } as Product;
  }, [draft, pics, saved]);

  if (!draft) return err ? <Notice kind="error">{err}</Notice> : <Spinner />;

  function changeKind(k: Kind) {
    setDraft((d) => {
      if (!d) return d;
      const slug = k === "laptop" ? (d.condition === "new" ? "new-laptops" : "used-laptops") : KIND_CAT[k];
      const cat = cats.find((c) => c.slug === slug);
      // accessories etc. are usually new; laptops keep what was chosen
      const condition: Condition | null = k === "laptop" ? d.condition : d.kind === "laptop" ? "new" : d.condition;
      return { ...d, kind: k, category_id: cat?.id ?? d.category_id, condition };
    });
  }

  function changeCondition(c: Condition) {
    setDraft((d) => {
      if (!d) return d;
      let category_id = d.category_id;
      // keep "new" laptops in the new section and used/refurbished in the used one
      if (d.kind === "laptop") {
        const current = cats.find((x) => x.id === d.category_id)?.slug;
        if (!current || current === "new-laptops" || current === "used-laptops") {
          category_id = cats.find((x) => x.slug === (c === "new" ? "new-laptops" : "used-laptops"))?.id ?? d.category_id;
        }
      }
      return { ...d, condition: c, category_id };
    });
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_IMAGES - pics.length;
    const files = Array.from(list).slice(0, Math.max(0, room));
    const bad = files.map(validateImage).find(Boolean);
    if (bad) setErr(bad);
    const good = files.filter((f) => !validateImage(f));
    const added = good.map((f) => ({ key: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) }));
    urls.current.push(...added.map((a) => a.url));
    setPics((p) => [...p, ...added]);
    if (list.length > room) setErr(`الحد الأقصى ${MAX_IMAGES} صور للمنتج.`);
  }

  function validate(d: ProductDraft): string | null {
    if (d.name.trim().length < 2) return "اكتب اسم المنتج أو الموديل.";
    if (!d.price_on_request && (d.price == null || d.price <= 0)) return "اكتب السعر، أو فعّل «اسأل عن السعر».";
    if (d.old_price != null && d.price != null && d.old_price > 0 && d.old_price <= d.price)
      return "السعر قبل التخفيض لازم يكون أكبر من السعر الحالي (أو خليه فاضي).";
    return null;
  }

  async function save() {
    if (!draft) return;
    setErr(null);
    setOk(null);
    const clean = cleanDraft(draft);
    const v = validate(clean);
    if (v) return setErr(v);
    setBusy("جاري حفظ البيانات…");
    try {
      const wasNew = isNew;
      const prod = await saveProduct(clean, wasNew);
      // photos: delete removed, upload new, then fix the order
      for (const r of removed) if (r.existing) await deleteImage(r.existing);
      const fresh = pics.filter((p) => p.file);
      let n = 0;
      for (const [i, p] of pics.entries()) {
        if (!p.file) continue;
        setBusy(`جاري رفع الصور ${++n} من ${fresh.length}…`);
        await uploadImages(prod.id, [p.file], i);
      }
      await setImageSort(pics.flatMap((p, i) => (p.existing ? [{ id: p.existing.id, sort: i }] : [])));
      const final = (await getProduct(prod.id)) ?? prod;
      setSaved(final);
      setDraft(toDraft(final));
      setPics(final.images.map((im) => ({ key: im.id, existing: im, url: imageUrl(im.thumb || im.path) ?? "" })));
      setRemoved([]);
      afterChange();
      if (wasNew) {
        // the page reloads for the new product; show the message there
        try {
          sessionStorage.setItem("nb-flash", `تم نشر المنتج برقم ${final.sku} ✓`);
        } catch {}
        router.replace(`/admin/product/?id=${final.id}`, { scroll: false });
      } else {
        setOk("تم حفظ التعديلات ✓");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!saved) return;
    setBusy("جاري الحذف…");
    try {
      await deleteProduct(saved);
      afterChange();
      router.replace("/admin/products/");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  }

  const d = draft;
  const disc = discountPercent(d);

  return (
    <>
      {ok && (
        <Notice kind="success">
          <span className="flex flex-wrap items-center justify-between gap-2">
            {ok}
            {saved && d.is_visible && (
              <Link href={`/p/?id=${saved.sku}`} className="flex items-center gap-1 font-bold underline-offset-2 hover:underline">
                عرض في المتجر <ExternalLink className="size-4" />
              </Link>
            )}
          </span>
        </Notice>
      )}
      {err && <Notice kind="error">{err}</Notice>}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-base font-bold">نوع المنتج</h2>
        <div role="group" aria-label="نوع المنتج" className="flex flex-wrap gap-2">
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={d.kind === k}
              onClick={() => changeKind(k)}
              className={`h-10 rounded-full px-4 text-[13px] ${d.kind === k ? "bg-ink font-semibold text-bg" : "border border-line bg-card font-medium text-ink"}`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold">الصور</h2>
          <span className="text-xs text-muted">
            {pics.length} من {MAX_IMAGES}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {pics.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] border-dashed border-primary-ink/50 bg-tint text-xs font-semibold text-on-tint"
            >
              <Camera className="size-6" />
              من المعرض
            </button>
          )}
          {pics.map((p, i) => (
            <div key={p.key} className={`relative aspect-square overflow-hidden rounded-[14px] bg-tile ${i === 0 ? "ring-2 ring-primary" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`صورة ${i + 1}`} className="size-full object-cover" />
              {i === 0 ? (
                <span className="absolute right-1 bottom-1 rounded-md bg-primary px-1.5 text-[11px] font-semibold text-white">رئيسية</span>
              ) : (
                <button
                  type="button"
                  aria-label="اجعلها الصورة الرئيسية"
                  onClick={() => setPics((l) => [p, ...l.filter((x) => x.key !== p.key)])}
                  className="absolute right-1 bottom-1 flex size-7 items-center justify-center rounded-lg bg-black/60 text-white"
                >
                  <Star className="size-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="حذف الصورة"
                onClick={() => {
                  setPics((l) => l.filter((x) => x.key !== p.key));
                  if (p.existing) setRemoved((r) => [...r, p]);
                }}
                className="absolute top-1 left-1 flex size-7 items-center justify-center rounded-lg bg-black/60 text-white"
              >
                <X className="size-4" />
              </button>
              {p.file && <span className="absolute top-1 right-1 rounded-md bg-amber-bg px-1 text-[10px] font-bold text-amber-ink">جديدة</span>}
            </div>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
        <span className="text-xs leading-relaxed text-muted">صوّر الجهاز الحقيقي. الصورة الأولى هي الرئيسية (⭐ لتغييرها). الصور تُضغط تلقائياً قبل الرفع.</span>
      </section>

      <Card title="المعلومات الأساسية">
        <Field label="اسم المنتج / الموديل">
          <TextInput value={d.name} onChange={(e) => set("name", e.target.value)} placeholder={d.kind === "laptop" ? "HP EliteBook 840 G6" : "مثال: شاحن لابتوب HP 65W"} dir="auto" />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="الشركة">
            <TextInput list="brands" value={d.brand ?? ""} onChange={(e) => set("brand", e.target.value || null)} placeholder="HP" dir="auto" />
            <datalist id="brands">
              {BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="القسم">
            <Select value={d.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
              <option value="">بدون قسم</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="الحالة">
            <Segmented<Condition>
              label="الحالة"
              value={d.condition}
              onChange={changeCondition}
              options={[
                { value: "new", label: "جديد" },
                { value: "used", label: "مستعمل" },
                { value: "refurb", label: "مجدد" },
              ]}
            />
          </Field>
      </Card>

      <Card title="المواصفات" sub="الحقول تتغير حسب نوع المنتج">
        {d.kind === "laptop" ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="المعالج">
                <TextInput
                  ltr
                  value={d.cpu ?? ""}
                  placeholder="Core i5-8365U"
                  onChange={(e) => set("cpu", e.target.value || null)}
                  onBlur={() => {
                    if (!d.cpu) return;
                    const g = guessCpu(d.cpu);
                    setDraft((x) => (x ? { ...x, cpu_family: x.cpu_family || g.family, cpu_gen: x.cpu_gen || g.gen } : x));
                  }}
                />
              </Field>
              <Field label="الجيل">
                <Select value={d.cpu_gen ?? ""} onChange={(e) => set("cpu_gen", e.target.value || null)}>
                  <option value="">—</option>
                  {GENS.map((g) => (
                    <option key={g} value={g}>
                      الجيل {g}
                    </option>
                  ))}
                  {d.cpu_gen && !GENS.includes(d.cpu_gen) && <option value={d.cpu_gen}>{d.cpu_gen}</option>}
                </Select>
              </Field>
            </div>
            <Field label="نوع المعالج (للفلاتر)" hint="يتعبى تلقائياً من اسم المعالج، وتقدر تغيّره.">
              <TextInput
                list="cpu-families"
                ltr
                value={d.cpu_family ?? ""}
                placeholder="Core i5"
                onChange={(e) => set("cpu_family", e.target.value || null)}
              />
              <datalist id="cpu-families">
                {["Core i3", "Core i5", "Core i7", "Core i9", "Core Ultra 5", "Core Ultra 7", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Celeron", "Pentium", "Apple M1", "Apple M2", "Apple M3"].map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="الرام">
                <Select value={d.ram_gb ?? ""} onChange={(e) => set("ram_gb", e.target.value ? Number(e.target.value) : null)}>
                  <option value="">—</option>
                  {RAMS.map((r) => (
                    <option key={r} value={r}>
                      {r}GB
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="حجم الشاشة">
                <TextInput list="screens" value={d.screen ?? ""} onChange={(e) => set("screen", e.target.value || null)} placeholder="14 بوصة" />
                <datalist id="screens">
                  {SCREENS.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="نوع التخزين">
                <Segmented<"SSD" | "HDD">
                  label="نوع التخزين"
                  value={d.storage_type}
                  onChange={(v) => set("storage_type", v)}
                  options={[
                    { value: "SSD", label: "SSD" },
                    { value: "HDD", label: "HDD" },
                  ]}
                />
              </Field>
              <Field label="السعة">
                <Select value={d.storage_gb ?? ""} onChange={(e) => set("storage_gb", e.target.value ? Number(e.target.value) : null)}>
                  <option value="">—</option>
                  {STORAGES.map((s) => (
                    <option key={s} value={s}>
                      {s >= 1000 ? `${s / 1000}TB` : `${s}GB`}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="كرت الشاشة">
              <TextInput list="gpus" ltr value={d.gpu ?? ""} onChange={(e) => set("gpu", e.target.value || null)} placeholder="Intel UHD 620" />
              <datalist id="gpus">
                {GPUS.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="حالة البطارية">
                <Select value={d.battery ?? ""} onChange={(e) => set("battery", e.target.value || null)}>
                  <option value="">—</option>
                  {BATTERY.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="الضمان" hint="فاضي = «يُحدد عند البيع»">
                <TextInput value={d.warranty ?? ""} onChange={(e) => set("warranty", e.target.value || null)} placeholder="مثال: شهر" />
              </Field>
            </div>
          </>
        ) : (
          <>
            {KIND_FIELDS[d.kind].map((f) => (
              <Field key={f.key} label={f.label}>
                <TextInput
                  list={f.options ? `opt-${f.key}` : undefined}
                  value={d.attrs[f.key] ?? ""}
                  onChange={(e) => setAttr(f.key, e.target.value)}
                  placeholder={f.placeholder ?? f.options?.[0]}
                  dir="auto"
                />
                {f.options && (
                  <datalist id={`opt-${f.key}`}>
                    {f.options.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                )}
              </Field>
            ))}
            <Field label="الضمان" hint="فاضي = «يُحدد عند البيع»">
              <TextInput value={d.warranty ?? ""} onChange={(e) => set("warranty", e.target.value || null)} placeholder="مثال: أسبوع" />
            </Field>
          </>
        )}
      </Card>

      <Card title="السعر والمخزون">
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">اسأل عن السعر</span>
            <span className="text-xs text-muted">بدون سعر ثابت، الزبون يسأل في واتساب</span>
          </span>
          <Toggle label="اسأل عن السعر" on={d.price_on_request} onChange={(v) => set("price_on_request", v)} />
        </div>
        {!d.price_on_request && (
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="السعر">
              <MoneyInput value={d.price} onChange={(v) => set("price", v)} placeholder="450,000" />
            </Field>
            <Field label="السعر قبل التخفيض" hint={disc ? `يظهر للزبون: خصم ${disc}%` : "اختياري"}>
              <MoneyInput value={d.old_price} onChange={(v) => set("old_price", v)} placeholder="—" />
            </Field>
          </div>
        )}
        <Field label="الكمية المتوفرة">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="إنقاص" onClick={() => set("quantity", Math.max(0, d.quantity - 1))} className="flex size-12 items-center justify-center rounded-xl border border-line bg-card">
              <Minus className="size-5" />
            </button>
            <TextInput
              inputMode="numeric"
              value={String(d.quantity)}
              onChange={(e) => set("quantity", Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
              className="text-center font-bold"
            />
            <button type="button" aria-label="زيادة" onClick={() => set("quantity", d.quantity + 1)} className="flex size-12 items-center justify-center rounded-xl border border-line bg-card">
              <Plus className="size-5" />
            </button>
          </div>
          {d.quantity === 0 && <span className="text-xs font-semibold text-red-ink">الكمية صفر = يظهر للزبون «نفد من المخزون»</span>}
        </Field>
      </Card>

      <Card title="الوصف">
        <TextArea rows={4} value={d.description ?? ""} onChange={(e) => set("description", e.target.value || null)} placeholder="أي تفاصيل تهم الزبون: الحالة، الملحقات، ملاحظات…" aria-label="وصف المنتج" />
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">ظاهر في المتجر</span>
            <span className="text-xs text-muted">أطفئه لإخفاء المنتج بدون حذفه</span>
          </span>
          <Toggle label="ظاهر في المتجر" on={d.is_visible} onChange={(v) => set("is_visible", v)} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">ضمن العروض</span>
            <span className="text-xs text-muted">يظهر في «عروض وتخفيضات»</span>
          </span>
          <Toggle label="ضمن العروض" on={d.is_offer} onChange={(v) => set("is_offer", v)} />
        </div>
      </Card>

      {saved && isAdmin && (
        <Card>
          {confirmDel ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-sm">متأكد؟ المنتج وصوره بيتحذفوا نهائياً. (لو عايز تخفيه بس، اقفل «ظاهر في المتجر».)</p>
              <div className="flex gap-2">
                <Button variant="danger" className="flex-1" onClick={remove} loading={busy === "جاري الحذف…"}>
                  <Trash2 className="size-5" /> نعم، احذف
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDel(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDel(true)} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-red-ink">
              <Trash2 className="size-5" /> حذف المنتج نهائياً
            </button>
          )}
        </Card>
      )}

      <div className="h-20" />

      <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-40 border-t border-line bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl gap-2.5">
          <Button variant="outline" className="flex-1" onClick={() => setPreview(true)} disabled={!!busy}>
            <Eye className="size-5" /> معاينة
          </Button>
          <Button className="flex-[1.6]" onClick={save} loading={!!busy}>
            {!busy && <Check className="size-5" strokeWidth={2.4} />}
            {busy ?? (isNew ? "نشر المنتج" : "حفظ التعديلات")}
          </Button>
        </div>
      </div>

      {preview && previewProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="معاينة المنتج">
          <button type="button" aria-label="إغلاق" onClick={() => setPreview(false)} className="absolute inset-0 bg-black/50" />
          <div className="relative flex max-h-[88dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[26px] bg-bg p-4 md:rounded-[26px]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">كده بيظهر للزبون</h2>
              <button type="button" onClick={() => setPreview(false)} aria-label="إغلاق" className="flex size-11 items-center justify-center rounded-xl">
                <X className="size-6" />
              </button>
            </div>
            <div className="mx-auto w-[190px]">
              <ProductCard product={previewProduct} />
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-card p-3">
              <span dir="auto" className="text-right font-bold">
                {previewProduct.name || "—"}
              </span>
              <SpecText product={previewProduct} className="text-sm text-muted" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {specRows(previewProduct).map((r) => (
                <div key={r.label} className="rounded-xl bg-field p-2.5">
                  <div className="text-xs text-muted">{r.label}</div>
                  <div className="text-sm font-semibold">
                    <bdi>{r.value}</bdi>
                  </div>
                </div>
              ))}
            </div>
            {!d.is_visible && <Notice>المنتج مخفي: ما بيظهر للزبائن لحدي ما تشغّل «ظاهر في المتجر».</Notice>}
            <Button onClick={() => setPreview(false)}>تمام</Button>
          </div>
        </div>
      )}
    </>
  );
}

function toDraft(p: AdminProduct): ProductDraft {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { images, created_at, updated_at, price_updated_at, ...rest } = p;
  return { ...rest, attrs: p.attrs ?? {} };
}

/** Clears fields that don't belong to the chosen kind and trims text. */
function cleanDraft(d: ProductDraft): ProductDraft {
  const t = (v: string | null) => (v && v.trim() ? v.trim() : null);
  const out: ProductDraft = {
    ...d,
    name: d.name.trim(),
    brand: t(d.brand),
    warranty: t(d.warranty),
    description: t(d.description),
    old_price: d.price_on_request ? null : d.old_price || null,
    price: d.price_on_request ? null : d.price,
  };
  if (d.kind === "laptop") {
    out.attrs = {};
    out.cpu = t(d.cpu);
    out.cpu_family = t(d.cpu_family);
    out.gpu = t(d.gpu);
    out.screen = t(d.screen);
  } else {
    const keys = KIND_FIELDS[d.kind].map((f) => f.key);
    out.attrs = Object.fromEntries(Object.entries(d.attrs).filter(([k, v]) => keys.includes(k) && v.trim()).map(([k, v]) => [k, v.trim()]));
    Object.assign(out, { cpu: null, cpu_family: null, cpu_gen: null, ram_gb: null, storage_type: null, storage_gb: null, gpu: null, screen: null, battery: null });
  }
  return out;
}
