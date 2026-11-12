import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StaffGrid from "@/components/StaffGrid";
import { AGENTS, isLocale } from "@/lib/agents";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? t(locale).catalogTitle : "Staff" };
}

export default async function Agents({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1>{d.catalogTitle}</h1>
        <p>{d.catalogSub}</p>
        <span className="count">{d.staffCount(AGENTS.length)}</span>
      </header>
      <StaffGrid locale={locale} />
    </div>
  );
}
