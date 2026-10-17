"use client";

import { useEffect, useState } from "react";
import type { LiveEvent } from "./AutoRefresh";

const WINDOW_MS = 5 * 60 * 1000;

const time = (t: string) =>
  new Date(t).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });

function detail(e: LiveEvent) {
  const p = e.props || {};
  if (e.name === "scroll") return `${p.depth}%`;
  if (e.name === "section_view") return String(p.id ?? "");
  if (e.name === "lead_submit") return `lead ${p.lead}${p.test ? " · test" : ""}${p.repeat ? " · repeat" : ""}`;
  return Object.values(p).join(", ").slice(0, 40);
}

// Live activity table. New events arrive from <AutoRefresh> within ~2s and flash at the top.
export function LiveFeed({ initial }: { initial: LiveEvent[] }) {
  const [rows, setRows] = useState<LiveEvent[]>(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRows((cur) => merge(initial, cur));
  }, [initial]);

  // Drop anything older than 5 minutes, so the table only shows what is happening right now.
  useEffect(() => {
    const id = setInterval(() => setRows((cur) => {
      const kept = cur.filter((e) => Date.now() - new Date(e.ts).getTime() < WINDOW_MS);
      return kept.length === cur.length ? cur : kept;
    }), 5000);
    return () => clearInterval(id);
  }, []);

  const visitors = new Set(rows.map((r) => r.visitor_id)).size;
  const sessions = new Set(rows.map((r) => r.session_id)).size;

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
    <>
    <p className="live-sum">
      Last 5 min: <b>{visitors}</b> visitor{visitors === 1 ? "" : "s"} · <b>{sessions}</b> session{sessions === 1 ? "" : "s"} · <b>{rows.length}</b> events
    </p>
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Detail</th>
            <th>Source</th>
            <th>Device</th>
            <th>Visitor</th>
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
              <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{String(a.visitor_id).slice(0, 6)}</td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{String(a.session_id).slice(0, 6)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={7}>No activity in the last 5 minutes. Open the landing page in another tab to test.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}

function merge(a: LiveEvent[], b: LiveEvent[]) {
  const seen = new Map<string, LiveEvent>();
  for (const e of [...a, ...b]) if (!seen.has(e.id)) seen.set(e.id, e);
  return [...seen.values()].sort((x, y) => (BigInt(y.id) > BigInt(x.id) ? 1 : -1)).slice(0, 300);
}
