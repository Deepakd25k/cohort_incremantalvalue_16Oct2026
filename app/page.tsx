import fs from "fs";
import path from "path";
import Link from "next/link";
import { COURSE, SITE_URL } from "@/lib/config";
import { CTA, EnrollProvider, LockIcon } from "@/components/Enroll";
import { Faq, SeatCounter, StickyBar } from "@/components/Bits";
import { PageTracker } from "@/components/PageTracker";
import { Logo } from "@/components/Logo";
import { ProofStrip, type Proof } from "@/components/ProofStrip";
import { Testimonials } from "@/components/Testimonials";
import { TESTIMONIALS } from "@/lib/testimonials";

const price = `₹${COURSE.price.toLocaleString("en-IN")}`;
const hasPhoto = fs.existsSync(path.join(process.cwd(), "public", COURSE.photo));

const STATS = [
  { v: "₹15Cr+", l: "ad spend managed in the last 2 years" },
  { v: "4.5X", l: "average blended ROAS" },
  { v: "25% → 8%", l: "RTO cut for a D2C brand" },
  { v: "₹1,500 → ₹500", l: "CAC, by fixing CRO & attribution" },
];

const LOOK = [
  ["Meta Ads Manager", "Unit economics: COGS, shipping, RTO, discounts"],
  ["ROAS", "Contribution margin (CM1, CM2, CM3)"],
  ["CTR & CPM", "Leaks in the user journey, ad to delivery"],
  ["What the platform reports", "What Shopify, GA4 & the bank say"],
  ["“Let’s scale the winning ad”", "“Can the business afford to scale?”"],
];

const COMPARE = [
  ["₹50,000 – ₹60,000", price + ", all inclusive"],
  ["Recorded videos only", "Live classes + recordings, doubts solved in class"],
  ["How to click buttons in Ads Manager", "How a D2C brand actually makes money"],
  ["Dummy examples", "Real brand screenshots & sheets"],
  ["Taught by course creators", "Taught by someone running ads right now"],
  ["Upsell to an “advanced” course", "No upsells. Everything in one price"],
  ["A certificate", "Skills you can explain in an interview"],
];

const WEEKS = [
  {
    t: "How D2C really works",
    sessions: [
      {
        t: "The D2C machine, end to end",
        b: ["How money flows: ad → website → checkout → warehouse → delivery → repeat", "The D2C stack: Shopify, checkout, Shiprocket, WhatsApp, GA4", "Mapping the user journey and finding where the brand leaks money"],
      },
      {
        t: "Unit economics",
        b: ["COGS, shipping, payment fees, RTO and discounts", "CM1, CM2, CM3 and break-even ROAS", "Why a brand at 4X ROAS can still lose money"],
      },
    ],
  },
  {
    t: "Ads that make profit",
    sessions: [
      {
        t: "Meta Ads beyond the dashboard",
        b: ["Building ICPs & personas, then testing them", "Creative strategy, vernacular ads, account structure", "When to scale, and when not to"],
      },
      {
        t: "Google, Amazon & quick commerce",
        b: ["Search, Shopping & Performance Max for D2C", "Where Amazon & Blinkit fit in the plan", "Splitting budget across channels"],
      },
    ],
  },
  {
    t: "Data & conversion",
    sessions: [
      {
        t: "Tracking & attribution",
        b: ["GA4, GTM, Pixel + Conversions API", "Why Meta, GA4 and Shopify never match, and what to trust", "Mapping data so you see the real picture"],
      },
      {
        t: "CRO: get more from the same traffic",
        b: ["Landing pages, product pages and checkout", "COD vs prepaid, and how to push prepaid", "How CAC went from ₹1,500 to ₹500 without more ad spend"],
      },
    ],
  },
  {
    t: "RTO, retention, AI & career",
    sessions: [
      {
        t: "RTO & retention",
        b: ["The playbook that took RTO from 25% to 8%", "COD checks, NDR, delivery and customer communication", "WhatsApp & Bitespeed flows for repeat orders"],
      },
      {
        t: "AI, founders & your career",
        b: ["n8n automations for creatives and ad copies", "How to talk to founders and report numbers they care about", "Resume, reaching out to brands, and cracking interviews"],
      },
    ],
  },
];

