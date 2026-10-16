export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || null;

export const clip = (v: unknown, n = 200) => (typeof v === "string" ? v.slice(0, n) : null);

// Normalises Indian mobile numbers to 91XXXXXXXXXX. Returns null if invalid.
export function normalisePhone(raw: string) {
  const d = (raw || "").replace(/\D/g, "");
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 11 && d.startsWith("0") ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(ten) ? "91" + ten : null;
}
