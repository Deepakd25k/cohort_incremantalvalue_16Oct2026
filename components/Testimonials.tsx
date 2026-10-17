"use client";

import { useEffect, useRef, useState } from "react";
import type { Testimonial } from "@/lib/testimonials";

const AUTO_MS = 4500;
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// Auto-advancing, swipeable row of testimonials. Pauses on touch/hover. Renders nothing when empty.
export function Testimonials({ items }: { items: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = trackRef.current;
    if (!el) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const id = setInterval(() => {
      if (!visible) return;
      const card = el.querySelector<HTMLElement>(".t-card");
      const w = (card?.offsetWidth || 300) + 14;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: w, behavior: "smooth" });
    }, AUTO_MS);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, [paused, items.length]);

  if (!items.length) return null;

  return (
    <div className="testimonials" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)}>
      <p className="kicker">What people say</p>
      <div className="t-track" ref={trackRef}>
        {items.map((t) => (
          <figure className="t-card" key={t.name}>
            <svg className="t-q" viewBox="0 0 24 24" aria-hidden>
              <path d="M9.5 6C6.5 7 4.5 9.6 4.5 13v5h6v-6H7.6c.2-2 1.4-3.5 3.1-4.2L9.5 6zm10 0c-3 1-5 3.6-5 7v5h6v-6h-2.9c.2-2 1.4-3.5 3.1-4.2L19.5 6z" />
            </svg>
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              {t.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photo} alt="" width={40} height={40} loading="lazy" />
              ) : (
                <span className="t-av" aria-hidden>
                  {initials(t.name)}
                </span>
              )}
              <span className="t-who">
                <b>{t.name}</b>
                <small>{t.role}</small>
              </span>
              {t.linkedin && (
                <a className="t-li" href={t.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
