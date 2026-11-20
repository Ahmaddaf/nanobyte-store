"use client";

import { useEffect, useState } from "react";
import { adjustPrices, afterChange, listCategories, type AdminCategory } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, Notice, Select, TextInput } from "@/components/admin/ui";

export default function PricesPage() {
  return (
    <AdminShell title="تغيير كل الأسعار" back="/admin/more/" adminOnly>
      <Bulk />
    </AdminShell>
  );
}

function Bulk() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [pct, setPct] = useState("");
  const [cat, setCat] = useState("");
  const [round, setRound] = useState("500");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    listCategories().then(setCats).catch(() => {});
  }, []);

  const n = Number(pct.replace(",", "."));
  const valid = pct.trim() !== "" && !Number.isNaN(n) && n !== 0 && n >= -90 && n <= 500;
  const example = valid ? Math.round((100000 * (1 + n / 100)) / Number(round)) * Number(round) : null;
  const scope = cat ? cats.find((c) => c.id === cat)?.name : "كل المنتجات";

  async function apply() {
    setBusy(true);
    setMsg(null);
    try {
      const count = await adjustPrices(n, cat || null, Number(round));
      afterChange();
      setMsg({ kind: "success", text: `تم تحديث سعر ${count} منتج ✓` });
      setPct("");
      setConfirm(false);
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Notice>لما الأسعار تتغير مع الدولار: اكتب النسبة وكل الأسعار تتعدل مرة واحدة (والسعر قبل التخفيض كمان). المنتجات «اسأل عن السعر» ما بتتأثر.</Notice>
      <Card>
        <Field label="النسبة %" hint="زيادة: 10 — تخفيض: ‎-5">
          <TextInput ltr inputMode="decimal" value={pct} onChange={(e) => (setConfirm(false), setPct(e.target.value))} placeholder="10" />
        </Field>
        <Field label="على">
          <Select value={cat} onChange={(e) => (setConfirm(false), setCat(e.target.value))}>
            <option value="">كل المنتجات</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="تقريب السعر لأقرب">
          <Select value={round} onChange={(e) => setRound(e.target.value)}>
            {["1", "100", "500", "1000", "5000"].map((r) => (
              <option key={r} value={r}>
                {r === "1" ? "بدون تقريب" : `${formatPrice(Number(r))} ج.س`}
              </option>
            ))}
          </Select>
        </Field>
        {example != null && (
          <p className="rounded-xl bg-field p-3 text-sm">
            مثال: منتج سعره <b>100,000</b> يصبح <b>{formatPrice(example)}</b> ج.س
          </p>
        )}
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        {!confirm ? (
          <Button disabled={!valid} onClick={() => setConfirm(true)}>
            تطبيق
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Notice kind="error">
              متأكد؟ بيتغير سعر {scope} بنسبة {n > 0 ? "+" : ""}
              {n}%.
            </Notice>
            <div className="flex gap-2">
              <Button className="flex-1" loading={busy} onClick={apply}>
                نعم، طبّق
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirm(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
