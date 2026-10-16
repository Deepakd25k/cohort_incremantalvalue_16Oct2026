"use client";

import { useEffect } from "react";
import { COURSE } from "@/lib/config";
import { ga, pixel, track } from "@/lib/track-client";

// Page view, scroll depth (25/50/75/100) and which sections people actually reach.
export function PageTracker() {
  useEffect(() => {
    track("page_view");

    const hit = new Set<number>();
    let viewContent = false;
    const onScroll = () => {
      const h = document.documentElement;
      const pct = ((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100;
      for (const t of [25, 50, 75, 100]) {
        if (pct >= t - 2 && !hit.has(t)) {
          hit.add(t);
          track("scroll", { depth: t });
        }
      }
      if (!viewContent && pct >= 50) {
        viewContent = true;
        pixel("ViewContent", { content_name: COURSE.name, value: COURSE.price, currency: "INR" });
        ga("view_item", { value: COURSE.price, currency: "INR" });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).dataset.section!;
          if (e.isIntersecting && !seen.has(id)) {
            seen.add(id);
            track("section_view", { id });
          }
        }),
      { threshold: 0.35 }
    );
    document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);
  return null;
}
