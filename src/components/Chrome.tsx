"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, House, LayoutGrid, Moon, ShoppingBag, Sun, Tag } from "lucide-react";
import { cartCount, useCart } from "@/lib/cart";
import { toggleTheme, useTheme } from "@/lib/theme";
import { ChatIcon } from "./icons";
import type { ReactNode } from "react";

export function Logo({ sub = true }: { sub?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label="نانو بايت — الرئيسية">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={46} height={27} className="h-[27px] w-[46px] object-contain" />
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-bold">نانو بايت</span>
        {sub && (
          <span className="text-xs text-muted">
            <span className="ltr">NANO BYTE</span> · أم درمان
          </span>
        )}
      </span>
    </Link>
  );
}

export function ThemeButton() {
  const theme = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
      className="flex size-11 items-center justify-center rounded-[14px] border border-line bg-card text-ink"
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

export function CartButton({ bordered = true }: { bordered?: boolean }) {
  const items = useCart();
  const n = cartCount(items);
  return (
    <Link
      href="/cart/"
      aria-label={n ? `السلة، ${n} منتج` : "السلة"}
      className={`relative flex size-11 items-center justify-center rounded-[14px] text-ink ${bordered ? "border border-line bg-card" : ""}`}
    >
      <ShoppingBag className="size-[21px]" />
      {n > 0 && (
        <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-magenta px-1 text-xs font-bold text-white">
          {n}
        </span>
      )}
    </Link>
  );
}

/** Top bar for inner pages: back button + title + actions. */
export function TopBar({ title, actions, back = "/" }: { title: string; actions?: ReactNode; back?: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-2.5">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            aria-label="رجوع"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(back))}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink"
          >
            <ChevronRight className="size-6" />
          </button>
          <h1 className="truncate text-base font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-1">{actions}</div>
      </div>
    </header>
  );
}

const NAV = [
  { href: "/", label: "الرئيسية", Icon: House },
  { href: "/categories/", label: "الأقسام", Icon: LayoutGrid },
  { href: "/shop/?offers=1", label: "العروض", Icon: Tag, match: "offers" },
  { href: "/cart/", label: "السلة", Icon: ShoppingBag },
  { href: "/contact/", label: "تواصل", Icon: ChatIcon },
] as const;

export function BottomNav() {
  const path = usePathname();
  const items = useCart();
  const n = cartCount(items);
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur md:hidden"
    >
      <div className="flex px-1.5 pt-1">
        {NAV.map(({ href, label, Icon }) => {
          const base = href.split("?")[0];
          const on = base === "/" ? path === "/" : path.startsWith(base) && !href.includes("offers");
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] flex-1 flex-col items-center gap-1 pt-1.5 ${on ? "text-primary-ink" : "text-faint"}`}
              aria-current={on ? "page" : undefined}
            >
              <span className={`relative flex h-[30px] w-[52px] items-center justify-center rounded-full ${on ? "bg-tint" : ""}`}>
                <Icon className="size-[22px]" strokeWidth={on ? 2 : 1.8} />
                {href === "/cart/" && n > 0 && (
                  <span className="absolute -top-1 left-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-magenta px-1 text-[11px] font-bold text-white">
                    {n}
                  </span>
                )}
              </span>
              <span className={`text-xs ${on ? "font-semibold" : "font-medium"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Desktop-only links (the phone uses the bottom bar). */
export function DesktopNav() {
  return (
    <nav aria-label="روابط" className="hidden items-center gap-1 md:flex">
      {NAV.slice(0, 3).concat(NAV[4]).map(({ href, label }) => (
        <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-tint">
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function SectionHead({ title, href, linkText = "عرض الكل" }: { title: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between px-4">
      <h2 className="text-[17px] font-bold">{title}</h2>
      {href && (
        <Link href={href} className="flex min-h-11 items-center gap-0.5 text-[13px] font-medium text-primary-ink">
          {linkText}
          <ChevronRight className="size-4 rotate-180" />
        </Link>
      )}
    </div>
  );
}
