import Link from "next/link";
import { notFound } from "next/navigation";
import AppMock from "@/components/AppMock";
import { BrandBlob } from "@/components/Avatar";
import HeroSceneLoader from "@/components/HeroSceneLoader";
import JobTabs from "@/components/JobTabs";
import { AGENTS, isLocale } from "@/lib/agents";
import { t } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);

  const jobItems = AGENTS.map((a) => ({
    slug: a.slug,
    name: a.name[locale],
    color: a.color,
    q: a.sample[locale].q,
    a: a.sample[locale].a,
  }));

  return (
    <div className="wrap">
      <section className="hero">
        <Link href={`/${locale}/agents`} className="announce">
          <b>{d.announce}</b> <span>· {d.announceCta}</span> <i aria-hidden="true">↗</i>
        </Link>
        <h1>
          {d.heroMeet} <BrandBlob size={64} /> {d.brand}
        </h1>
        <p className="sub">{d.heroSub}</p>
        <div className="cta">
          <Link href={`/${locale}/agents`} className="pill">{d.start}</Link>
          <Link href={`/${locale}/agents`} className="pill ghost">{d.seeAll}</Link>
        </div>
        <AppMock locale={locale} />
      </section>

      <section className="panel-card split" aria-labelledby="deleg-h">
        <div>
          <h2 id="deleg-h">{d.deleg}</h2>
          <p>{d.delegSub}</p>
        </div>
        <HeroSceneLoader />
      </section>

      <section className="section" aria-labelledby="feat-h">
        <h2 className="center" id="feat-h">{d.featuresTitle}</h2>
        <div className="features">
          {d.features.map((f) => (
            <div className="feature" key={f.t}>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="jobs-h">
        <h2 className="center" id="jobs-h">{d.jobsTitle}</h2>
        <JobTabs
          items={jobItems}
          locale={locale}
          labels={{ example: d.jobExample, tryWith: AGENTS.map((a) => d.jobTry(a.name[locale])) }}
        />
      </section>

      <section className="section narrow" id="faq" aria-labelledby="faq-h">
        <h2 className="center" id="faq-h">{d.faqTitle}</h2>
        <div className="faq">
          {d.faq.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final">
        <h2>{d.ctaTitle}</h2>
        <div className="cta">
          <Link href={`/${locale}/agents`} className="pill">{d.start}</Link>
        </div>
      </section>
    </div>
  );
}
