"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EVERY_MS = 15_000;

// Re-fetches the dashboard data every 15s while the tab is open. No page reload.
export function AutoRefresh() {
  const router = useRouter();
  const [live, setLive] = useState(true);
  const [last, setLast] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!live) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setLast(Date.now());
    };
    const id = setInterval(refresh, EVERY_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [live, router]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = Math.max(0, Math.round((now - last) / 1000));
  return (
    <button
      type="button"
      className={`live-pill ${live ? "on" : ""}`}
      onClick={() => setLive((v) => !v)}
      title={live ? "Auto-refresh every 15s. Click to pause." : "Paused. Click to resume."}
    >
      <span className="live-dot" />
      {live ? `Live · updated ${ago}s ago` : "Paused"}
    </button>
  );
}
