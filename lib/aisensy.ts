// AiSensy API campaigns (https://backend.aisensy.com/campaign/t1/api/v2).
// Rules we follow so the WhatsApp number stays healthy:
// - Only message people who gave us their number in the form (opt-in) or the owner.
// - Every message uses an approved template behind a "Live" API campaign; params fill {{1}}, {{2}}… in order.
// - Payment reminders go out once per lead, never in bulk, and never to anyone marked opted-out.
export async function sendWhatsApp(opts: {
  campaign: string | undefined;
  phone: string; // digits with country code, e.g. 919876543210
  name: string;
  params: string[];
}) {
  const apiKey = process.env.AISENSY_API_KEY;
  if (!apiKey || !opts.campaign || !opts.phone) return false;
  const digits = opts.phone.replace(/\D/g, "");
  try {
    const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        campaignName: opts.campaign,
        destination: "+" + digits, // AiSensy recommends +<country code><number>
        userName: opts.name || "there",
        templateParams: opts.params.map((p) => String(p ?? "").slice(0, 900)),
        source: "incrementalvalue-landing",
      }),
    });
    if (!res.ok) console.error("AiSensy rejected", opts.campaign, res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error("AiSensy error", err);
    return false;
  }
}

// Messages to the course owner (sale alerts, daily summary). OWNER_WHATSAPP = your number, e.g. 919876543210.
export const sendToOwner = (campaign: string | undefined, params: string[]) =>
  sendWhatsApp({ campaign, phone: process.env.OWNER_WHATSAPP || "", name: "Deepak", params });
