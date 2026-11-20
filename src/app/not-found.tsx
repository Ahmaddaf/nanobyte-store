import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={92} height={54} />
      <h1 className="text-xl font-bold">الصفحة دي ما موجودة</h1>
      <Link href="/" className="flex h-12 items-center rounded-2xl bg-primary px-6 text-[15px] font-semibold text-white">
        الرجوع للرئيسية
      </Link>
    </main>
  );
}
