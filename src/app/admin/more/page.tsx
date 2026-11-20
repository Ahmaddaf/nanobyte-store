"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, KeyRound, LayoutGrid, Percent, Store, Users } from "lucide-react";
import { changePassword } from "@/lib/auth";
import { AdminShell, SignOutButton } from "@/components/admin/AdminShell";
import { Button, Card, Field, Notice, TextInput } from "@/components/admin/ui";

export default function MorePage() {
  return (
    <AdminShell title="المزيد" back="/admin/">
      {({ isAdmin, email }) => (
        <>
          {isAdmin && (
            <Card>
              <Item href="/admin/store/" Icon={Store} title="معلومات المتجر" sub="رقم واتساب، العنوان، المواعيد، النصوص" />
              <Item href="/admin/categories/" Icon={LayoutGrid} title="الأقسام" sub="إضافة، ترتيب، إخفاء" />
              <Item href="/admin/prices/" Icon={Percent} title="تغيير كل الأسعار" sub="بنسبة مئوية مع تقريب" />
              <Item href="/admin/staff/" Icon={Users} title="الموظفين والصلاحيات" sub="إضافة موظف وتحديد صلاحيته" />
            </Card>
          )}
          <Password email={email} />
          <SignOutButton />
        </>
      )}
    </AdminShell>
  );
}

function Item({ href, Icon, title, sub }: { href: string; Icon: typeof Store; title: string; sub: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 border-t border-line py-2.5 text-ink first:border-t-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint text-primary-ink">
        <Icon className="size-5" />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">{sub}</span>
      </span>
      <ChevronLeft className="size-4 text-faint" />
    </Link>
  );
}

function Password({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  if (!open)
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <KeyRound className="size-5" /> تغيير كلمة السر
      </Button>
    );
  return (
    <Card title="تغيير كلمة السر" sub={email ?? undefined}>
      <Field label="كلمة السر الجديدة" hint="8 أحرف أو أكثر">
        <TextInput type="password" autoComplete="new-password" ltr value={pw} onChange={(e) => setPw(e.target.value)} />
      </Field>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Button
        loading={busy}
        onClick={async () => {
          if (pw.length < 8) return setMsg({ kind: "error", text: "كلمة السر لازم تكون 8 أحرف أو أكثر." });
          setBusy(true);
          try {
            await changePassword(pw);
            setMsg({ kind: "success", text: "تم تغيير كلمة السر ✓" });
            setPw("");
          } catch (e) {
            setMsg({ kind: "error", text: (e as Error).message });
          } finally {
            setBusy(false);
          }
        }}
      >
        حفظ
      </Button>
    </Card>
  );
}
