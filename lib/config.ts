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
  batchStart: "Sat, 5 Dec 2026",
  batchEnd: "Sun, 27 Dec 2026",
  supportUntil: "27 Jan 2027",
  schedule: "Sat & Sun, 11:00 AM – 2:30 PM",
  platform: "Google Meet",
  language: "Hinglish",
  contactEmail: "hello@incrementalvalue.in",
  photo: "/deepak.jpg", // replace public/deepak.jpg with your photo
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
