import { NextResponse } from "next/server";
import { db, hasDb, mark } from "@/lib/db";
import { sendToOwner } from "@/lib/aisensy";
import { COURSE } from "@/lib/config";

export const dynamic = "force-dynamic";

// Yesterday's numbers (IST) to the owner's WhatsApp. Vercel cron calls this daily at 08:45 IST.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const key = new URL(req.url).searchParams.get("key");
  const auth = req.headers.get("authorization");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await mark("cron_summary_last", new Date().toISOString());
  if (!hasDb()) return NextResponse.json({ sent: false });

  const sql = db();
  const [[e], [l], [total], top] = await Promise.all([
    sql`select count(distinct visitor_id)::int visitors, count(distinct session_id)::int sessions
          from events where (ts at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date - 1`,
    sql`select count(*) filter (where (created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date - 1)::int leads,
               count(*) filter (where status = 'paid' and (paid_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date - 1)::int paid,
               coalesce(sum(amount) filter (where status = 'paid' and (paid_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date - 1), 0)::bigint rev
          from leads where not is_test`,
    sql`select count(*)::int n from leads where status = 'paid' and not is_test`,
    sql`select coalesce(utm_campaign, utm_source, 'direct') src, count(*)::int n from leads
          where status = 'paid' and not is_test
            and (paid_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date - 1
          group by 1 order by 2 desc limit 1`,
  ]);

  const date = new Date(Date.now() + 5.5 * 3600e3 - 864e5).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const conv = e.sessions ? ((l.paid / e.sessions) * 100).toFixed(1) + "%" : "–";
  const params = [
    date,
    String(e.visitors),
    String(e.sessions),
    String(l.leads),
    String(l.paid),
    "₹" + Math.round(Number(l.rev) / 100).toLocaleString("en-IN"),
    conv,
    `${total.n}/${COURSE.seats}`,
    top[0] ? `${top[0].src} (${top[0].n})` : "–",
  ];
  const sent = await sendToOwner(process.env.AISENSY_OWNER_SUMMARY_CAMPAIGN, params);
  return NextResponse.json({ sent, params });
}
