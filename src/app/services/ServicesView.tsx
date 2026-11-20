"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { waLink } from "@/lib/whatsapp";
import { BottomNav, TopBar } from "@/components/Chrome";
import { ChatIcon } from "@/components/icons";

export default function ServicesView() {
  const { settings } = useCatalog();
  const [model, setModel] = useState("");
  const [problem, setProblem] = useState("");

  const msg = [
    "السلام عليكم نانو بايت، أريد صيانة لجهازي:",
    model.trim() ? `الجهاز: ${model.trim()}` : "",
    problem.trim() ? `المشكلة: ${problem.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="pb-nav md:pb-10">
      <TopBar title="خدمات الصيانة" />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <div className="flex items-start gap-3 rounded-[20px] border border-line bg-card p-4">
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-tint text-primary-ink">
            <Wrench className="size-[26px]" strokeWidth={1.8} />
          </span>
          <p className="text-sm leading-7 text-muted">{settings.services_text}</p>
        </div>

        <form
          className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            window.open(waLink(settings.whatsapp, msg), "_blank", "noopener");
          }}
        >
          <h2 className="text-base font-bold">اكتب لنا عن جهازك</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">نوع وموديل الجهاز</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="مثال: HP EliteBook 840 G5"
              className="h-12 rounded-xl border border-line bg-card px-3.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">المشكلة</span>
            <textarea
              rows={3}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="مثال: الجهاز ما بيشحن / الشاشة فيها خط"
              className="resize-none rounded-xl border border-line bg-card px-3.5 py-3 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <button type="submit" className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-green text-[15px] font-bold text-white">
            <ChatIcon className="size-5" />
            أرسل عبر واتساب
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
