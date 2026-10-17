import type { Metadata } from "next";
import Link from "next/link";
import { COURSE } from "@/lib/config";
import { headers } from "next/headers";
import { db, hasDb } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { markPaid } from "@/lib/payments";
import { Logo } from "@/components/Logo";
import { PurchasePixel } from "./PurchasePixel";

export const metadata: Metadata = { title: "You're in · incrementalvalue", robots: { index: false } };
export const dynamic = "force-dynamic";

type Params = { l?: string; o?: string; p?: string; s?: string };

export default async function ThankYou({ searchParams }: { searchParams: Promise<Params> }) {
  const { l, o, p, s } = await searchParams;
  // Razorpay sends the buyer here straight from checkout; the payment is verified on this request.
  if (o && p && s && hasDb() && verifyPaymentSignature(o, p, s)) {
    try {
      const h = await headers();
      await markPaid(o, p, { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(), ua: h.get("user-agent") });
    } catch (err) {
      console.error("thank-you verify failed", err);
    }
  }
  let lead: { id: string; name: string; status: string } | undefined;
  if (l && hasDb()) {
    try {
      const rows = (await db()`select id, name, status from leads where id = ${l.slice(0, 64)}`) as typeof lead[];
      lead = rows[0];
    } catch (err) {
      console.error("thank-you lookup failed", err);
    }
  }
  const paid = lead?.status === "paid";
  const group = process.env.WHATSAPP_GROUP_LINK;

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-in">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="page grid-bg">
        <div className="wrap narrow">
          <div className="done-card">
            <div className="done-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            {paid ? (
              <>
                <h1>You&apos;re in{lead ? `, ${lead.name.split(" ")[0]}` : ""}!</h1>
                <p>
                  Your seat in <b>{COURSE.name}</b> is confirmed. Batch starts <b>{COURSE.batchStart}</b>, {COURSE.schedule}.
                </p>
                <p style={{ marginTop: 10 }}>Next step: join the batch WhatsApp group. Class links and sheets are shared there.</p>
                {group && (
                  <p style={{ marginTop: 20 }}>
                    <a className="btn btn-lg" href={group} target="_blank" rel="noopener noreferrer">
                      Join the WhatsApp group
                    </a>
                  </p>
                )}
                <PurchasePixel leadId={lead!.id} value={COURSE.price} />
              </>
            ) : (
              <>
                <h1>Payment received. Confirming…</h1>
                <p>
                  We are confirming your payment with the bank. You will get a WhatsApp message with the batch details in a few minutes. If you don&apos;t,
                  write to <a href={`mailto:${COURSE.contactEmail}`}>{COURSE.contactEmail}</a>.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
