# incrementalvalue: 2027 D2C Growth Cohort landing page

Next.js (App Router) landing page with lead capture, Razorpay checkout, Meta Pixel + CAPI, GA4, AiSensy WhatsApp messages and a `/admin` funnel dashboard. Built to deploy on Vercel with Neon Postgres.

## Edit content

- Batch dates, price, seats, timings, contact email: `lib/config.ts`
- Page copy (all 8 sections): `app/page.tsx`
- Your photo: add `public/deepak.jpg` (square, at least 400×400). The "DG" placeholder disappears automatically on the next deploy.

## Setup (one time)

1. **Neon**: create a database, open the SQL editor and run `db/schema.sql`.
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
8. **Admin**: set `ADMIN_PASSWORD`, then open `/admin`.

### AiSensy template text (suggested)

**`AISENSY_REMINDER_CAMPAIGN`**, 2 params: `{{1}}` first name, `{{2}}` link

> Hi {{1}}, your seat in the 2027 D2C Growth Cohort is not confirmed yet. Payment was not completed.
> Only 50 seats in this batch. Complete your enrollment here: {{2}}

**`AISENSY_CONFIRM_CAMPAIGN`**, 3 params: `{{1}}` first name, `{{2}}` batch start, `{{3}}` group link

> Hi {{1}}, you're in! 🎉 Your seat in the 2027 D2C Growth Cohort is confirmed.
> Batch starts {{2}}. Join the batch WhatsApp group for class links and sheets: {{3}}

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
