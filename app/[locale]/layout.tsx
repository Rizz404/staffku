import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LOCALES, isLocale } from "@/lib/agents";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const id = locale === "id";
  return {
    title: { default: id ? "Staffku — Staf AI pribadimu" : "Staffku — Your personal AI staff", template: "%s · Staffku" },
    description: id
      ? "Staf AI pribadi untuk urusan sehari-hari: rencana harian, belajar, menulis, keuangan pribadi, dan liburan. Gratis untuk pemakaian pribadi, tanpa daftar."
      : "Personal AI staff for everyday life: daily planning, studying, writing, personal money and travel. Free for personal use, no sign-up.",
    alternates: { languages: { id: "/id", en: "/en" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} className={geist.variable}>
      <body>
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
