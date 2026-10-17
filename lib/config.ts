// Edit batch details here. Everything on the page reads from this file.
export const COURSE = {
  brand: "incrementalvalue",
  name: "The 2027 D2C Growth Cohort",
  instructor: "Deepak Gupta",
  instructorTitle: "Performance Marketing Lead, D2C",
  price: 2999, // INR, all inclusive
  anchorPrice: 50000, // what typical courses charge, used only for comparison copy
  seats: 50,
  showSeatCounterAfter: 25, // live "seats left" appears once this many seats are sold
  batchStart: "Sat, 28 Nov 2026",
  batchEnd: "Sun, 20 Dec 2026",
  supportUntil: "20 Jan 2027",
  schedule: "Sat & Sun, 11:00 AM – 2:30 PM",
  platform: "Google Meet",
  language: "Hinglish",
  contactEmail: "hello@incrementalvalue.in",
  photo: "/deepak.webp", // round photo, transparent corners
};

// Accepts "cohort.incrementalvalue.in" or a full URL; a bad value must never crash the page.
function siteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (!raw) return "http://localhost:3000";
  const withProto = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProto).origin;
  } catch {
    return "http://localhost:3000";
  }
}
export const SITE_URL = siteUrl();
