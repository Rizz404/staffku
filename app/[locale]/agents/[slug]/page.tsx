import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Chat from "@/components/Chat";
import StaffGrid from "@/components/StaffGrid";
import { AGENTS, LOCALES, getAgent, isLocale } from "@/lib/agents";
import { t } from "@/lib/i18n";

type P = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => AGENTS.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = getAgent(slug);
  if (!a || !isLocale(locale)) return {};
  return { title: a.name[locale], description: a.tagline[locale] };
}

export default async function AgentPage({ params }: P) {
  const { locale, slug } = await params;
  const a = getAgent(slug);
  if (!isLocale(locale) || !a) notFound();
  const d = t(locale);

  return (
    <div className="wrap page" style={{ "--c": a.color } as React.CSSProperties}>
      <div className="crumbs">
        <Link href={`/${locale}/agents`}>← {d.back}</Link>
      </div>

      <header className="detail-head">
        <Avatar agent={a} size={84} />
        <div>
          <h1>{a.name[locale]}</h1>
          <p className="tag">{a.tagline[locale]}</p>
        </div>
      </header>

      <div className="detail-cols">
        <aside className="side">
          <div className="box">
            <dl className="meta">
              <dt>{d.category}</dt><dd>{a.category[locale]}</dd>
              <dt>{d.languages}</dt><dd>ID · EN · 日本語</dd>
            </dl>
          </div>
          <div className="box">
            <h2>{d.about}</h2>
            <p>{a.about[locale]}</p>
          </div>
          <div className="box">
            <h2>{d.skills}</h2>
            <ul className="skills">
              {a.skills[locale].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </aside>

        <Chat slug={a.slug} locale={locale} name={a.name[locale]} starters={a.starters[locale]} />
      </div>

      <section className="others" aria-labelledby="others-h">
        <h2 id="others-h">{d.others}</h2>
        <StaffGrid locale={locale} exclude={a.slug} />
      </section>
    </div>
  );
}
