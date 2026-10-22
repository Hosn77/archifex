import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Archifex | نظام إدارة الأرشيف والملفات - من شركة مَدار فَلَك",
    template: "%s | Archifex",
  },
  description:
    "Archifex من شركة مَدار فَلَك: نظام سحابي لإدارة الأرشيف والملفات، مساحات عمل معزولة لكل مؤسسة، حماية RLS، وتجربة مجانية 30 يوماً.",
  applicationName: "Archifex",
  authors: [{ name: "MadarFalak" }],
  creator: "MadarFalak",
  publisher: "MadarFalak",
  keywords: [
    "Archifex",
    "MadarFalak",
    "مدار فلك",
    "إدارة الأرشيف",
    "Document Archiving",
    "SaaS",
    "Supabase",
  ],
  openGraph: {
    title: "Archifex | نظام إدارة الأرشيف والملفات - من شركة مَدار فَلَك",
    description:
      "مساحات أرشيف معزولة لكل مؤسسة، حماية على مستوى الصفوف، وتجربة مجانية 30 يوماً. من مَدار فَلَك | MadarFalak.",
    siteName: "Archifex — MadarFalak",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Archifex | نظام إدارة الأرشيف والملفات - من شركة مَدار فَلَك",
    description: "نظام إدارة الأرشيف والملفات من شركة مَدار فَلَك | MadarFalak.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
