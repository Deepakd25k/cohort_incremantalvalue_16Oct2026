"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 2_000; // new events show up within ~2s
const FULL_REFRESH_MIN_GAP = 4_000; // KPIs/funnel re-render at most every 4s, only when something happened
const FALLBACK_REFRESH_MS = 60_000;

export type LiveEvent = {
  id: string;
  ts: string;
  name: string;
  props: Record<string, unknown> | null;
  session_id: string;
  utm_source: string | null;
  device: string | null;
};

// Polls /api/admin/live, broadcasts new events to <LiveFeed>, and refreshes the dashboard numbers when needed.
export function AutoRefresh({ lastId = "0" }: { lastId?: string }) {
  const router = useRouter();
  const [live, setLive] = useState(true);
  const [activeNow, setActiveNow] = useState<number | null>(null);
  const [lastAt, setLastAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const cursor = useRef(lastId);
  const lastFull = useRef(Date.now());
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (BigInt(lastId) > BigInt(cursor.current)) cursor.current = lastId;
  }, [lastId]);

  useEffect(() => {
    if (!live) return;
    let stopped = false;

    const fullRefresh = () => {
      const wait = Math.max(0, FULL_REFRESH_MIN_GAP - (Date.now() - lastFull.current));
      if (pending.current) return;
      pending.current = setTimeout(() => {
        pending.current = null;
        lastFull.current = Date.now();
        router.refresh();
      }, wait);
    };

    const poll = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/admin/live?after=${cursor.current}`, { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { events: LiveEvent[]; activeNow: number };
        setActiveNow(d.activeNow);
        setLastAt(Date.now());
        if (d.events.length) {
          cursor.current = d.events[0].id;
          window.dispatchEvent(new CustomEvent("iv-live", { detail: d.events }));
          fullRefresh();
        } else if (Date.now() - lastFull.current > FALLBACK_REFRESH_MS) {
          fullRefresh();
        }
      } catch {}
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [live, router]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = Math.max(0, Math.round((now - lastAt) / 1000));
  return (
    <button
      type="button"
      className={`live-pill ${live ? "on" : ""}`}
      onClick={() => setLive((v) => !v)}
      title={live ? "Live: checks every 2s. Click to pause." : "Paused. Click to resume."}
    >
      <span className="live-dot" />
      {live
        ? `Live${activeNow !== null ? ` · ${activeNow} on page now` : ""} · ${ago}s`
        : "Paused"}
    </button>
  );
}
