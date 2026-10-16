import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markPaid } from "@/lib/payments";

// Razorpay Dashboard → Webhooks → URL: /api/payment/webhook, events: payment.captured, payment.failed
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, sig)) return new Response("bad signature", { status: 400 });

  const evt = JSON.parse(raw);
  const p = evt?.payload?.payment?.entity;
  if (!p?.order_id) return new Response("ok");

  if (evt.event === "payment.captured") {
    await markPaid(p.order_id, p.id);
  } else if (evt.event === "payment.failed") {
    await db()`update leads set status = 'failed', updated_at = now()
               where razorpay_order_id = ${p.order_id} and status <> 'paid'`;
  }
  return new Response("ok");
}
