"use client";

import Link from "next/link";
import { useState } from "react";

type Item = { slug: string; name: string; color: string; q: string; a: string };

export default function JobTabs({
  items,
  locale,
  labels,
}: {
  items: Item[];
  locale: string;
  labels: { example: string; tryWith: string[] };
}) {
  const [i, setI] = useState(0);
  const cur = items[i];
  return (
    <div className="jobs">
      <div className="chips" role="tablist" aria-label="Staff">
        {items.map((it, n) => (
          <button
            key={it.slug}
            role="tab"
            id={`tab-${it.slug}`}
            aria-selected={n === i}
            aria-controls="job-panel"
            className={`chip${n === i ? " on" : ""}`}
            onClick={() => setI(n)}
          >
            {it.name}
          </button>
        ))}
      </div>
      <div className="job-card" role="tabpanel" id="job-panel" aria-labelledby={`tab-${cur.slug}`} style={{ "--c": cur.color } as React.CSSProperties}>
        <div className="job-label">{labels.example}</div>
        <div className="mock-q">{cur.q}</div>
        <div className="mock-a">
          <b style={{ color: cur.color }}>{cur.name}</b>
          {cur.a}
        </div>
        <Link href={`/${locale}/agents/${cur.slug}`} className="pill ghost" style={{ justifySelf: "start" }}>
          {labels.tryWith[i]} →
        </Link>
      </div>
    </div>
  );
}
