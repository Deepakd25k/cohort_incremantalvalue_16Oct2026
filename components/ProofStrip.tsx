"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/track-client";

export type Proof = { src: string; w: number; h: number; stat: string; label: string };

const AUTO_MS = 3500;

// Horizontal, auto-advancing strip of Ads Manager screenshots. Swipe or use arrows; pauses on touch/hover.
export function ProofStrip({ items }: { items: Proof[] }) {
  const track_ = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState<Proof | null>(null);

  const step = (dir: 1 | -1) => {
    const el = track_.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".proof-card");
    const w = (card?.offsetWidth || 300) + 12;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = track_.current;
    if (!el) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const id = setInterval(() => visible && step(1), AUTO_MS);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, [paused, open]);

  return (
    <div
      className="proof"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="proof-head">
        <p className="mono proof-tag">LIVE FROM MY DASHBOARDS</p>
        <div className="proof-nav">
          <button type="button" aria-label="Previous" onClick={() => (setPaused(true), step(-1))}>
            ‹
          </button>
          <button type="button" aria-label="Next" onClick={() => (setPaused(true), step(1))}>
            ›
          </button>
        </div>
      </div>
      <div className="proof-track" ref={track_}>
        {items.map((p) => (
          <figure className="proof-card" key={p.src}>
            <button
              type="button"
              className="proof-img"
              onClick={() => {
                setOpen(p);
                track("proof_open", { src: p.src });
              }}
              aria-label={`Open screenshot: ${p.label}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.label} width={p.w} height={p.h} loading="lazy" decoding="async" />
            </button>
            <figcaption>
              <b>{p.stat}</b>
              <span>{p.label}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="proof-note">Real screenshots from Meta Ads Manager and Amazon Seller Central. Brand and campaign names hidden. Tap to zoom.</p>

      {open && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={open.label}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open.src} alt={open.label} />
          <p>
            <b>{open.stat}</b> · {open.label}
          </p>
          <button type="button" aria-label="Close">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
