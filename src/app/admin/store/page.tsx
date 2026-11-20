"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { afterChange, getSettings, saveSettings } from "@/lib/admin";
import type { Settings } from "@/lib/types";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, Notice, Spinner, TextArea, TextInput } from "@/components/admin/ui";

/** "0126111169" or "+249 126 111 169" -> "249126111169" */
function toIntl(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("0")) return "249" + d.slice(1);
  return d;
}

export default function StoreSettingsPage() {
  return (
    <AdminShell title="معلومات المتجر" back="/admin/more/" adminOnly>
      <Form />
    </AdminShell>
  );
}

function Form() {
  const [s, setS] = useState<Settings | null>(null);
  const [wa, setWa] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSettings()
      .then((x) => {
        setS(x);
        setWa(x.whatsapp.startsWith("249") ? "0" + x.whatsapp.slice(3) : x.whatsapp);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (!s) return err ? <Notice kind="error">{err}</Notice> : <Spinner />;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => (setOk(false), setS({ ...s, [k]: v }));

  async function save() {
    if (!s) return;
    const intl = toIntl(wa);
    if (!/^\d{8,15}$/.test(intl)) return setErr("رقم واتساب غير صحيح.");
    setBusy(true);
    setErr(null);
    try {
      await saveSettings({ ...s, whatsapp: intl });
      afterChange();
      setOk(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card title="واتساب والأرقام">
        <Field label="رقم واتساب الطلبات" hint="كل أزرار «اطلب عبر واتساب» بتفتح على الرقم ده.">
          <TextInput ltr inputMode="tel" value={wa} onChange={(e) => (setOk(false), setWa(e.target.value))} placeholder="0126111169" />
        </Field>
        <Field label="رقم الاتصال الأساسي">
          <TextInput ltr inputMode="tel" value={s.phone_primary} onChange={(e) => set("phone_primary", e.target.value)} />
        </Field>
        <Field label="رقم ثاني (اختياري)">
          <TextInput ltr inputMode="tel" value={s.phone_secondary ?? ""} onChange={(e) => set("phone_secondary", e.target.value || null)} />
        </Field>
      </Card>
      <Card title="العنوان والمواعيد">
        <Field label="اسم المتجر">
          <TextInput value={s.store_name} onChange={(e) => set("store_name", e.target.value)} />
        </Field>
        <Field label="العنوان">
          <TextInput value={s.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="رابط الخريطة (Google Maps)">
          <TextInput ltr value={s.map_url ?? ""} onChange={(e) => set("map_url", e.target.value || null)} />
        </Field>
        <Field label="مواعيد العمل">
          <TextInput value={s.hours} onChange={(e) => set("hours", e.target.value)} />
        </Field>
        <Field label="التوصيل">
          <TextInput value={s.delivery_note} onChange={(e) => set("delivery_note", e.target.value)} />
        </Field>
      </Card>
      <Card title="نصوص تظهر للزبون">
        <Field label="ملاحظة الأسعار (تحت كل سعر)" hint="اتركها فاضية لو ما عايزها.">
          <TextArea rows={2} value={s.price_note ?? ""} onChange={(e) => set("price_note", e.target.value || null)} />
        </Field>
        <Field label="وصف خدمات الصيانة">
          <TextArea rows={3} value={s.services_text} onChange={(e) => set("services_text", e.target.value)} />
        </Field>
      </Card>
      <Card title="صفحات التواصل">
        <Field label="فيسبوك">
          <TextInput ltr value={s.facebook_url ?? ""} onChange={(e) => set("facebook_url", e.target.value || null)} />
        </Field>
        <Field label="تيك توك">
          <TextInput ltr value={s.tiktok_url ?? ""} onChange={(e) => set("tiktok_url", e.target.value || null)} />
        </Field>
      </Card>
      {err && <Notice kind="error">{err}</Notice>}
      {ok && <Notice kind="success">تم الحفظ ✓ — التغييرات ظهرت في المتجر.</Notice>}
      <Button onClick={save} loading={busy}>
        <Check className="size-5" /> حفظ
      </Button>
    </>
  );
}
