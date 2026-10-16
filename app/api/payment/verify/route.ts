import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { markPaid } from "@/lib/payments";
import { clientIp } from "@/lib/request";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = b;
  if (!orderId || !paymentId || !sig || !verifyPaymentSignature(orderId, paymentId, sig))
    return NextResponse.json({ ok: false }, { status: 400 });

  await markPaid(orderId, paymentId, { ip: clientIp(req), ua: req.headers.get("user-agent") });
  const rows = (await db()`select id from leads where razorpay_order_id = ${orderId}`) as { id: string }[];
  return NextResponse.json({ ok: true, leadId: rows[0]?.id });
}
