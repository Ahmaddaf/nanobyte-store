"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronRight, House, LayoutGrid, LogOut, Menu, Package, PlusCircle } from "lucide-react";
import { isConfigured } from "@/lib/config";
import { signIn, signOut, signUp, useStaff, type Role } from "@/lib/auth";
import { Button, Field, Notice, Spinner, TextInput } from "./ui";

interface AdminCtx {
  role: Role;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
}
const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin(): AdminCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside AdminShell");
  return c;
}

const NAV = [
  { href: "/admin/", label: "الرئيسية", Icon: House },
  { href: "/admin/products/", label: "المنتجات", Icon: Package },
  { href: "/admin/product/", label: "إضافة منتج", Icon: PlusCircle },
  { href: "/admin/more/", label: "المزيد", Icon: Menu },
];

/**
 * Wraps every dashboard page: shows the login form when signed out and only
 * renders the page for staff. Permissions are enforced again by the database.
 */
export function AdminShell({
  title,
  back,
  actions,
  adminOnly,
  children,
  dark,
}: {
  title: string;
  back?: string;
  actions?: ReactNode;
  adminOnly?: boolean;
  children: ReactNode | ((ctx: AdminCtx) => ReactNode);
  dark?: boolean;
}) {
  const st = useStaff();
  const path = usePathname();
  const router = useRouter();

  if (!isConfigured) {
    return (
      <Center>
        <Notice kind="error">لوحة التحكم تحتاج ربط قاعدة البيانات (Supabase) أولاً.</Notice>
      </Center>
    );
  }
  if (st.loading) return <Spinner />;
  if (!st.session) return <Login onDone={st.reload} />;
  if (!st.role) {
    return (
      <Center>
        <Notice kind="error">الحساب ({st.email}) ما عنده صلاحية دخول لوحة التحكم. اطلب من المدير يضيفك.</Notice>
        <Button variant="outline" onClick={() => signOut()}>
          تسجيل الخروج
        </Button>
      </Center>
    );
  }

  const ctx: AdminCtx = { role: st.role, name: st.name, email: st.email, isAdmin: st.role === "admin" };

  return (
    <Ctx.Provider value={ctx}>
      <div className="min-h-dvh pb-[calc(84px+env(safe-area-inset-bottom))]">
        <header className={`sticky top-0 z-30 ${dark ? "bg-[#16132e] text-white" : "border-b border-line bg-card/95 backdrop-blur"}`}>
          <div className="mx-auto flex h-[60px] max-w-3xl items-center justify-between px-2.5">
            <div className="flex min-w-0 items-center gap-1">
              {back ? (
                <button type="button" aria-label="رجوع" onClick={() => router.push(back)} className="flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <ChevronRight className="size-6" />
                </button>
              ) : (
                <span className="me-1.5 ms-1 flex size-10 items-center justify-center rounded-xl bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-mark.png" alt="" className="h-[19px] w-8 object-contain" />
                </span>
              )}
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-base font-bold">{title}</h1>
                {!back && (
                  <span className={`text-xs ${dark ? "text-[#c8c3e0]" : "text-muted"}`}>
                    {ctx.name ?? ctx.email} · {ctx.isAdmin ? "مدير" : "موظف"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">{actions}</div>
          </div>
        </header>

        <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
          {adminOnly && !ctx.isAdmin ? (
            <Notice kind="error">الصفحة دي للمدير فقط.</Notice>
          ) : typeof children === "function" ? (
            children(ctx)
          ) : (
            children
          )}
        </main>

        <nav aria-label="تنقل لوحة التحكم" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl px-1.5 pt-1">
            {NAV.map(({ href, label, Icon }) => {
              const on = href === "/admin/" ? path === "/admin" || path === "/admin/" : path.startsWith(href.slice(0, -1));
              return (
                <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex min-h-[52px] flex-1 flex-col items-center gap-1 pt-1.5 ${on ? "text-primary-ink" : "text-faint"}`}>
                  <span className={`flex h-[30px] w-[52px] items-center justify-center rounded-full ${on ? "bg-tint" : ""}`}>
                    <Icon className="size-[22px]" strokeWidth={on ? 2 : 1.8} />
                  </span>
                  <span className={`text-xs ${on ? "font-semibold" : "font-medium"}`}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </Ctx.Provider>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">{children}</div>;
}

function Login({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (mode === "up") {
      if (pw.length < 8) return setErr("كلمة السر لازم تكون 8 أحرف أو أكثر.");
      if (pw !== pw2) return setErr("كلمتا السر غير متطابقتين.");
    }
    setBusy(true);
    try {
      if (mode === "in") await signIn(email, pw);
      else {
        const r = await signUp(email, pw);
        if (r === "check_email") {
          setInfo("تم إنشاء الحساب. افتح الرسالة اللي وصلتك في البريد لتأكيده، وبعدها سجّل دخول.");
          setMode("in");
          return;
        }
      }
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Center>
      <div className="flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.png" alt="نانو بايت" width={120} height={114} className="rounded-2xl bg-white p-2" />
        <h1 className="text-xl font-bold">لوحة تحكم نانو بايت</h1>
        <p className="text-sm text-muted">{mode === "in" ? "سجّل دخول بإيميلك وكلمة السر." : "أول مرة؟ اعمل حسابك بالإيميل اللي أضافه المدير."}</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="الإيميل">
          <TextInput type="email" autoComplete="email" required ltr value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" />
        </Field>
        <Field label="كلمة السر">
          <TextInput type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required ltr value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        {mode === "up" && (
          <Field label="أعد كتابة كلمة السر">
            <TextInput type="password" autoComplete="new-password" required ltr value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
        )}
        {err && <Notice kind="error">{err}</Notice>}
        {info && <Notice kind="success">{info}</Notice>}
        <Button type="submit" loading={busy}>
          {mode === "in" ? "دخول" : "إنشاء الحساب"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setErr(null);
        }}
        className="min-h-11 text-sm font-semibold text-primary-ink"
      >
        {mode === "in" ? "أول مرة؟ إنشاء حساب" : "عندي حساب، رجوع للدخول"}
      </button>
      <Link href="/" className="flex min-h-11 items-center justify-center gap-1 text-sm text-muted">
        <LayoutGrid className="size-4" />
        الذهاب للمتجر
      </Link>
    </Center>
  );
}

export function SignOutButton() {
  return (
    <Button variant="outline" onClick={() => signOut()}>
      <LogOut className="size-5" />
      تسجيل الخروج
    </Button>
  );
}
