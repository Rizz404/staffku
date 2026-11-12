import Link from "next/link";
import type { Locale } from "@/lib/agents";
import { t } from "@/lib/i18n";

export default function Footer({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <strong>© {new Date().getFullYear()} {d.brand}</strong>
          <p>{d.footer}</p>
        </div>
        <nav aria-label="Footer">
          <Link href={`/${locale}/agents`}>{d.navStaff}</Link>
          <Link href={`/${locale}#faq`}>{d.navFaq}</Link>
          <Link href={`/${locale}/terms`}>{d.navTerms}</Link>
        </nav>
      </div>
    </footer>
  );
}
