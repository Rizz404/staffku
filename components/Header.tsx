import Link from "next/link";
import type { Locale } from "@/lib/agents";
import { t } from "@/lib/i18n";
import { BrandBlob } from "./Avatar";
import LangSwitch from "./LangSwitch";

export default function Header({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href={`/${locale}`} className="brand" aria-label={d.brand}>
          <BrandBlob size={26} />
          {d.brand}
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href={`/${locale}/agents`} className="hide-sm">{d.navStaff}</Link>
          <Link href={`/${locale}#faq`} className="hide-sm">{d.navFaq}</Link>
          <LangSwitch locale={locale} />
          <Link href={`/${locale}/agents`} className="pill sm hide-sm">{d.start}</Link>
        </nav>
      </div>
    </header>
  );
}
