"use client";

import { useEffect, useState } from "react";
import type { LiveEvent } from "./AutoRefresh";

const time = (t: string) =>
  new Date(t).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });

function detail(e: LiveEvent) {
  const p = e.props || {};
  if (e.name === "scroll") return `${p.depth}%`;
  if (e.name === "section_view") return String(p.id ?? "");
  return Object.values(p).join(", ").slice(0, 40);
}

// Live activity table. New events arrive from <AutoRefresh> within ~2s and flash at the top.
export function LiveFeed({ initial }: { initial: LiveEvent[] }) {
  const [rows, setRows] = useState<LiveEvent[]>(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRows((cur) => merge(initial, cur));
  }, [initial]);

  useEffect(() => {
    const on = (e: Event) => {
      const incoming = (e as CustomEvent<LiveEvent[]>).detail;
      setRows((cur) => merge(incoming, cur));
      setFresh(new Set(incoming.map((x) => x.id)));
    };
    window.addEventListener("iv-live", on);
    return () => window.removeEventListener("iv-live", on);
  }, []);

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Detail</th>
            <th>Source</th>
            <th>Device</th>
            <th>Session</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className={fresh.has(a.id) ? "row-new" : ""}>
              <td>{time(a.ts)}</td>
              <td>{a.name}</td>
              <td>{detail(a)}</td>
              <td>{a.utm_source || "direct"}</td>
              <td>{a.device || "–"}</td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{String(a.session_id).slice(0, 6)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={6}>Waiting for visitors…</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function merge(a: LiveEvent[], b: LiveEvent[]) {
  const seen = new Map<string, LiveEvent>();
  for (const e of [...a, ...b]) if (!seen.has(e.id)) seen.set(e.id, e);
  return [...seen.values()].sort((x, y) => (BigInt(y.id) > BigInt(x.id) ? 1 : -1)).slice(0, 60);
}
