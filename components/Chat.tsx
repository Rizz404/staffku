"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/agents";
import { t } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

const MAX_CHARS = 4000;

export default function Chat({
  slug,
  locale,
  name,
  starters,
}: {
  slug: string;
  locale: Locale;
  name: string;
  starters: string[];
}) {
  const d = t(locale);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const errText = (code?: string) =>
    code === "rate_limited" ? d.errRate
    : code === "busy" ? d.errBusy
    : code === "llm_not_configured" ? d.errConfig
    : code === "llm_unavailable" ? d.errDown
    : d.errGeneric;

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || busy) return;
    // Drop earlier error bubbles; they are UI only and must not be sent to the model.
    const history: Msg[] = [...msgs.filter((m) => !m.error), { role: "user", content }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const fail = (code?: string) =>
      setMsgs([...history, { role: "assistant", content: errText(code), error: true }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, locale, messages: history.slice(-12).map(({ role, content }) => ({ role, content })) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const code = (await res.json().catch(() => null))?.error as string | undefined;
        fail(code);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) fail("llm_unavailable");
    } catch (e) {
      if ((e as Error).name !== "AbortError") fail();
      else setMsgs((m) => (m.length && m[m.length - 1].content === "" ? m.slice(0, -1) : m));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  const last = msgs.length - 1;

  return (
    <div className="chat-wrap">
      <section className="chat" aria-label={name}>
        <div className="chat-bar">
          <span className="dot" aria-hidden />
          <strong>{name}</strong>
          <span className="muted">/ {d.tryLive}</span>
          <span className="spacer" />
          {msgs.length > 0 && (
            <button className="linkbtn" onClick={() => { abortRef.current?.abort(); setMsgs([]); }}>
              {d.reset}
            </button>
          )}
        </div>

        <div className="chat-log" ref={logRef} aria-live="polite">
          {msgs.length === 0 ? (
            <div className="chat-empty">
              <h3>{d.startHint}</h3>
              <div className="starters">
                {starters.map((s) => (
                  <button key={s} className="starter" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            msgs.map((m, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className={`msg ${m.error ? "error" : m.role}${busy && i === last && m.role === "assistant" ? " caret" : ""}`}>
                  {m.content}
                </div>
                {m.role === "assistant" && !m.error && m.content && !(busy && i === last) && (
                  <div className="msg-actions">
                    <button className="linkbtn" onClick={() => copy(i, m.content)}>
                      {copied === i ? d.copied : d.copy}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form
          className="composer"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <textarea
            value={input}
            maxLength={MAX_CHARS}
            rows={1}
            placeholder={d.placeholder}
            aria-label={d.placeholder}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          {busy ? (
            <button type="button" className="pill ghost" onClick={() => abortRef.current?.abort()}>{d.stop}</button>
          ) : (
            <button type="submit" className="pill" disabled={!input.trim()}>{d.send}</button>
          )}
        </form>
      </section>
      <p className="demo-note">{d.demoNote}</p>
    </div>
  );
}
