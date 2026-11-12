import { getAgent, isLocale } from "@/lib/agents";
import { acquireSlot, clientIp, rateLimited } from "@/lib/guard";
import { createThinkStripper } from "@/lib/think";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY = 12;
const MAX_CHARS = 4000;
const TIMEOUT_MS = 120_000;

const json = (error: string, status: number) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

type Msg = { role: "user" | "assistant"; content: string };

function parseBody(body: unknown): { slug: string; locale: "id" | "en"; messages: Msg[] } | null {
  if (!body || typeof body !== "object") return null;
  const { slug, locale, messages } = body as Record<string, unknown>;
  if (typeof slug !== "string" || typeof locale !== "string" || !isLocale(locale)) return null;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_HISTORY) return null;
  const clean: Msg[] = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (!content.trim() || content.length > MAX_CHARS) return null;
    clean.push({ role, content });
  }
  if (clean[clean.length - 1].role !== "user") return null;
  return { slug, locale, messages: clean };
}

let cachedModel: string | undefined;
async function resolveModel(base: string, key: string): Promise<string | null> {
  if (process.env.LLM_MODEL) return process.env.LLM_MODEL;
  if (cachedModel) return cachedModel;
  try {
    const r = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { data?: { id: string }[] };
    // Skip embedding models, LM Studio lists them next to chat models.
    const chat = data.data?.find((m) => !/embed/i.test(m.id));
    cachedModel = chat?.id;
    return cachedModel ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const base = (process.env.LLM_BASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.LLM_API_KEY ?? "";
  if (!base || !key) return json("llm_not_configured", 503);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json("bad_request", 400);
  }
  const input = parseBody(body);
  if (!input) return json("bad_request", 400);

  const agent = getAgent(input.slug);
  if (!agent) return json("not_found", 404);

  if (rateLimited(clientIp(req))) return json("rate_limited", 429);
  const release = acquireSlot();
  if (!release) return json("busy", 503);

  const abort = new AbortController();
  const onClientAbort = () => abort.abort();
  req.signal.addEventListener("abort", onClientAbort);
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  const cleanup = () => {
    clearTimeout(timer);
    req.signal.removeEventListener("abort", onClientAbort);
    release();
  };

  let upstream: Response;
  try {
    const model = await resolveModel(base, key);
    if (!model) {
      cleanup();
      return json("llm_unavailable", 503);
    }
    const langName = input.locale === "id" ? "Bahasa Indonesia" : "English";
    const system =
      `${agent.systemPrompt}\n\nRespond in ${langName} unless the user writes in another language (for translation tasks follow the user's request).` +
      "\nThis is a public demo: refuse requests that are harmful or illegal.";

    upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: Number(process.env.LLM_TEMPERATURE) || 0.6,
        max_tokens: Number(process.env.LLM_MAX_TOKENS) || 700,
        // Reasoning models (e.g. Qwen3) otherwise spend the whole token budget on hidden thinking.
        ...(process.env.LLM_REASONING_EFFORT ? { reasoning_effort: process.env.LLM_REASONING_EFFORT } : {}),
        messages: [{ role: "system", content: system }, ...input.messages],
      }),
      signal: abort.signal,
    });
  } catch {
    cleanup();
    return json("llm_unavailable", 503);
  }

  if (!upstream.ok || !upstream.body) {
    // 401/403 from the LLM means our token is wrong: report as not configured, never leak details.
    const code = upstream.status === 401 || upstream.status === 403 ? "llm_not_configured" : "llm_unavailable";
    cleanup();
    return json(code, 503);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const strip = createThinkStripper();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buf = "";
      const emit = (s: string) => s && controller.enqueue(encoder.encode(s));
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              emit(strip.end());
              controller.close();
              return;
            }
            try {
              const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta) emit(strip.push(delta));
            } catch {
              /* ignore malformed keep-alive lines */
            }
          }
        }
        emit(strip.end());
        controller.close();
      } catch {
        // Aborted by client or upstream died mid-way: close what we have.
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      } finally {
        cleanup();
      }
    },
    cancel() {
      abort.abort();
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
