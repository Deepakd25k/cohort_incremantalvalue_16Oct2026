export type Testimonial = {
  name: string;
  role: string; // e.g. "Founder, <brand>" or "Performance Marketer, <company>"
  quote: string;
  photo?: string; // optional, put the file in public/testimonials/
  linkedin?: string; // optional, shows a "LinkedIn" link so visitors can verify
};

// Only add real testimonials: the person's own words, approved by them, with permission to use their name.
// The section stays hidden on the page while this list is empty.
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priyaranjan",
    role: "Working professional, D2C marketing",
    quote:
      "Deepak changed the way I look at D2C. I now see the whole business, not just the ads, and I feel confident when I talk to founders.",
  },
  {
    name: "Ashutosh",
    role: "Performance marketer",
    quote:
      "Once I understood tracking and every touchpoint in the user journey, scaling became much clearer. I can now scale campaigns far better than before.",
  },
  {
    name: "Tarun",
    role: "Aspiring D2C marketer",
    quote:
      "I didn't know the D2C tech stack before. Now I understand how a real D2C brand works, and I'm confidently applying to good D2C brands.",
  },
];
