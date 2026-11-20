import type { Settings } from "@/lib/types";

export function Footer({ s }: { s: Settings }) {
  return (
    <footer className="mx-4 mt-2 flex flex-col items-center gap-3 border-t border-line pt-5 text-center text-xs text-muted">
      <div className="flex gap-2">
        {s.facebook_url && (
          <a href={s.facebook_url} target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink">
            فيسبوك
          </a>
        )}
        {s.tiktok_url && (
          <a href={s.tiktok_url} target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink">
            تيك توك
          </a>
        )}
      </div>
      <p>© {s.store_name} — <span className="ltr">Nanobyte Technology</span></p>
    </footer>
  );
}
