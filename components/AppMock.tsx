import Link from "next/link";
import { AGENTS, type Locale } from "@/lib/agents";
import { t } from "@/lib/i18n";
import Avatar from "./Avatar";

/** Static preview of the chat app: staff list on the left, a sample conversation on the right. */
export default function AppMock({ locale }: { locale: Locale }) {
  const d = t(locale);
  const active = AGENTS[0];
  const s = active.sample[locale];
  return (
    <div className="mock" role="img" aria-label={`${active.name[locale]}: ${s.q}`}>
      <div className="mock-bar" aria-hidden="true">
        <i style={{ background: "#ff5f57" }} />
        <i style={{ background: "#febc2e" }} />
        <i style={{ background: "#28c840" }} />
      </div>
      <div className="mock-body">
        <aside className="mock-side">
          <div className="mock-search">⌕ {d.mockSearch}</div>
          <ul>
            {AGENTS.map((a, i) => (
              <li key={a.slug}>
                <Link href={`/${locale}/agents/${a.slug}`} className={i === 0 ? "on" : ""} tabIndex={-1}>
                  <Avatar agent={a} size={38} />
                  <span>
                    <b>{a.name[locale]}</b>
                    <small>{a.tagline[locale]}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div className="mock-main">
          <div className="mock-head">
            <Avatar agent={active} size={26} />
            {active.name[locale]}
          </div>
          <div className="mock-chat">
            <div className="mock-q">{s.q}</div>
            <div className="mock-a">
              <b>{active.name[locale]}</b>
              {s.a}
            </div>
          </div>
          <div className="mock-compose">{d.mockPlaceholder}</div>
        </div>
      </div>
    </div>
  );
}
