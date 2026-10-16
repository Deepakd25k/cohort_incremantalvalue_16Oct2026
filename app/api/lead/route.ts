import crypto from "crypto";
import { NextResponse } from "next/server";
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

  const id = existing[0]?.id || crypto.randomUUID();
  const amount = COURSE.price * 100;
  const order = await createOrder(amount, id.slice(0, 40), { lead_id: id, phone, name });

  await sql`
    insert into leads (id, name, phone, email, profile, status, amount, razorpay_order_id, visitor_id, session_id,
                       fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
    values (${id}, ${name}, ${phone}, ${email}, ${profile}, 'checkout', ${amount}, ${order.id},
            ${clip(b.visitorId, 64)}, ${clip(b.sessionId, 64)}, ${clip(b.fbp)}, ${clip(b.fbc)},
            ${clip(u.utm_source)}, ${clip(u.utm_medium)}, ${clip(u.utm_campaign)}, ${clip(u.utm_content)}, ${clip(u.utm_term)})
    on conflict (id) do update set
      name = excluded.name, email = excluded.email, profile = excluded.profile, status = 'checkout',
      razorpay_order_id = excluded.razorpay_order_id, updated_at = now(),
      fbp = coalesce(excluded.fbp, leads.fbp), fbc = coalesce(excluded.fbc, leads.fbc)`;

  const ctx = { email, phone, name, fbp: b.fbp, fbc: b.fbc, ip: clientIp(req), ua: req.headers.get("user-agent"), externalId: id };
  const eventIds = { lead: `lead_${id}`, checkout: `ic_${order.id}` };
  await Promise.all([
    sendCapi({ ...ctx, eventName: "Lead", eventId: eventIds.lead }),
    sendCapi({ ...ctx, eventName: "InitiateCheckout", eventId: eventIds.checkout, value: COURSE.price }),
  ]);

  return NextResponse.json({
    leadId: id,
    orderId: order.id,
    amount,
    keyId: process.env.RAZORPAY_KEY_ID,
    eventIds,
    prefill: { name, email, contact: "+" + phone },
  });
}
