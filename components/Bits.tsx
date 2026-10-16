"use client";

import { useEffect, useState, type ReactNode } from "react";
import { COURSE } from "@/lib/config";
import { track } from "@/lib/track-client";
import { CTA } from "./Enroll";

export function SeatCounter({ light = false }: { light?: boolean }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/seats")
      .then((r) => r.json())
      .then((d) => setLeft(d.left))
      .catch(() => {});
  }, []);
  return (
    <p className={`seats ${light ? "seats-light" : ""}`}>
      <span className="pulse" />
      <span>
      {left === null ? (
        <>
          Only <b>{COURSE.seats} seats</b> in this batch
        </>
      ) : left === 0 ? (
        <b>This batch is full</b>
      ) : (
        <>
          <b>{left} of {COURSE.seats} seats</b> left
        </>
      )}
      </span>
    </p>
  );
}

export function StickyBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`sticky-bar ${show ? "on" : ""}`} aria-hidden={!show}>
      <div>
        <b>₹{COURSE.price.toLocaleString("en-IN")}</b>
        <span>Starts {COURSE.batchStart.replace(/^\w+, /, "")}</span>
      </div>
      <CTA source="sticky_bar" className="btn">
        Reserve my seat
      </CTA>
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="faq">
      {items.map((it, i) => (
        <details key={i} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("faq_open", { q: it.q })}>
          <summary>{it.q}</summary>
          <div className="faq-a">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
