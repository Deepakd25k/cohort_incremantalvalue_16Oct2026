export type Testimonial = {
  name: string;
  role: string; // e.g. "Founder, <brand>" or "Performance Marketer, <company>"
  quote: string;
  photo?: string; // optional, put the file in public/testimonials/
  linkedin?: string; // optional, shows a "LinkedIn" link so visitors can verify
};

// Only add real testimonials: the person's own words, approved by them, with permission to use their name.
// The section stays hidden on the page while this list is empty.
export const TESTIMONIALS: Testimonial[] = [];
