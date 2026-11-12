// In-memory abuse guard. Fine for a single Node process (our deployment); swap for Redis if we ever scale out.

const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();
let running = 0;

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export function rateLimited(ip: string): boolean {
  const limit = num(process.env.RATE_LIMIT_PER_10MIN, 12);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

/** Returns a release function, or null when the server is already at capacity. */
export function acquireSlot(): (() => void) | null {
  if (running >= num(process.env.MAX_CONCURRENT, 3)) return null;
  running++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      running--;
    }
  };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
