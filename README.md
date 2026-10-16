# incrementalvalue: 2027 D2C Growth Cohort landing page

Next.js (App Router) landing page with lead capture, Razorpay checkout, Meta Pixel + CAPI, GA4, AiSensy WhatsApp messages and a `/admin` funnel dashboard. Built to deploy on Vercel with Neon Postgres.

## Edit content

- Batch dates, price, seats, timings, contact email: `lib/config.ts`
- Page copy (all 8 sections): `app/page.tsx`
- Your photo: add `public/deepak.jpg` (square, at least 400×400). The "DG" placeholder disappears automatically on the next deploy.

## Setup (one time)

1. **Neon**: connect a database to the Vercel project. Tables are created automatically on the first request (`db/schema.sql` is kept for reference).
2. **Vercel**: import this repo, then add the env vars from `.env.example` (Project → Settings → Environment Variables).
3. **Razorpay**:
   - Use your Key ID and Secret in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
   - Go to Dashboard → Webhooks → Add. Set the URL to `https://<your-domain>/api/payment/webhook`, choose the events `payment.captured` and `payment.failed`, and put the secret you set there in `RAZORPAY_WEBHOOK_SECRET`.
   - The legal pages Razorpay asks for are already live: `/terms`, `/privacy`, `/refund`, `/contact`.
4. **Meta**:
   - Put the Pixel ID in `NEXT_PUBLIC_META_PIXEL_ID`.
   - Generate a CAPI token (Events Manager → Settings → Conversions API) and put it in `META_CAPI_TOKEN`.
   - While testing, set `META_TEST_EVENT_CODE`. Remove it when you go live.
5. **GA4** (optional): `NEXT_PUBLIC_GA4_ID`.
6. **AiSensy**: create two templates, get them approved, then create an *API campaign* for each. Put the campaign names in the env vars.
7. **Abandoned-cart reminder**: Vercel Hobby only runs cron once a day, so use [cron-job.org](https://cron-job.org) (free) instead:
   - Call `https://<your-domain>/api/cron/reminders?key=<CRON_SECRET>` every 10 minutes.
   - The reminder goes out 30 minutes after the form is filled, and only once per lead.
8. **Admin**: set `ADMIN_PASSWORD`, then open `/admin`. Login lasts 90 days and the dashboard auto-refreshes every 15 seconds.

### AiSensy templates (create these 4, get them approved, then make one *API campaign* per template and set it "Live")

Rules that keep the WhatsApp number safe:
- Pick the right **category**. Meta re-categorises templates whose content does not match.
- **No offers or discounts in Utility templates.**
- Only people who filled the form get messages. The form tells them updates come on WhatsApp.
- The payment reminder goes **once per person**, never in bulk, and never to anyone marked "opt-out" in /admin.
- Params fill `{{1}}`, `{{2}}`… in the order listed.

**1. `enrollment_confirmed`**: Category **Utility**. Env: `AISENSY_CONFIRM_CAMPAIGN`. Params: name, enrollment ID, batch start, group link.

> Hi {{1}}, your enrollment in the 2027 D2C Growth Cohort is confirmed.
> Enrollment ID: {{2}}
> Batch starts: {{3}}
> Join the batch WhatsApp group for class links and sheets: {{4}}

**2. `payment_reminder`**: Category **Marketing** (Meta treats "you didn't complete checkout" reminders as marketing). Env: `AISENSY_REMINDER_CAMPAIGN`. Params: name, link.

> Hi {{1}}, you started enrolling for the 2027 D2C Growth Cohort but the payment didn't go through.
> You can complete it here: {{2}}
> Reply STOP if you don't want messages about this.

**3. `owner_sale_alert`**: Category **Utility**, sent only to `OWNER_WHATSAPP`. Env: `AISENSY_OWNER_SALE_CAMPAIGN`. Params: name, profile, source, seats sold, total revenue.

> New enrollment: {{1}} ({{2}})
> Source: {{3}}
> Seats sold: {{4}} · Revenue so far: {{5}}

**4. `owner_daily_summary`**: Category **Utility**, sent only to `OWNER_WHATSAPP` at 08:45 IST. Env: `AISENSY_OWNER_SUMMARY_CAMPAIGN`. Params: date, visitors, sessions, leads, enrolled, revenue, conversion, total seats sold, top campaign.

> Daily report for {{1}}
> Visitors: {{2}} · Sessions: {{3}}
> Leads: {{4}} · Enrolled: {{5}} · Revenue: {{6}}
> Conversion: {{7}}
> Seats sold so far: {{8}}
> Top campaign: {{9}}

`OWNER_WHATSAPP` must be your personal number, not the WhatsApp Business number AiSensy sends from.

### Admin extras

- **Your visits are excluded.** Opening `/admin` marks that browser, so its visits never count and nothing is sent to Meta or GA4. Toggle it with the "My visits excluded" button. Payments made from that browser are tagged `test` and left out of revenue.
- **Bots are filtered.** Crawlers, link previews and automation tools are dropped before they reach the database.
- **Reset test data** deletes all visits and every unpaid or test lead. Real paid students are never deleted. Use it once on launch day.
- **Follow-ups** lists everyone who filled the form but didn't pay:
  - The WhatsApp button opens *your own* WhatsApp with a message already typed. Send these one person at a time.
  - Set a status and add notes for each person.
  - Tick opt-out if someone asks you to stop.
- **Enrolled students**: mark class 1 attendance and refund status. Export the list with "Students CSV".

## Funnel and tracking

| Step | Our DB event | Meta (Pixel + CAPI, deduplicated) | GA4 |
|---|---|---|---|
| Page load | `page_view` | PageView | page_view |
| 50% scroll | `scroll` | ViewContent | view_item |
| CTA click | `cta_click` (+ source) | – | – |
| Form opened | `form_open` | – | – |
| Form submitted | lead row | Lead | generate_lead |
| Razorpay opened | `checkout_open` | InitiateCheckout | begin_checkout |
| Paid | lead `status = paid` | Purchase (₹2,999) | purchase |

We also track scroll depth (25/50/75/100), which sections people reached, FAQ opens, checkout dismissed and payment failed.

**Ad URLs**: add UTMs so `/admin` can split results by ad:

```
?utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

## Local dev

```
npm install
cp .env.example .env.local   # fill values
npm run dev
```
