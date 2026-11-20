"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastMsg {
  text: string;
  link?: { href: string; label: string };
}

export function useToast() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: ToastMsg) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { msg, show };
}

export function Toast({ msg, bottom = "bottom-28" }: { msg: ToastMsg | null; bottom?: string }) {
  return (
    <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 ${bottom} z-50 flex justify-center px-4`}>
      {msg && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-bg shadow-lg">
          <CheckCircle2 className="size-5 shrink-0 text-green-ink" />
          <span>{msg.text}</span>
          {msg.link && (
            <Link href={msg.link.href} className="font-bold text-primary-ink underline-offset-2 hover:underline">
              {msg.link.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
