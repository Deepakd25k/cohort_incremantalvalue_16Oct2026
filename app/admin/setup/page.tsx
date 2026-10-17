import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db, hasDb } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { SITE_URL } from "@/lib/config";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Setup check · incrementalvalue", robots: { index: false } };
export const dynamic = "force-dynamic";

type Status = "ok" | "warn" | "fail" | "skip";
type Check = { group: string; name: string; status: Status; detail: string };

const env = (k: string) => (process.env[k] || "").trim();
const timeout = () => AbortSignal.timeout(6000);
const ago = (t: string | Date) => {
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  return m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

async function runChecks(): Promise<Check[]> {
  const c: Check[] = [];
  const add = (group: string, name: string, status: Status, detail: string) => c.push({ group, name, status, detail });

  // Site
  const site = env("NEXT_PUBLIC_SITE_URL");
  if (!site) add("Site", "NEXT_PUBLIC_SITE_URL", "fail", "Not set. Share previews and reminder links will be wrong.");
  else if (!SITE_URL.startsWith("https://") || SITE_URL.includes("localhost"))
    add("Site", "NEXT_PUBLIC_SITE_URL", "fail", `Resolves to ${SITE_URL}. Use https://cohort.incrementalvalue.in`);
  else add("Site", "NEXT_PUBLIC_SITE_URL", "ok", SITE_URL);

  add("Site", "ADMIN_PASSWORD", env("ADMIN_PASSWORD").length >= 8 ? "ok" : "warn", env("ADMIN_PASSWORD").length >= 8 ? "Set" : "Set, but shorter than 8 characters");

  const cron = env("CRON_SECRET");
  if (!cron) add("Site", "CRON_SECRET", "fail", "Not set. Reminders and the daily summary cannot run.");
  else if (!/^[A-Za-z0-9_-]{16,}$/.test(cron)) add("Site", "CRON_SECRET", "warn", "Use 16+ letters/numbers only (it goes in a URL).");
  else add("Site", "CRON_SECRET", "ok", `Set (${cron.length} chars)`);

  // Database + last-seen log
  let kv: Record<string, { v: string; t: string }> = {};
  if (!hasDb()) add("Database", "DATABASE_URL", "fail", "Not set. Connect Neon to this Vercel project.");
  else {
    try {
      const sql = db();
      const [[e], [l], rows] = await Promise.all([
        sql`select count(*)::int n from events`,
        sql`select count(*)::int n, count(*) filter (where status = 'paid' and not is_test)::int paid from leads`,
        sql`select k, v, updated_at from kv`,
      ]);
      kv = Object.fromEntries(rows.map((r) => [r.k, { v: r.v, t: r.updated_at }]));
      add("Database", "Neon connection", "ok", `Tables ready · ${e.n} events · ${l.n} leads · ${l.paid} paid`);
    } catch (err) {
      add("Database", "Neon connection", "fail", String((err as Error).message).slice(0, 160));
    }
  }

  // Razorpay
  const kid = env("RAZORPAY_KEY_ID");
  const ksec = env("RAZORPAY_KEY_SECRET");
  if (!kid || !ksec) add("Razorpay", "API keys", "fail", `Missing ${!kid ? "RAZORPAY_KEY_ID " : ""}${!ksec ? "RAZORPAY_KEY_SECRET" : ""}`);
  else {
    const mode = kid.startsWith("rzp_live_") ? "LIVE" : kid.startsWith("rzp_test_") ? "TEST" : "UNKNOWN";
    try {
      const r = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        headers: { Authorization: "Basic " + Buffer.from(`${kid}:${ksec}`).toString("base64") },
        signal: timeout(),
      });
      if (r.ok) add("Razorpay", "API keys", mode === "LIVE" ? "ok" : "warn", mode === "LIVE" ? "Valid · LIVE mode" : `Valid · ${mode} mode (switch to live keys before launch)`);
      else add("Razorpay", "API keys", "fail", r.status === 401 ? "Rejected by Razorpay: Key ID and Secret don't match" : `Razorpay returned ${r.status}`);
    } catch {
      add("Razorpay", "API keys", "warn", "Could not reach Razorpay to verify (timeout)");
    }
  }
  add("Razorpay", "RAZORPAY_WEBHOOK_SECRET", env("RAZORPAY_WEBHOOK_SECRET") ? "ok" : "fail", env("RAZORPAY_WEBHOOK_SECRET") ? "Set" : "Not set. Webhook calls will be rejected.");
  if (kv.razorpay_webhook_bad_signature)
    add("Razorpay", "Webhook signature", "fail", `A webhook was rejected ${ago(kv.razorpay_webhook_bad_signature.t)}: secret in Razorpay ≠ RAZORPAY_WEBHOOK_SECRET`);
  if (kv.razorpay_webhook_last) add("Razorpay", "Webhook received", "ok", `Last: ${kv.razorpay_webhook_last.v}, ${ago(kv.razorpay_webhook_last.t)}`);
  else add("Razorpay", "Webhook received", "skip", "None yet. Will show after your first test payment.");

  // Meta
  const pixel = env("NEXT_PUBLIC_META_PIXEL_ID");
  const capi = env("META_CAPI_TOKEN");
  if (!pixel) add("Meta", "NEXT_PUBLIC_META_PIXEL_ID", "fail", "Not set. No Pixel on the page.");
  else if (!/^\d{10,20}$/.test(pixel)) add("Meta", "NEXT_PUBLIC_META_PIXEL_ID", "fail", "Should be digits only (the Dataset/Pixel ID).");
  else add("Meta", "NEXT_PUBLIC_META_PIXEL_ID", "ok", `Pixel ${pixel}`);
  if (!capi) add("Meta", "META_CAPI_TOKEN", "fail", "Not set. Server-side events (Lead, Purchase) won't reach Meta.");
  else if (pixel) {
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}?fields=name&access_token=${encodeURIComponent(capi)}`, { signal: timeout() });
      const j = await r.json().catch(() => ({}));
      if (r.ok) add("Meta", "META_CAPI_TOKEN", "ok", `Valid for pixel "${j.name || pixel}"`);
      else add("Meta", "META_CAPI_TOKEN", "fail", `Meta rejected it: ${String(j?.error?.message || r.status).slice(0, 140)}`);
    } catch {
      add("Meta", "META_CAPI_TOKEN", "warn", "Could not reach Meta to verify (timeout)");
    }
  }
  if (env("META_TEST_EVENT_CODE")) add("Meta", "META_TEST_EVENT_CODE", "warn", "Set. Good for testing. Delete it before launch, or real events go to Test Events only.");

  // GA4
  const ga = env("NEXT_PUBLIC_GA4_ID");
  if (!ga) add("GA4", "NEXT_PUBLIC_GA4_ID", "skip", "Not set (optional)");
  else add("GA4", "NEXT_PUBLIC_GA4_ID", /^G-[A-Z0-9]{6,}$/.test(ga) ? "ok" : "fail", /^G-[A-Z0-9]{6,}$/.test(ga) ? ga : "Should look like G-XXXXXXXXXX");

  // WhatsApp group + cron
  const grp = env("WHATSAPP_GROUP_LINK");
  if (!grp) add("WhatsApp", "WHATSAPP_GROUP_LINK", "fail", "Not set. Paid students won't see the group link.");
  else add("WhatsApp", "WHATSAPP_GROUP_LINK", grp.startsWith("https://chat.whatsapp.com/") ? "ok" : "warn", grp.startsWith("https://chat.whatsapp.com/") ? "Looks like a valid invite link" : "Expected https://chat.whatsapp.com/…");

  const aisensy = ["AISENSY_API_KEY", "AISENSY_CONFIRM_CAMPAIGN", "AISENSY_REMINDER_CAMPAIGN", "AISENSY_OWNER_SALE_CAMPAIGN", "AISENSY_OWNER_SUMMARY_CAMPAIGN", "OWNER_WHATSAPP"];
  const missing = aisensy.filter((k) => !env(k));
  add("WhatsApp", "AiSensy", missing.length ? "skip" : "ok", missing.length ? `Pending: ${missing.join(", ")}` : "All set");
  const owner = env("OWNER_WHATSAPP");
  if (owner && !/^91[6-9]\d{9}$/.test(owner)) add("WhatsApp", "OWNER_WHATSAPP", "fail", "Use 91 + 10 digits, no + or spaces (e.g. 919876543210)");

  add("Cron", "Reminders (cron-job.org, every 10 min)", kv.cron_reminders_last ? (Date.now() - new Date(kv.cron_reminders_last.t).getTime() < 30 * 60e3 ? "ok" : "warn") : "skip",
    kv.cron_reminders_last ? `Last run ${ago(kv.cron_reminders_last.t)}` : "Never called yet");
  add("Cron", "Daily summary (Vercel cron, 08:45 IST)", kv.cron_summary_last ? "ok" : "skip", kv.cron_summary_last ? `Last run ${ago(kv.cron_summary_last.t)}` : "Runs tomorrow morning");

  return c;
}

const ICON: Record<Status, string> = { ok: "✅", warn: "⚠️", fail: "❌", skip: "⏳" };

export default async function Setup() {
  if (!(await isAdmin())) redirect("/admin");
  const checks = await runChecks();
  const count = (s: Status) => checks.filter((c) => c.status === s).length;
  const groups = [...new Set(checks.map((c) => c.group))];

  return (
    <main className="admin">
      <div className="admin-top">
        <div className="wrap">
          <Logo />
          <Link className="btn btn-sm" href="/admin">
            ← Dashboard
          </Link>
        </div>
      </div>
      <div className="wrap admin-main">
        <section className="panel">
          <h3>Setup check</h3>
          <p className="sub">
            Live test of every setting, run on the server right now. Secret values are never shown. {ICON.ok} {count("ok")} ok · {ICON.warn} {count("warn")}{" "}
            warnings · {ICON.fail} {count("fail")} to fix · {ICON.skip} {count("skip")} pending
          </p>
          {groups.map((g) => (
            <div key={g} className="setup-group">
              <p className="mono setup-g">{g.toUpperCase()}</p>
              {checks
                .filter((c) => c.group === g)
                .map((c) => (
                  <div className={`setup-row setup-${c.status}`} key={c.name}>
                    <span className="setup-ic">{ICON[c.status]}</span>
                    <b>{c.name}</b>
                    <span className="setup-d">{c.detail}</span>
                  </div>
                ))}
            </div>
          ))}
          <p className="sub" style={{ marginTop: 14, marginBottom: 0 }}>
            Changed an env var in Vercel? Redeploy first, then reload this page.
          </p>
        </section>
      </div>
    </main>
  );
}
