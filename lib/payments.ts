import { db } from "./db";
import { sendCapi } from "./meta";
import { sendWhatsApp } from "./aisensy";
import { COURSE } from "./config";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  fbp: string | null;
  fbc: string | null;
  confirmation_sent_at: string | null;
};

// Marks a lead as paid exactly once. Called from both the client verify route and the Razorpay webhook.
export async function markPaid(orderId: string, paymentId: string, ctx?: { ip?: string | null; ua?: string | null }) {
  const sql = db();
  const rows = (await sql`
    update leads
       set status = 'paid', razorpay_payment_id = ${paymentId}, paid_at = now(), updated_at = now()
     where razorpay_order_id = ${orderId} and status <> 'paid'
     returning id, name, phone, email, status, fbp, fbc, confirmation_sent_at`) as Lead[];

  const lead = rows[0];
  if (!lead) return null; // already paid or unknown order

  await sendCapi({
    eventName: "Purchase",
    eventId: `purchase_${lead.id}`,
    email: lead.email,
    phone: lead.phone,
    name: lead.name,
    fbp: lead.fbp,
    fbc: lead.fbc,
    ip: ctx?.ip,
    ua: ctx?.ua,
    value: COURSE.price,
    externalId: lead.id,
  });

  const sent = await sendWhatsApp({
    campaign: process.env.AISENSY_CONFIRM_CAMPAIGN,
    phone: lead.phone,
    name: lead.name,
    params: [lead.name.split(" ")[0], COURSE.batchStart, process.env.WHATSAPP_GROUP_LINK || ""],
  });
  if (sent) await sql`update leads set confirmation_sent_at = now() where id = ${lead.id}`;

  return lead;
}