const PROOF: Proof[] = [
  { src: "/proof/lifetime-all.webp", w: 1400, h: 1102, stat: "₹69L+ spent · 20,253 purchases", label: "All-time, one ad account · 4.52X ROAS" },
  { src: "/proof/amazon-sales.webp", w: 1400, h: 462, stat: "₹19.67L Amazon sales · 3,133 units", label: "Amazon Seller Central · 1 Sep – 16 Oct 2026" },
  { src: "/proof/last-30-days.webp", w: 1400, h: 567, stat: "6.52X ROAS · 1,942 purchases", label: "Last 30 days · ₹4.9L spent" },
  { src: "/proof/adset-roas.webp", w: 944, h: 164, stat: "7.53X ROAS · 9.14% CTR", label: "One ad set · ₹14 per landing page view" },
  { src: "/proof/cost-per-purchase.webp", w: 1400, h: 490, stat: "₹253 cost per purchase", label: "Last 30 days, across 4 campaigns" },
  { src: "/proof/lifetime-top4.webp", w: 1400, h: 554, stat: "₹47L spent · 16,084 purchases", label: "All-time, top 4 campaigns · 5.25X ROAS" },
];

const OUTCOMES = [
  "Build a unit economics sheet for any D2C brand",
  "Explain why a brand at 4X ROAS is still losing money",
  "Find where the funnel leaks, from ad click to delivery",
  "Set up GA4, GTM, Pixel and CAPI, and trust your numbers",
  "Cut RTO and push prepaid orders",
  "Report to a founder in numbers they care about",
];

// Logos live in public/logos. Replace any file with the official logo (same name) to update it.
const TOOLS = [
  { name: "Meta Ads", logo: "meta" },
  { name: "Google Ads", logo: "google-ads" },
  { name: "Shopify", logo: "shopify" },
  { name: "GA4", logo: "ga4" },
  { name: "GTM", logo: "gtm" },
  { name: "Pixel + CAPI", logo: "meta" },
  { name: "Bitespeed", logo: "bitespeed" },
  { name: "Shiprocket", logo: "shiprocket" },
  { name: "Amazon", logo: "amazon" },
  { name: "Blinkit", logo: "blinkit" },
  { name: "n8n", logo: "n8n" },
];

const FOR = [
  ["You run Meta ads but want to understand the whole business", "You have never opened Ads Manager"],
  ["Freelancers who get stuck when a client asks “why?”", "You want a certificate more than the skill"],
  ["Freshers & juniors preparing for D2C roles", "You only want to watch videos, not do the work"],
  ["Early-stage founders who want to know what their team should do", "You are looking for secret hacks"],
];

const GET = [
  ["8 live sessions", "Every Sat & Sun for 4 weekends, 3 hours each on Google Meet"],
  ["30 min live doubts", "After every class. Bring your own account’s problems"],
  ["Recordings + class notes", "Every session recorded, with notes. Rewatch till " + COURSE.supportUntil],
  ["Real brand teardowns", "Screenshots and numbers from brands I run"],
  ["Ready-to-use sheets", "Unit economics calculator, RTO checklist, founder report, tracking checklist"],
  ["n8n AI workflows", "Automations for creatives and ad copies"],
  ["1 month WhatsApp support", "After the course ends, till " + COURSE.supportUntil],
  ["Career kit", "Resume review, how to reach brands, interview prep from someone who hires"],
];

