import Link from "next/link";
import { AGENTS, type Locale } from "@/lib/agents";
import Avatar from "./Avatar";

export default function StaffGrid({ locale, exclude }: { locale: Locale; exclude?: string }) {
  return (
    <div className="grid">
      {AGENTS.filter((a) => a.slug !== exclude).map((a) => (
        <Link key={a.slug} href={`/${locale}/agents/${a.slug}`} className="staff-card" style={{ "--c": a.color } as React.CSSProperties}>
          <Avatar agent={a} size={52} />
          <div className="cat">{a.category[locale]}</div>
          <h3>{a.name[locale]}</h3>
          <p className="tag">{a.tagline[locale]}</p>
          <span className="arrow" aria-hidden="true">↗</span>
        </Link>
      ))}
    </div>
  );
}
