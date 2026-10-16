// AiSensy API campaigns. Each campaign must be "Live" in AiSensy with an approved template.
export async function sendWhatsApp(opts: {
  campaign: string | undefined;
  phone: string; // digits with country code, e.g. 919876543210
  name: string;
  params: string[];
}) {
  const apiKey = process.env.AISENSY_API_KEY;
  if (!apiKey || !opts.campaign) return false;
  try {
    const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        campaignName: opts.campaign,
        destination: opts.phone,
        userName: opts.name,
        templateParams: opts.params,
        source: "incrementalvalue-landing",
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("AiSensy error", err);
    return false;
  }
}