// Plain text, so the same answers feed the page and the FAQ structured data for Google and AI search.
const FAQS = [
  { q: "What language is the class in?", a: "Hinglish. All slides and sheets are in English." },
  {
    q: "Will I get recordings?",
    a: `Yes. Every class is recorded and shared in the batch group along with class notes. You can rewatch them till ${COURSE.supportUntil}. Doubts are solved live, so try to attend.`,
  },
  { q: "I am a beginner. Can I join?", a: "You need to know the basics of Meta Ads Manager. If you have never run an ad, this is not the right course yet." },
  {
    q: "What if I miss a class?",
    a: "Watch the recording and go through the class notes, both shared in the batch WhatsApp group. Ask about anything you did not get in the next doubt slot or on WhatsApp.",
  },
  {
    q: "There are 50 people. Will my doubts get answered?",
    a: "Yes. Every class ends with 30 minutes of live doubts, and the WhatsApp group stays open for a month after the course. That is why seats are capped at 50.",
  },
  {
    q: "Isn't all this free on YouTube?",
    a: "YouTube teaches one tool per video. This cohort connects them: how ads, website, delivery and margins affect each other, using real brand numbers, with someone answering questions about your own account.",
  },
  {
    q: "My brand sells mostly on Amazon or Blinkit. Is this useful?",
    a: "Yes. Unit economics, RTO, tracking and growth thinking apply to every channel, and Weekend 2 covers where Amazon and Blinkit fit in the plan.",
  },
  {
    q: "What is the refund policy?",
    a: "Attend the first class. If you feel it is not for you, message us within 24 hours of that class and get a 100% refund. After that, no refunds.",
  },
  { q: "Do I get a certificate?", a: "No. You get skills you can show in your work and explain in an interview. That matters more." },
  { q: "Is there a job guarantee?", a: "No. You get a career kit: resume help, how to reach out to brands, and interview prep from someone who hires D2C marketers." },
  { q: "What happens after I pay?", a: "You get a WhatsApp message with the batch group link, class timings and the Google Meet link." },
  { q: "Are there any other charges or upsells?", a: `No. ${price} is the full price. Nothing to buy later.` },
];


