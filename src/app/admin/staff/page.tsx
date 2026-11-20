"use client";

import { useEffect, useState } from "react";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { cancelInvite, inviteStaff, listStaff, removeStaff, setStaffRole, type Invite, type StaffMember } from "@/lib/admin";
import type { Role } from "@/lib/auth";
import { AdminShell, useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, Field, Notice, Segmented, Spinner, TextInput } from "@/components/admin/ui";

const ROLE_LABEL: Record<Role, string> = { admin: "مدير", staff: "موظف" };

export default function StaffPage() {
  return (
    <AdminShell title="الموظفين والصلاحيات" back="/admin/more/" adminOnly>
      <Staff />
    </AdminShell>
  );
}

function Staff() {
  const { email: myEmail } = useAdmin();
  const [data, setData] = useState<{ members: StaffMember[]; invites: Invite[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = () => listStaff().then(setData).catch((e: Error) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  async function run(fn: () => Promise<unknown>, success?: string) {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await fn();
      await load();
      if (success) setOk(success);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const adminUrl = typeof window !== "undefined" ? `${window.location.origin}/admin/` : "/admin/";

  if (!data) return err ? <Notice kind="error">{err}</Notice> : <Spinner />;

  return (
    <>
      <Notice>
        <b>الموظف</b> يقدر: يضيف ويعدّل المنتجات والصور، يغيّر الأسعار والكميات، يخفي ويظهر المنتجات، ويتابع الطلبات.
        <br />
        <b>المدير</b> فوق ده: يحذف المنتجات، الأقسام، معلومات المتجر، تغيير كل الأسعار، والموظفين.
      </Notice>

      <Card title="الحسابات الحالية">
        {data.members.map((m) => {
          const me = m.email === myEmail?.toLowerCase();
          return (
            <div key={m.user_id} className="flex flex-col gap-2 border-t border-line py-3 first:border-t-0">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {m.name ?? m.email} {me && <span className="text-xs text-muted">(إنت)</span>}
                  </span>
                  <span className="ltr truncate text-xs text-muted">{m.email}</span>
                </span>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${m.role === "admin" ? "bg-tint text-on-tint" : "bg-field text-muted"}`}>{ROLE_LABEL[m.role]}</span>
              </div>
              {!me && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Segmented<Role>
                      label="الصلاحية"
                      value={m.role}
                      onChange={(r) => run(() => setStaffRole(m.user_id, r), "تم تغيير الصلاحية ✓")}
                      options={[
                        { value: "staff", label: "موظف" },
                        { value: "admin", label: "مدير" },
                      ]}
                    />
                  </div>
                  {confirmRemove === m.user_id ? (
                    <Button variant="danger" className="h-12" loading={busy} onClick={() => run(() => removeStaff(m.user_id), "تم إيقاف الحساب ✓").then(() => setConfirmRemove(null))}>
                      تأكيد الإيقاف
                    </Button>
                  ) : (
                    <button type="button" aria-label={`إيقاف ${m.email}`} onClick={() => setConfirmRemove(m.user_id)} className="flex size-12 items-center justify-center rounded-xl border border-line text-red-ink">
                      <Trash2 className="size-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {data.invites.length > 0 && (
        <Card title="دعوات لم تُستخدم بعد">
          {data.invites.map((i) => (
            <div key={i.email} className="flex items-center justify-between gap-2 border-t border-line py-2.5 first:border-t-0">
              <span className="flex min-w-0 flex-col">
                <span className="ltr truncate text-sm font-semibold">{i.email}</span>
                <span className="text-xs text-muted">
                  {i.name ?? ""} · {ROLE_LABEL[i.role]}
                </span>
              </span>
              <button type="button" disabled={busy} onClick={() => run(() => cancelInvite(i.email), "تم إلغاء الدعوة")} className="min-h-11 px-2 text-sm font-semibold text-red-ink">
                إلغاء
              </button>
            </div>
          ))}
        </Card>
      )}

      <Card title="إضافة موظف">
        <Field label="إيميل الموظف">
          <TextInput type="email" ltr value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" />
        </Field>
        <Field label="الاسم">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الموظف" />
        </Field>
        <Field label="الصلاحية">
          <Segmented<Role>
            label="الصلاحية"
            value={role}
            onChange={setRole}
            options={[
              { value: "staff", label: "موظف" },
              { value: "admin", label: "مدير" },
            ]}
          />
        </Field>
        <Button
          loading={busy}
          onClick={() => {
            if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("اكتب إيميل صحيح.");
            void run(() => inviteStaff(email, name, role), "تمت إضافة الدعوة ✓ أرسل للموظف رابط لوحة التحكم.").then(() => {
              setEmail("");
              setName("");
            });
          }}
        >
          <UserPlus className="size-5" /> إضافة
        </Button>
        <div className="flex flex-col gap-2 rounded-xl bg-field p-3 text-xs leading-relaxed text-muted">
          بعد الإضافة: الموظف يفتح رابط لوحة التحكم، يضغط «أول مرة؟ إنشاء حساب»، ويكتب نفس الإيميل وكلمة سر يختارها.
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(adminUrl).then(() => setOk("تم نسخ الرابط"))}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-card text-sm font-semibold text-ink"
          >
            <Copy className="size-4" /> نسخ رابط لوحة التحكم
          </button>
        </div>
      </Card>

      {err && <Notice kind="error">{err}</Notice>}
      {ok && <Notice kind="success">{ok}</Notice>}
    </>
  );
}
