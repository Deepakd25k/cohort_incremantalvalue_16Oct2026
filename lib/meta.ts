import crypto from "crypto";
import { SITE_URL } from "./config";

const sha = (v?: string | null) =>
  v ? crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex") : undefined;

// Custom event: fires only after the lead is saved AND the Razorpay order exists, i.e. payment really started.
export const CHECKOUT_EVENT = "cohort_checkout_initiated_capi";

type CapiInput = {
  eventName: "Lead" | "InitiateCheckout" | "Purchase" | typeof CHECKOUT_EVENT;
  eventId: string;
  email?: string;
  phone?: string; // with country code, digits only
  name?: string;
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  ua?: string | null;
  value?: number;
  externalId?: string;
};

// Server-side Meta Conversions API. Deduplicates with the browser pixel via eventId.
export async function sendCapi(e: CapiInput) {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return;

  const [fn, ...rest] = (e.name || "").split(" ");
  const body: Record<string, unknown> = {
    data: [
      {
        event_name: e.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: SITE_URL,
        user_data: {
          em: sha(e.email),
          ph: sha(e.phone),
          fn: sha(fn),
          ln: sha(rest.join(" ")),
          country: sha("in"),
          external_id: sha(e.externalId),
          fbp: e.fbp || undefined,
          fbc: e.fbc || undefined,
          client_ip_address: e.ip || undefined,
          client_user_agent: e.ua || undefined,
        },
        custom_data: e.value ? { currency: "INR", value: e.value } : undefined,
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("CAPI error", err);
  }
}
