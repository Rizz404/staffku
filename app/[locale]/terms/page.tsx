import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/agents";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? t(locale).termsTitle : "Personal use" };
}

export default async function Terms({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
  return (
    <div className="wrap page narrow">
      <header className="page-head left">
        <h1>{d.termsTitle}</h1>
        <p>{d.termsIntro}</p>
      </header>
      {d.termsSections.map((s) => (
        <section className="box terms" key={s.h}>
          <h2>{s.h}</h2>
          <ul>
            {s.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="demo-note">{d.termsNote}</p>
    </div>
  );
}
