"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronRight, Clock, MapPin, Phone, Search, SlidersHorizontal, WifiOff } from "lucide-react";
import { imageUrl } from "@/lib/supabase";
import { waLink } from "@/lib/whatsapp";
import type { Banner, Settings } from "@/lib/types";
import { ChatIcon, LaptopArt } from "./icons";

export function SearchBar({ initial = "", autoFocus = false, onSubmit }: { initial?: string; autoFocus?: boolean; onSubmit?: (q: string) => void }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (onSubmit) onSubmit(q.trim());
    else router.push(`/shop/${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  }
  return (
    <form role="search" onSubmit={submit} className="flex gap-2">
      <label className="flex h-12 flex-1 items-center gap-2 rounded-[14px] bg-field px-3.5 text-faint">
        <Search className="size-5 shrink-0" />
        <span className="sr-only">بحث</span>
        <input
          type="search"
          enterKeyHint="search"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث: لابتوب، موديل، معالج، رام…"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </label>
      {!onSubmit && (
        <Link
          href="/shop/"
          aria-label="الفلاتر والترتيب"
          className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white"
        >
          <SlidersHorizontal className="size-[22px]" strokeWidth={2} />
        </Link>
      )}
    </form>
  );
}

const DEFAULT_BANNER: Banner = {
  id: "default",
  title: "لابتوبات، إكسسوارات، قطع غيار وصيانة",
  subtitle: "نانو بايت تكنولوجي — أم درمان",
  image: null,
  link: "/shop/",
  sort: 0,
};

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const list = banners.length ? banners : [DEFAULT_BANNER];
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);

  // auto-advance every 5s (paused if the user prefers less motion)
  useEffect(() => {
    if (list.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (i + 1) % list.length;
      el.scrollTo({ left: -next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(t);
  }, [i, list.length]);

  return (
    <section aria-label="العروض" className="flex flex-col gap-2.5">
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {list.map((b) => (
          <div key={b.id} className="w-full shrink-0 snap-center px-4">
            <BannerSlide b={b} />
          </div>
        ))}
      </div>
      {list.length > 1 && (
        <div aria-hidden="true" className="flex justify-center gap-1.5">
          {list.map((b, n) => (
            <span key={b.id} className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-primary" : "w-1.5 bg-line"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

function BannerSlide({ b }: { b: Banner }) {
  const img = imageUrl(b.image);
  const inner = (
    <div className="brand-gradient relative flex min-h-[176px] flex-col justify-between gap-4 overflow-hidden rounded-[22px] p-5 text-white">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <LaptopArt className="absolute -bottom-3.5 -left-4 w-[190px] text-white opacity-25" />
      )}
      {img && <div className="absolute inset-0 bg-gradient-to-l from-black/55 to-black/10" />}
      <div className="relative flex max-w-[250px] flex-col gap-1.5">
        {b.subtitle && <span className="self-start rounded-[10px] bg-white/20 px-2.5 py-1 text-xs font-semibold">{b.subtitle}</span>}
        <span className="line-clamp-3 text-xl leading-snug font-bold">{b.title}</span>
      </div>
      {b.link && (
        <span className="relative flex h-11 items-center gap-1 self-start rounded-[13px] bg-white px-4 text-sm font-bold text-[#4515c2]">
          تصفّح الآن
          <ChevronRight className="size-4 rotate-180" strokeWidth={2.2} />
        </span>
      )}
    </div>
  );
  return b.link ? (
    <Link href={b.link} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function ContactCard({ s }: { s: Settings }) {
  return (
    <section aria-label="تواصل معنا" className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.png" alt="" width={64} height={61} className="h-[61px] w-16 rounded-xl bg-white object-contain p-1" />
        <div className="flex flex-col">
          <h2 className="text-base font-bold">{s.store_name}</h2>
          <span className="text-[13px] text-muted">واتساب واتصال</span>
        </div>
      </div>
      <a href={waLink(s.whatsapp)} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-2.5 text-ink">
        <ChatIcon className="size-[22px] text-green-ink" />
        <span className="ltr text-lg font-bold">{s.phone_primary}</span>
        <span className="text-xs text-muted">واتساب</span>
      </a>
      {s.phone_secondary && (
        <a href={`tel:${s.phone_secondary}`} className="flex min-h-11 items-center gap-2.5 text-ink">
          <Phone className="size-5 text-muted" />
          <span className="ltr text-[15px] font-medium">{s.phone_secondary}</span>
          <span className="text-xs text-muted">اتصال</span>
        </a>
      )}
      <a
        href={s.map_url ?? undefined}
        target="_blank"
        rel="noopener"
        className="flex min-h-11 items-center gap-2.5 text-sm text-muted"
      >
        <MapPin className="size-5 shrink-0" />
        <span>{s.address}</span>
        {s.map_url && <span className="shrink-0 font-semibold text-primary-ink">الخريطة</span>}
      </a>
      <div className="flex items-center gap-2.5 text-sm text-muted">
        <Clock className="size-5 shrink-0" />
        <span>{s.hours}</span>
      </div>
    </section>
  );
}

export function StoreNotice({ status }: { status: "unconfigured" | "error" }) {
  return (
    <div className="mx-4 flex items-start gap-3 rounded-2xl border border-line bg-card p-4 text-sm text-muted">
      <WifiOff className="mt-0.5 size-5 shrink-0" />
      <p className="leading-relaxed">
        {status === "unconfigured"
          ? "المتجر قيد الإعداد. تقدر تتواصل معنا مباشرة عبر واتساب."
          : "ما قدرنا نحمّل المنتجات. تأكد من الإنترنت وحاول مرة ثانية."}
      </p>
    </div>
  );
}
