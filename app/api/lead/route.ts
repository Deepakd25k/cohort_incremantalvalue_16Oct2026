import crypto from "crypto";
import { after, NextResponse } from "next/server";
import { db, hasDb } from "@/lib/db";
import { createOrder } from "@/lib/razorpay";
import { sendCapi } from "@/lib/meta";
import { COURSE } from "@/lib/config";
import { clientIp, clip, normalisePhone } from "@/lib/request";

const PROFILES = ["Working marketer", "Freelancer / Agency", "Fresher / Job seeker", "Founder"];

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "Enrollment is not open yet." }, { status: 503 });

  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 80)?.trim();
  const email = clip(b.email, 120)?.trim().toLowerCase();
  const phone = normalisePhone(b.phone || "");
  const profile = PROFILES.includes(b.profile) ? b.profile : null;

  if (!name || name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Please enter a valid 10-digit WhatsApp number." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  const sql = db();

  const [{ paid }] = (await sql`select count(*)::int as paid from leads where status = 'paid'`) as { paid: number }[];
  if (paid >= COURSE.seats) return NextResponse.json({ error: "This batch is full." }, { status: 409 });

  const u = b.utm || {};
  // Reuse an unpaid lead for the same number so reminders and reports don't double count.
  const existing = (await sql`
    select id, status from leads where phone = ${phone} order by created_at desc limit 1`) as { id: string; status: string }[];
  if (existing[0]?.status === "paid")
    return NextResponse.json({ error: "You are already enrolled. Check WhatsApp for details." }, { status: 409 });

  const isTest = b.test === true;
  const repeat = Boolean(existing[0]);
  const id = existing[0]?.id || crypto.randomUUID();
  const amount = COURSE.price * 100;
  const visitorId = clip(b.visitorId, 64);
  const sessionId = clip(b.sessionId, 64);

  // 1. Save the lead first, so it is never lost even if Razorpay fails.
  await sql`
    insert into leads (id, name, phone, email, profile, status, amount, visitor_id, session_id,
                       fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content, utm_term, is_test)
    values (${id}, ${name}, ${phone}, ${email}, ${profile}, 'lead', ${amount}, ${visitorId}, ${sessionId},
            ${clip(b.fbp)}, ${clip(b.fbc)},
            ${clip(u.utm_source)}, ${clip(u.utm_medium)}, ${clip(u.utm_campaign)}, ${clip(u.utm_content)}, ${clip(u.utm_term)}, ${isTest})
    on conflict (id) do update set
      name = excluded.name, email = excluded.email, profile = excluded.profile,
      status = case when leads.status = 'paid' then 'paid' else 'lead' end,
      updated_at = now(), is_test = excluded.is_test, submit_count = leads.submit_count + 1,
      fbp = coalesce(excluded.fbp, leads.fbp), fbc = coalesce(excluded.fbc, leads.fbc)`;

  // Shows up instantly in /admin Live activity (also for your own test browser).
  if (visitorId && sessionId)
    await sql`insert into events (visitor_id, session_id, name, props, path, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
              values (${visitorId}, ${sessionId}, 'lead_submit', ${JSON.stringify({ lead: id.slice(0, 8), test: isTest, repeat })}::jsonb, '/',
                      ${clip(u.utm_source)}, ${clip(u.utm_medium)}, ${clip(u.utm_campaign)}, ${clip(u.utm_content)}, ${clip(u.utm_term)})`;

  // 2. Meta CAPI: a fresh event_id per submission so Meta never drops a repeat as a duplicate.
  //    Test leads are sent only while META_TEST_EVENT_CODE is set (they land in Test Events, not in ads data).
  const submitId = crypto.randomUUID().slice(0, 12);
  const eventIds = { lead: `lead_${id}_${submitId}`, checkout: `ic_${id}_${submitId}` };
  const ctx = { email, phone, name, fbp: b.fbp, fbc: b.fbc, ip: clientIp(req), ua: req.headers.get("user-agent"), externalId: id };
  const sendToMeta = !isTest || Boolean(process.env.META_TEST_EVENT_CODE);
  if (sendToMeta)
    after(() =>
      Promise.all([
        sendCapi({ ...ctx, eventName: "Lead", eventId: eventIds.lead }),
        sendCapi({ ...ctx, eventName: "InitiateCheckout", eventId: eventIds.checkout, value: COURSE.price }),
      ])
    );

  // 3. Razorpay order.
  let order: { id: string };
  try {
    order = await createOrder(amount, id.slice(0, 40), { lead_id: id, phone, name });
  } catch (err) {
    console.error("Razorpay order failed", err);
    return NextResponse.json({ error: "Payment could not start. Please try again in a minute." }, { status: 502 });
  }
  await sql`update leads set razorpay_order_id = ${order.id}, status = case when status = 'paid' then 'paid' else 'checkout' end where id = ${id}`;

  return NextResponse.json({
    leadId: id,
    orderId: order.id,
    amount,
    keyId: process.env.RAZORPAY_KEY_ID,
    eventIds,
    prefill: { name, email, contact: "+" + phone },
  });
}
