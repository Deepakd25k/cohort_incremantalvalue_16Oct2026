import { db } from "./db";
import { sendCapi } from "./meta";
import { sendToOwner, sendWhatsApp } from "./aisensy";
import { COURSE } from "./config";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  profile: string | null;
  fbp: string | null;
  fbc: string | null;
  is_test: boolean;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
};

// Marks a lead as paid exactly once. Called from both the client verify route and the Razorpay webhook.
export async function markPaid(orderId: string, paymentId: string, ctx?: { ip?: string | null; ua?: string | null }) {
  const sql = db();
  const rows = (await sql`
    update leads
       set status = 'paid', razorpay_payment_id = ${paymentId}, paid_at = now(), updated_at = now()
     where razorpay_order_id = ${orderId} and status <> 'paid'
     returning id, name, phone, email, profile, fbp, fbc, is_test, utm_source, utm_campaign, utm_content`) as Lead[];

  const lead = rows[0];
  if (!lead) return null; // already paid or unknown order

  if (!lead.is_test)
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

  // Utility template: transactional confirmation with an enrollment ID, no promotion.
  const sent = await sendWhatsApp({
    campaign: process.env.AISENSY_CONFIRM_CAMPAIGN,
    phone: lead.phone,
    name: lead.name,
    params: [lead.name.split(" ")[0], lead.id.slice(0, 8).toUpperCase(), COURSE.batchStart, process.env.WHATSAPP_GROUP_LINK || ""],
  });
  if (sent) await sql`update leads set confirmation_sent_at = now() where id = ${lead.id}`;

  // Instant alert to the owner.
  const [t] = (await sql`
    select count(*)::int n, coalesce(sum(amount), 0)::bigint rev
      from leads where status = 'paid' and not is_test`) as { n: number; rev: string }[];
  const source = [lead.utm_source, lead.utm_campaign, lead.utm_content].filter(Boolean).join(" / ") || "direct";
  await sendToOwner(process.env.AISENSY_OWNER_SALE_CAMPAIGN, [
    (lead.is_test ? "[TEST] " : "") + lead.name,
    lead.profile || "–",
    source,
    `${t.n}/${COURSE.seats}`,
    "₹" + Math.round(Number(t.rev) / 100).toLocaleString("en-IN"),
  ]);

  return lead;
}
