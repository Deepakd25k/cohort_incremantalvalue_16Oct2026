import { db, hasDb } from "@/lib/db";
import { clip } from "@/lib/request";
import { isBot } from "@/lib/bots";

const ALLOWED = new Set([
  "page_view",
  "scroll",
  "section_view",
  "cta_click",
  "form_open",
  "form_error",
  "checkout_open",
  "checkout_dismissed",
  "payment_failed",
  "payment_success",
  "faq_open",
]);

type Ev = { v: string; s: string; n: string; p?: Record<string, unknown>; path?: string; ref?: string; d?: string; u?: Record<string, string> };

export async function POST(req: Request) {
  if (!hasDb() || isBot(req.headers.get("user-agent"))) return new Response(null, { status: 204 });
  let body: Ev | Ev[];
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const events = (Array.isArray(body) ? body : [body]).slice(0, 20).filter((e) => e && ALLOWED.has(e.n) && e.v && e.s);
  const sql = db();
  for (const e of events) {
    const u = e.u || {};
    await sql`
      insert into events (visitor_id, session_id, name, props, path, referrer, device,
                          utm_source, utm_medium, utm_campaign, utm_content, utm_term)
      values (${clip(e.v, 64)}, ${clip(e.s, 64)}, ${e.n}, ${JSON.stringify(e.p || {}).slice(0, 2000)}::jsonb,
              ${clip(e.path)}, ${clip(e.ref, 500)}, ${clip(e.d, 20)},
              ${clip(u.utm_source)}, ${clip(u.utm_medium)}, ${clip(u.utm_campaign)}, ${clip(u.utm_content)}, ${clip(u.utm_term)})`;
  }
  return new Response(null, { status: 204 });
}
