import type { Metadata } from "next";
import Link from "next/link";
import { db, hasDb } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { COURSE, SITE_URL } from "@/lib/config";
import { Logo } from "@/components/Logo";
import { AutoRefresh, type LiveEvent } from "./AutoRefresh";
import { LiveFeed } from "./LiveFeed";
import { InternalBadge, ResetButton } from "./AdminTools";
import { FollowUps, Students, type LeadRow } from "./LeadTables";

export const metadata: Metadata = { title: "Admin · incrementalvalue", robots: { index: false } };
export const dynamic = "force-dynamic";

const RANGES = { today: "Today", "7d": "7 days", "30d": "30 days", all: "All time" } as const;
type Range = keyof typeof RANGES;

const IST = 5.5 * 3600 * 1000;
function rangeStart(r: Range) {
  if (r === "all") return new Date(0).toISOString();
  if (r === "today") {
    const d = new Date(Date.now() + IST);
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() - IST).toISOString();
  }
  return new Date(Date.now() - (r === "7d" ? 7 : 30) * 864e5).toISOString();
}

const n = (v: unknown) => Number(v || 0);
const fmt = (v: number) => v.toLocaleString("en-IN");
const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "–");
const rupees = (paise: number) => "₹" + fmt(Math.round(paise / 100));
const time = (t: string) =>
  new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const SECTION_ORDER = ["hero", "problem", "different", "curriculum", "for", "about", "offer", "faq"];

