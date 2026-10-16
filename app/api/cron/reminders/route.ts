import { NextResponse } from "next/server";
import { db, hasDb } from "@/lib/db";
import { sendWhatsApp } from "@/lib/aisensy";
import { SITE_URL } from "@/lib/config";

// Sends one WhatsApp reminder to people who filled the form but didn't pay within 30 minutes.
// Call every 10–15 min from cron-job.org (or Vercel Pro cron) with header `Authorization: Bearer <CRON_SECRET>`
// or `?key=<CRON_SECRET>`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const key = new URL(req.url).searchParams.get("key");
  const auth = req.headers.get("authorization");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasDb()) return NextResponse.json({ sent: 0 });

  const sql = db();
  const due = (await sql`
    select id, name, phone from leads
     where status <> 'paid' and reminder_sent_at is null
       and created_at < now() - interval '30 minutes'
       and created_at > now() - interval '48 hours'
       and not exists (select 1 from leads l2 where l2.phone = leads.phone and l2.status = 'paid')
     order by created_at limit 50`) as { id: string; name: string; phone: string }[];

  let sent = 0;
  for (const l of due) {
    const link = `${SITE_URL}/?utm_source=whatsapp&utm_medium=reminder&utm_campaign=abandoned#enroll`;
    const ok = await sendWhatsApp({
      campaign: process.env.AISENSY_REMINDER_CAMPAIGN,
      phone: l.phone,
      name: l.name,
      params: [l.name.split(" ")[0], link],
    });
    if (ok) {
      sent++;
      await sql`update leads set reminder_sent_at = now() where id = ${l.id}`;
    }
  }
  return NextResponse.json({ due: due.length, sent });
}
