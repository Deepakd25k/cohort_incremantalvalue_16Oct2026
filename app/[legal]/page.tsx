import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { COURSE } from "@/lib/config";
import { Logo } from "@/components/Logo";

const mail = <a href={`mailto:${COURSE.contactEmail}`}>{COURSE.contactEmail}</a>;
const price = `₹${COURSE.price.toLocaleString("en-IN")}`;

const PAGES: Record<string, { title: string; body: ReactNode }> = {
  terms: {
    title: "Terms of Service",
    body: (
      <>
        <p>
          These terms apply to {COURSE.name} (&quot;the cohort&quot;) offered by {COURSE.brand}. By paying for the cohort you agree to them.
        </p>
        <h2>The cohort</h2>
        <p>
          The cohort is a live online program held on {COURSE.platform} ({COURSE.schedule}) from {COURSE.batchStart} to {COURSE.batchEnd}, followed by
          WhatsApp support till {COURSE.supportUntil}. Sessions are recorded, and recordings and class notes are shared with enrolled students for
          personal use until {COURSE.supportUntil}.
        </p>
        <h2>Fee</h2>
        <p>The fee is {price}, paid in full before the cohort starts. Payments are processed by Razorpay.</p>
        <h2>Your access</h2>
        <p>
          Your seat is for you alone. Do not share class links, recordings, sheets or material with others, and do not download or re-upload recordings. We may remove anyone who
          does, without a refund.
        </p>
        <h2>Schedule changes</h2>
        <p>If a session has to move, we will tell you on WhatsApp in advance and hold it on another date.</p>
        <h2>No guarantees</h2>
        <p>
          Numbers shared in the cohort come from brands the mentor has worked with. They are examples, not promises. Your results depend on your own work.
          The cohort does not include a job or placement guarantee or a certificate.
        </p>
        <h2>Contact</h2>
        <p>Questions: {mail}</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p>This policy explains what we collect on this website and why.</p>
        <h2>What we collect</h2>
        <p>
          When you fill the enrollment form: your name, WhatsApp number, email and the profile you choose. When you browse: basic usage data such as pages
          viewed, how far you scroll, the ad or link you came from, and your device type.
        </p>
        <h2>How we use it</h2>
        <p>
          To process your enrollment, send batch details and reminders on WhatsApp and email, run the cohort, and measure and improve our ads and website.
        </p>
        <h2>Who we share it with</h2>
        <p>
          Only the services we use to run this: Razorpay (payments), AiSensy (WhatsApp messages), Meta and Google (ad measurement, with your email and
          phone hashed), and our hosting and database providers. We do not sell your data.
        </p>
        <h2>Your choices</h2>
        <p>To stop messages or have your data deleted, write to {mail}.</p>
      </>
    ),
  },
  refund: {
    title: "Refund Policy",
    body: (
      <>
        <p>
          <b>One simple rule:</b> attend the first live class. If you feel the cohort is not for you, message us on WhatsApp or write to {mail} within 24
          hours of the end of that class, and we will refund 100% of your fee.
        </p>
        <p>Refunds go back to your original payment method within 5–7 working days.</p>
        <p>No refunds are given after this 24-hour window, or if you did not attend the first class.</p>
      </>
    ),
  },
  contact: {
    title: "Contact",
    body: (
      <>
        <p>For questions about the cohort, payments or refunds, write to {mail}.</p>
        <p>Enrolled students can also reach us in the batch WhatsApp group.</p>
      </>
    ),
  },
};

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(PAGES).map((legal) => ({ legal }));

export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const p = PAGES[(await params).legal];
  return { title: p ? `${p.title} · ${COURSE.brand}` : COURSE.brand };
}

export default async function Legal({ params }: { params: Promise<{ legal: string }> }) {
  const p = PAGES[(await params).legal];
  if (!p) notFound();
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-in">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="page">
        <div className="wrap narrow">
          <h1>{p.title}</h1>
          {p.body}
          <p style={{ marginTop: 28, fontSize: 13, color: "var(--muted)" }}>Last updated: 16 Oct 2026</p>
        </div>
      </main>
    </>
  );
}
