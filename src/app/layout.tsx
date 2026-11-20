import type { Metadata, Viewport } from "next";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: {
    default: "نانو بايت تكنولوجي | لابتوبات وإكسسوارات — أم درمان",
    template: "%s | نانو بايت",
  },
  description:
    "متجر نانو بايت تكنولوجي في أم درمان: لابتوبات جديدة ومستعملة، إكسسوارات، قطع غيار، شواحن ورام وتخزين، وصيانة. اطلب مباشرة عبر واتساب.",
  applicationName: "نانو بايت",
  icons: { icon: "/logo-mark.png", apple: "/logo-full.png" },
  openGraph: {
    type: "website",
    locale: "ar_SD",
    siteName: "نانو بايت تكنولوجي",
    images: ["/logo-full.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
