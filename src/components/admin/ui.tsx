"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const inputCls =
  "h-12 w-full min-w-0 rounded-xl border border-line bg-card px-3 text-[15px] text-ink outline-none focus:border-primary disabled:opacity-60";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput({ ltr, className = "", ...p }: InputHTMLAttributes<HTMLInputElement> & { ltr?: boolean }) {
  return <input {...p} dir={ltr ? "ltr" : p.dir} className={`${inputCls} ${ltr ? "text-left" : ""} ${className}`} />;
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
  ...p
}: { value: number | null; onChange: (v: number | null) => void; placeholder?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <span className="flex h-12 items-center gap-2 rounded-xl border border-line bg-card px-3 focus-within:border-primary">
      <input
        {...p}
        inputMode="numeric"
        value={value == null ? "" : new Intl.NumberFormat("en-US").format(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
          onChange(digits ? Number(digits) : null);
        }}
        placeholder={placeholder}
        dir="ltr"
        className="min-w-0 flex-1 bg-transparent text-left text-[15px] font-semibold text-ink outline-none"
      />
      <span className="text-xs text-muted">ج.س</span>
    </span>
  );
}

export function Select({ children, className = "", ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...p} className={`${inputCls} appearance-none ps-3 pe-9 ${className}`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-3.5 left-3 size-5 text-faint" />
    </span>
  );
}

export function TextArea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className="w-full resize-none rounded-xl border border-line bg-card p-3 text-[15px] leading-relaxed text-ink outline-none focus:border-primary" />;
}

export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`flex h-7 w-[46px] shrink-0 rounded-full p-[3px] transition-colors disabled:opacity-50 ${on ? "justify-end bg-primary" : "justify-start bg-[#c9c4da] dark:bg-[#4a4566]"}`}
    >
      <span className="size-[22px] rounded-full bg-white shadow-sm" />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-xl bg-field p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-10 min-w-0 flex-1 rounded-[9px] text-sm ${value === o.value ? "border border-line bg-card font-bold text-primary-ink" : "font-medium text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ title, sub, children, className = "", action }: { title?: string; sub?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4 ${className}`}>
      {title && (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold">{title}</h2>
            {sub && <span className="text-xs text-muted">{sub}</span>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" | "dark" | "green"; loading?: boolean }) {
  const v = {
    primary: "bg-primary text-white",
    outline: "border-[1.5px] border-line bg-card text-ink",
    danger: "border-[1.5px] border-red-ink/30 bg-red-bg text-red-ink",
    dark: "bg-ink text-bg",
    green: "bg-green text-white",
  }[variant];
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-semibold disabled:opacity-60 ${v} ${className}`}
    >
      {loading && <Loader2 className="size-5 animate-spin" />}
      {children}
    </button>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) {
  const c = { info: "bg-tint text-on-tint", error: "bg-red-bg text-red-ink", success: "bg-green-bg text-green-ink" }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl px-3.5 py-3 text-sm leading-relaxed ${c}`}>
      {children}
    </div>
  );
}

export function Spinner({ label = "جاري التحميل…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 className="size-5 animate-spin" />
      {label}
    </div>
  );
}
