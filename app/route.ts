// "/" has no content of its own: send visitors to their language. Relative Location keeps it proxy-safe.
export function GET(req: Request) {
  const al = (req.headers.get("accept-language") ?? "").toLowerCase();
  const first = al.split(",")[0] ?? "";
  const locale = first.startsWith("en") ? "en" : "id";
  return new Response(null, { status: 307, headers: { Location: `/${locale}`, Vary: "Accept-Language", "Cache-Control": "no-store" } });
}
