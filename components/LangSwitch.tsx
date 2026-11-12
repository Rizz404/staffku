"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/agents";

export default function LangSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(/^\/(id|en)(?=\/|$)/, "");
  return (
    <div className="lang" role="group" aria-label="Language">
      {(["id", "en"] as const).map((l) => (
        <Link key={l} href={`/${l}${rest}`} aria-current={l === locale} hrefLang={l}>
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