function Login({ error }: { error: boolean }) {
  return (
    <main className="admin">
      <form className="login" method="post" action="/api/admin/login">
        <Logo />
        <h3>Admin login</h3>
        {!process.env.ADMIN_PASSWORD && <p className="form-error">Set ADMIN_PASSWORD in Vercel env first.</p>}
        {error && <p className="form-error">Wrong password.</p>}
        <div className="form">
          <input type="password" name="password" placeholder="Password" required autoFocus />
          <button className="btn btn-block">Log in</button>
        </div>
      </form>
    </main>
  );
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ r?: string; error?: string }> }) {
  const sp = await searchParams;
  if (!(await isAdmin())) return <Login error={Boolean(sp.error)} />;
  if (!hasDb())
    return (
      <main className="admin">
        <div className="login">Connect Neon: set DATABASE_URL and run db/schema.sql.</div>
      </main>
    );

  const range: Range = (sp.r as Range) in RANGES ? (sp.r as Range) : "7d";
  const from = rangeStart(range);
  const sql = db();

  let data;
  try {
    data = await Promise.all([
    sql`
      with s as (
        select session_id, min(ts) a, max(ts) b,
               count(*) filter (where name <> 'page_view') engaged,
               max((props->>'depth')::int) filter (where name = 'scroll') depth
          from events where ts >= ${from}::timestamptz group by session_id)
      select count(*)::int sessions, count(*) filter (where engaged = 0)::int bounced,
             coalesce(avg(coalesce(depth, 0)), 0)::float avg_depth,
             coalesce(avg(extract(epoch from b - a)), 0)::float avg_secs
        from s`,
    sql`select count(distinct visitor_id)::int v from events where ts >= ${from}::timestamptz`,
    sql`select name, count(distinct session_id)::int c from events
         where ts >= ${from}::timestamptz and name in ('page_view','cta_click','form_open','checkout_open','checkout_dismissed','payment_failed','payment_success')
         group by name`,
    sql`select count(*)::int leads,
               count(*) filter (where status = 'paid')::int paid,
               count(*) filter (where status = 'failed')::int failed,
               count(*) filter (where status <> 'paid' and created_at < now() - interval '30 minutes')::int abandoned,
               count(*) filter (where reminder_sent_at is not null)::int reminded,
               count(*) filter (where status = 'paid' and reminder_sent_at is not null)::int recovered,
               coalesce(sum(amount) filter (where status = 'paid'), 0)::bigint revenue
          from leads where created_at >= ${from}::timestamptz and not is_test`,
    sql`select props->>'id' id, count(distinct session_id)::int c from events
         where name = 'section_view' and ts >= ${from}::timestamptz group by 1`,
    sql`select coalesce(device, '?') device, count(distinct session_id)::int c from events
         where name = 'page_view' and ts >= ${from}::timestamptz group by 1 order by 2 desc`,
    sql`
      with s as (
        select session_id, max(utm_source) src, max(utm_campaign) camp, max(utm_content) ad
          from events where name = 'page_view' and ts >= ${from}::timestamptz group by session_id),
      a as (select coalesce(src, '(direct)') src, coalesce(camp, '–') camp, coalesce(ad, '–') ad, count(*)::int sessions from s group by 1, 2, 3),
      l as (select coalesce(utm_source, '(direct)') src, coalesce(utm_campaign, '–') camp, coalesce(utm_content, '–') ad,
                   count(*)::int leads, count(*) filter (where status = 'paid')::int paid,
                   coalesce(sum(amount) filter (where status = 'paid'), 0)::bigint rev
              from leads where created_at >= ${from}::timestamptz and not is_test group by 1, 2, 3)
      select coalesce(a.src, l.src) src, coalesce(a.camp, l.camp) camp, coalesce(a.ad, l.ad) ad,
             coalesce(a.sessions, 0) sessions, coalesce(l.leads, 0) leads, coalesce(l.paid, 0) paid, coalesce(l.rev, 0) rev
        from a full outer join l on a.src = l.src and a.camp = l.camp and a.ad = l.ad
       order by sessions desc, leads desc limit 50`,
    sql`
      with e as (select (ts at time zone 'Asia/Kolkata')::date d, count(distinct session_id)::int sessions
                   from events where name = 'page_view' and ts >= ${from}::timestamptz group by 1),
           l as (select (created_at at time zone 'Asia/Kolkata')::date d, count(*)::int leads,
                        count(*) filter (where status = 'paid')::int paid
                   from leads where created_at >= ${from}::timestamptz group by 1)
      select to_char(coalesce(e.d, l.d), 'DD Mon') as day, coalesce(e.sessions, 0) sessions,
             coalesce(l.leads, 0) leads, coalesce(l.paid, 0) paid
        from e full outer join l on e.d = l.d order by coalesce(e.d, l.d) desc limit 60`,
    sql`select * from leads where status <> 'paid' order by created_at desc limit 300`,
    sql`select * from leads where status = 'paid' order by paid_at`,
    sql`select id::text as id, ts, name, props, visitor_id, session_id, utm_source, device from events
          where ts > now() - interval '5 minutes' order by id desc limit 300`,
    ]);
  } catch (err) {
    console.error("admin queries failed", err);
    return (
      <main className="admin">
        <div className="login">
          <h3>Database not ready</h3>
          <AutoRefresh />
          <p>Tables are created automatically. Check that DATABASE_URL is set in Vercel and redeploy.</p>
          <p className="sub" style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>{String((err as Error).message).slice(0, 200)}</p>
        </div>
      </main>
    );
  }
  const [sess, visitors, steps, leadAgg, sections, devices, utmRows, daily, pending, students, activity] = data;
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  const toRows = (rows: typeof pending) =>
    rows.map((r) => ({ ...r, created_at: iso(r.created_at), paid_at: iso(r.paid_at), reminder_sent_at: iso(r.reminder_sent_at) })) as LeadRow[];

  const s = sess[0];
  const step = Object.fromEntries(steps.map((r) => [r.name, n(r.c)]));
  const L = leadAgg[0];
  const sessions = n(s.sessions);
  const secMap = Object.fromEntries(sections.map((r) => [r.id, n(r.c)]));

  const FUNNEL = [
    { l: "Landing page view", v: n(step.page_view) },
    { l: "CTA clicked", v: n(step.cta_click) },
    { l: "Form opened", v: n(step.form_open) },
    { l: "Form submitted", v: n(L.leads) },
    { l: "Checkout opened", v: n(step.checkout_open) },
    { l: "Paid", v: n(L.paid) },
  ];
  const top = Math.max(FUNNEL[0].v, 1);

  const KPIS = [
    { l: "Visitors", v: fmt(n(visitors[0].v)), s: `${fmt(sessions)} sessions` },
    { l: "Bounce rate", v: pct(n(s.bounced), sessions), s: `avg ${Math.round(n(s.avg_secs))}s on page` },
    { l: "Avg scroll", v: Math.round(n(s.avg_depth)) + "%", s: "of page" },
    { l: "Leads", v: fmt(n(L.leads)), s: `${pct(n(L.leads), sessions)} of sessions` },
    { l: "Enrolled", v: fmt(n(L.paid)), s: `${pct(n(L.paid), sessions)} conv. rate` },
    { l: "Revenue", v: rupees(n(L.revenue)), s: `${n(L.abandoned)} abandoned · ${n(L.recovered)} recovered` },
  ];

  return (
    <main className="admin">
      <div className="admin-top">
        <div className="wrap">
          <Logo />
          <form method="post" action="/api/admin/logout">
            <button className="btn btn-sm" style={{ background: "var(--ink)", boxShadow: "none" }}>
              Log out
            </button>
          </form>
        </div>
      </div>

      <div className="wrap admin-main">
        <div className="admin-bar">
          <nav className="admin-ranges">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <Link key={r} href={`/admin?r=${r}`} className={r === range ? "on" : ""}>
                {RANGES[r]}
              </Link>
            ))}
          </nav>
          <div className="admin-actions">
            <AutoRefresh lastId={activity[0]?.id ?? "0"} />
            <InternalBadge />
            <a className="btn btn-sm" href="/api/admin/export">
              Leads CSV
            </a>
            <a className="btn btn-sm" href="/api/admin/export?status=paid">
              Students CSV
            </a>
            <ResetButton />
          </div>
        </div>

        <section className="kpis">
          {KPIS.map((k) => (
            <div className="kpi" key={k.l}>
              <span>{k.l}</span>
              <b>{k.v}</b>
              <small>{k.s}</small>
            </div>
          ))}
        </section>

        <div className="panels-2">
          <section className="panel">
            <h3>Conversion funnel</h3>
            <p className="sub">Unique sessions at each step · % of landing page views</p>
            <div className="funnel">
              {FUNNEL.map((f, i) => (
                <div className="funnel-row" key={f.l} title={`${f.l}: ${fmt(f.v)} (${pct(f.v, FUNNEL[0].v)} of LPV)`}>
                  <span className="lbl">{f.l}</span>
                  <div className="bar-track">
                    <div className="bar" style={{ width: `${(f.v / top) * 100}%` }} />
                  </div>
                  <span className="val">
                    {fmt(f.v)}
                    <small>{i === 0 ? "100%" : pct(f.v, FUNNEL[0].v)}</small>
                  </span>
                </div>
              ))}
            </div>
            <p className="sub" style={{ marginTop: 14, marginBottom: 0 }}>
              Checkout closed without paying: {fmt(n(step.checkout_dismissed))} · Payment failed: {fmt(n(step.payment_failed))} · WhatsApp reminders sent:{" "}
              {fmt(n(L.reminded))}
            </p>
          </section>

          <section className="panel">
            <h3>How far people read</h3>
            <p className="sub">Sessions that reached each section · % of sessions</p>
            <div className="funnel">
              {SECTION_ORDER.map((id) => {
                const v = n(secMap[id]);
                return (
                  <div className="funnel-row" key={id} title={`${id}: ${fmt(v)} sessions`}>
                    <span className="lbl" style={{ textTransform: "capitalize" }}>
                      {id === "for" ? "Who it's for" : id}
                    </span>
                    <div className="bar-track">
                      <div className="bar" style={{ width: `${sessions ? (v / sessions) * 100 : 0}%` }} />
                    </div>
                    <span className="val">
                      {fmt(v)}
                      <small>{pct(v, sessions)}</small>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="sub" style={{ marginTop: 14, marginBottom: 0 }}>
              Devices: {devices.map((d) => `${d.device} ${pct(n(d.c), sessions)}`).join(" · ") || "–"}
            </p>
          </section>
        </div>

        <section className="panel">
          <h3>By source / campaign / ad</h3>
          <p className="sub">From UTM tags. Use utm_source, utm_campaign and utm_content (ad name) in your Meta ad URLs.</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Campaign</th>
                  <th>Ad</th>
                  <th className="num">Sessions</th>
                  <th className="num">Leads</th>
                  <th className="num">Paid</th>
                  <th className="num">Conv.</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {utmRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.src}</td>
                    <td>{r.camp}</td>
                    <td>{r.ad}</td>
                    <td className="num">{fmt(n(r.sessions))}</td>
                    <td className="num">{fmt(n(r.leads))}</td>
                    <td className="num">{fmt(n(r.paid))}</td>
                    <td className="num">{pct(n(r.paid), n(r.sessions))}</td>
                    <td className="num">{rupees(n(r.rev))}</td>
                  </tr>
                ))}
                {!utmRows.length && (
                  <tr>
                    <td colSpan={8}>No data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="panels-2">
          <section className="panel">
            <h3>Day by day</h3>
            <p className="sub">IST</p>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th className="num">Sessions</th>
                    <th className="num">Leads</th>
                    <th className="num">Paid</th>
                    <th className="num">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td className="num">{fmt(n(d.sessions))}</td>
                      <td className="num">{fmt(n(d.leads))}</td>
                      <td className="num">{fmt(n(d.paid))}</td>
                      <td className="num">{pct(n(d.paid), n(d.sessions))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h3>Live activity</h3>
            <p className="sub">Last 5 minutes only · new events appear within ~2 seconds</p>
            <LiveFeed initial={activity.map((a) => ({ ...a, ts: new Date(a.ts).toISOString() })) as LiveEvent[]} />
          </section>
        </div>

        <section className="panel">
          <h3>Follow-ups: filled the form, not paid ({fmt(pending.length)})</h3>
          <p className="sub">
            One automatic WhatsApp reminder goes 30 min after the form. After that, follow up personally: the WhatsApp button opens your own
            WhatsApp with the message typed. Tick opt-out if someone asks not to be messaged.
          </p>
          <FollowUps rows={toRows(pending)} siteUrl={SITE_URL} batchStart={COURSE.batchStart} />
        </section>

        <section className="panel">
          <h3>Enrolled students</h3>
          <p className="sub">Mark class 1 attendance: refunds are only for students who attended class 1 and asked within 24 hours.</p>
          <Students rows={toRows(students)} />
        </section>
      </div>
    </main>
  );
}