// Structured data: tells Google and AI assistants what this course is, who teaches it, when and for how much.
function jsonLd() {
  const org = `${SITE_URL}/#org`;
  const deepak = `${SITE_URL}/#deepak`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": org, name: COURSE.brand, url: SITE_URL, logo: `${SITE_URL}/icon.svg` },
      {
        "@type": "Person",
        "@id": deepak,
        name: COURSE.instructor,
        jobTitle: COURSE.instructorTitle,
        image: `${SITE_URL}${COURSE.photo}`,
        description: "Performance marketer with 5 years in D2C and ₹15Cr+ in ad spend managed in the last 2 years across Meta, Google, Amazon and Blinkit.",
      },
      {
        "@type": "Course",
        name: COURSE.name,
        description:
          "A 4-weekend live cohort for marketers, freelancers and early-stage founders who run Meta ads. Learn how a D2C brand actually makes money: unit economics and CM3, RTO reduction, tracking (GA4, GTM, Pixel + CAPI), Meta and Google ads, Amazon and Blinkit, CRO, retention and AI workflows. Taught live in Hinglish on Google Meet, with recordings and 1 month of WhatsApp support.",
        url: SITE_URL,
        inLanguage: ["hi-IN", "en-IN"],
        provider: { "@id": org },
        instructor: { "@id": deepak },
        teaches: ["D2C unit economics", "CM3 and break-even ROAS", "Reducing RTO", "Meta Ads", "Google Ads", "GA4, GTM and Conversions API", "CRO", "Retention", "AI for marketing"],
        offers: {
          "@type": "Offer",
          category: "Paid",
          price: COURSE.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          validThrough: COURSE.enrollClosesAt,
          url: SITE_URL,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
          location: { "@type": "VirtualLocation", url: SITE_URL },
          startDate: "2026-11-28",
          endDate: "2026-12-20",
          courseSchedule: {
            "@type": "Schedule",
            repeatFrequency: "P1W",
            byDay: ["https://schema.org/Saturday", "https://schema.org/Sunday"],
            startTime: "11:00",
            endTime: "14:30",
            scheduleTimezone: "Asia/Kolkata",
          },
          instructor: { "@id": deepak },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}

const Check = () => (
  <svg className="ic ic-yes" viewBox="0 0 20 20" aria-hidden>
    <path d="M5 10.5l3.2 3L15 6.5" />
  </svg>
);
const Cross = () => (
  <svg className="ic ic-no" viewBox="0 0 20 20" aria-hidden>
    <path d="M6 6l8 8M14 6l-8 8" />
  </svg>
);

export default function Home() {
  return (
    <EnrollProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }} />
      <PageTracker />

      <header className="topbar">
        <div className="wrap topbar-in">
          <Logo />
          <div className="topbar-right">
            <span className="topbar-date">Batch starts {COURSE.batchStart}</span>
            <CTA source="header" className="btn btn-sm">
              Enroll · {price}
            </CTA>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO */}
        <section className="hero grid-bg" data-section="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="dot" /> {COURSE.name}
              </p>
              <h1>
                Most marketers know the <span className="hl">Ads Manager</span>. Very few know how a D2C brand{" "}
                <span className="hl">actually makes money</span>.
              </h1>
              <p className="lead-punch">
                In 2027, AI clicks the buttons. <b>Founders hire people who understand the business.</b>
              </p>
              <ul className="chips">
                <li>4-weekend live cohort</li>
                <li>Sat &amp; Sun · {COURSE.language}</li>
                <li>For people who run Meta ads</li>
                <li>Recordings + 1 month support</li>
              </ul>
              <div className="hero-cta">
                <CTA source="hero">Reserve my seat · {price}</CTA>
                <div className="hero-cta-meta">
                  <SeatCounter />
                  <p className="micro">
                    <LockIcon /> 100% refund if the first class is not for you
                  </p>
                </div>
              </div>
            </div>

            <aside className="profile-card">
              <div className="profile-top">
                {hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={COURSE.photo} alt={COURSE.instructor} className="avatar avatar-photo" width={400} height={400} />
                ) : (
                  <div className="avatar avatar-ph" aria-hidden>
                    DG
                  </div>
                )}
                <div>
                  <p className="kicker">Your mentor</p>
                  <p className="profile-name">{COURSE.instructor}</p>
                  <p className="profile-role">{COURSE.instructorTitle} · 5 yrs</p>
                </div>
              </div>
              <dl className="stats">
                {STATS.map((s) => (
                  <div key={s.v}>
                    <dt>{s.v}</dt>
                    <dd>{s.l}</dd>
                  </div>
                ))}
              </dl>
              <p className="batch-line">
                <span className="mono">BATCH</span> {COURSE.batchStart} → {COURSE.batchEnd}
              </p>
            </aside>
          </div>
        </section>

        {/* 2. PROBLEM */}
        <section className="sec" data-section="problem">
          <div className="wrap narrow">
            <p className="kicker">The problem</p>
            <h2>
              I hire D2C marketers. Here&apos;s where <span className="hl">most of them get stuck</span>.
            </h2>
            <p className="body">
              I interview candidates for in-house D2C roles. Most have done a course. They know the words: ROAS, AOV, CPM. Then I ask one question:
            </p>
            <blockquote className="quote">
              <span className="mono">INTERVIEW Q.</span>
              “The brand is at <b>4X ROAS</b>. It is still <b>losing money</b>. Why?”
            </blockquote>
            <p className="body">
              Almost everyone opens Meta Ads Manager to look for the answer. <b>The answer is usually not there.</b>
            </p>

            <div className="cmp" role="table" aria-label="Where marketers look vs where the answer is">
              <div className="cmp-row cmp-head" role="row">
                <div role="columnheader">Where they look</div>
                <div role="columnheader" className="h-yes">Where the answer usually is</div>
              </div>
              {LOOK.map(([a, b]) => (
                <div className="cmp-row" role="row" key={a}>
                  <div role="cell" className="cmp-no">
                    <Cross />
                    {a}
                  </div>
                  <div role="cell" className="cmp-yes">
                    <Check />
                    {b}
                  </div>
                </div>
              ))}
            </div>

            <p className="callout">
              In 2027, <b>AI will click most of the buttons</b>. The marketers who grow will be the ones who understand <span className="hl">the business behind the ads</span>.
            </p>
          </div>
        </section>

        {/* 3. ABOUT + PROOF */}
        <section className="sec sec-line" data-section="about">
          <div className="wrap about-grid">
            <div>
              <div className="mentor-head">
                {hasPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={COURSE.photo} alt={COURSE.instructor} className="mentor-photo" width={400} height={400} loading="lazy" />
                )}
                <div>
                  <p className="kicker">Your mentor</p>
                  <h2>
                    Hi, I&apos;m <span className="hl">{COURSE.instructor}</span>.
                  </h2>
                  <p className="mentor-role">{COURSE.instructorTitle} · 5 years · ₹15Cr+ ad spend</p>
                </div>
              </div>
              <p className="body">
                I lead performance marketing for D2C brands on Shopify: <b>fashion & apparel, beauty & personal care, FMCG, kidswear and card games</b>.
                In the last 2 years I have spent <b>₹15Cr+</b> on ads across Meta, Google, Amazon, Blinkit and WhatsApp.
              </p>
              <p className="body">
                I work <b>directly with founders</b>. No middlemen. I know what they ask, which numbers they check, and what keeps them up at night. I also
                interview marketers for in-house D2C roles, so I know exactly what brands look for.
              </p>
              <ul className="facts">
                <li>
                  <b>&lt;10%</b> RTO across brands, some under 4%
                </li>
                <li>
                  <b>60%</b> prepaid orders on average
                </li>
                <li>
                  <b>30%</b> average month-on-month growth
                </li>
                <li>
                  <b>CM3 positive</b> brands, not just high ROAS
                </li>
                <li>
                  <b>₹1,000 – ₹4,500</b> AOV range handled
                </li>
                <li>
                  <b>Shopify</b> D2C brands across 5 categories
                </li>
              </ul>
            </div>

            <article className="case">
              <p className="mono case-tag">CASE STUDY</p>
              <h3>Same ₹15L ad spend. ROAS 0.8X → 2X.</h3>
              <div className="case-ba">
                <div>
                  <span>Before</span>
                  <b>0.8X</b>
                  <small>ROAS</small>
                  <b>25%</b>
                  <small>RTO</small>
                </div>
                <div className="case-after">
                  <span>After</span>
                  <b>2X</b>
                  <small>ROAS</small>
                  <b>8%</b>
                  <small>RTO</small>
                </div>
              </div>
              <p className="case-h">What was broken</p>
              <p>Delivery, customer communication, ads reaching the wrong people, and a weak website.</p>
              <p className="case-h">What we fixed</p>
              <ul>
                <li>Tested ICPs & personas, then doubled down on the winners</li>
                <li>Fixed attribution so we spent on the right audience</li>
                <li>Launched vernacular creatives</li>
                <li>Fixed CRO, delivery and customer communication</li>
              </ul>
              <p className="case-foot">You&apos;ll see the full breakdown in class.</p>
            </article>
          </div>
          <div className="wrap">
            <ProofStrip items={PROOF} />
            <Testimonials items={TESTIMONIALS} />
          </div>
        </section>

        {/* 4. DIFFERENT */}
        <section className="sec sec-tint grid-bg" data-section="different">
          <div className="wrap narrow">
            <p className="kicker">Why this is different</p>
            <h2>
              Not another <span className="hl">“Meta Ads course”</span>
            </h2>
            <div className="cmp cmp-vs" role="table" aria-label="Typical course vs this cohort">
              <div className="cmp-row cmp-head" role="row">
                <div role="columnheader">Typical ₹50k course</div>
                <div role="columnheader" className="cmp-head-us h-yes">
                  <Logo light /> cohort
                </div>
              </div>
              {COMPARE.map(([a, b]) => (
                <div className="cmp-row" role="row" key={a}>
                  <div role="cell" className="cmp-no">
                    <Cross />
                    {a}
                  </div>
                  <div role="cell" className="cmp-yes">
                    <Check />
                    {b}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CURRICULUM */}
        <section className="sec" data-section="curriculum">
          <div className="wrap">
            <div className="narrow">
              <p className="kicker">Curriculum</p>
              <h2>
                4 weekends. 8 live sessions. <span className="hl">The full D2C picture.</span>
              </h2>
              <p className="body">
                {COURSE.schedule} · {COURSE.batchStart} to {COURSE.batchEnd}. Each class is 3 hours + 30 minutes of doubts.
              </p>
            </div>
            <div className="outcomes">
              <p className="mono">AFTER 4 WEEKENDS, YOU WILL BE ABLE TO</p>
              <ul>
                {OUTCOMES.map((o) => (
                  <li key={o}>
                    <Check />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="weeks">
              {WEEKS.map((w, i) => (
                <details className="week" key={w.t} open={i === 0}>
                  <summary>
                    <span className="mono week-n">WEEKEND {i + 1}</span>
                    <span className="week-t">{w.t}</span>
                  </summary>
                  <div className="week-body">
                    {w.sessions.map((s, j) => (
                      <div className="session" key={s.t}>
                        <p className="session-t">
                          <span className="mono">{j === 0 ? "SAT" : "SUN"}</span> {s.t}
                        </p>
                        <ul>
                          {s.b.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
            <div className="tools">
              <span className="mono">TOOLS YOU&apos;LL WORK WITH</span>
              <ul>
                {TOOLS.map((t) => (
                  <li key={t.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/logos/${t.logo}.svg`} alt="" width={18} height={18} loading="lazy" />
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 6. WHO IT'S FOR */}
        <section className="sec sec-tint" data-section="for">
          <div className="wrap narrow">
            <p className="kicker">Who it&apos;s for</p>
            <h2>
              Is this <span className="hl">right for you?</span>
            </h2>
            <div className="cmp" role="table" aria-label="Who this is for and not for">
              <div className="cmp-row cmp-head" role="row">
                <div role="columnheader" className="h-yes">Join if…</div>
                <div role="columnheader">Skip if…</div>
              </div>
              {FOR.map(([a, b]) => (
                <div className="cmp-row" role="row" key={a}>
                  <div role="cell" className="cmp-yes">
                    <Check />
                    {a}
                  </div>
                  <div role="cell" className="cmp-no">
                    <Cross />
                    {b}
                  </div>
                </div>
              ))}
            </div>
            <p className="body small">Only requirement: you know the basics of Meta Ads Manager.</p>
          </div>
        </section>

        {/* 7. OFFER */}
        <section className="sec offer" id="enroll-section" data-section="offer">
          <div className="wrap offer-grid">
            <div>
              <p className="kicker kicker-light">What you get</p>
              <h2>Everything you need. One price. No upsells.</h2>
              <ul className="get">
                {GET.map(([t, d]) => (
                  <li key={t}>
                    <Check />
                    <div>
                      <b>{t}</b>
                      <span>{d}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="price-card">
              <p className="mono">{COURSE.name.toUpperCase()}</p>
              <p className="price">
                {price}
                <span>all inclusive</span>
              </p>
              <p className="price-sub">
                Typical D2C courses charge <b>₹50,000+</b>
              </p>
              <ul className="price-facts">
                <li>
                  <span>Starts</span>
                  <b>{COURSE.batchStart}</b>
                </li>
                <li>
                  <span>Enrolment closes</span>
                  <b>{COURSE.enrollCloses}, 11:59 PM</b>
                </li>
                <li>
                  <span>Schedule</span>
                  <b>{COURSE.schedule}</b>
                </li>
                <li>
                  <span>Where</span>
                  <b>Live on {COURSE.platform}</b>
                </li>
              </ul>
              <CTA source="offer" className="btn btn-lg btn-block">
                Reserve my seat · {price}
              </CTA>
              <SeatCounter />
              <div className="guarantee">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 3l7 3v6c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V6l7-3z" />
                  <path d="M8.5 12l2.4 2.3L15.5 9.8" />
                </svg>
                <p>
                  <b>First-class guarantee.</b> Attend class 1. Not for you? Message us within 24 hours for a 100% refund.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ + FINAL CTA */}
        <section className="sec" data-section="faq">
          <div className="wrap narrow">
            <p className="kicker">FAQ</p>
            <h2>Questions, answered</h2>
            <Faq items={FAQS.map((f) => ({ q: f.q, a: <p>{f.a}</p> }))} />
            <div className="final">
              <h2>
                Stop guessing inside the dashboard. <span className="hl">Learn how the business works.</span>
              </h2>
              <p className="body">
                Batch starts {COURSE.batchStart} · Only {COURSE.seats} seats · Enrolment closes {COURSE.enrollCloses}
              </p>
              <CTA source="final">Reserve my seat · {price}</CTA>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-in">
          <Logo />
          <nav>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refund policy</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p>© 2026 {COURSE.brand}. Results shared are from brands the mentor has worked with; your results depend on your work.</p>
        </div>
      </footer>

      <StickyBar />
    </EnrollProvider>
  );
}
