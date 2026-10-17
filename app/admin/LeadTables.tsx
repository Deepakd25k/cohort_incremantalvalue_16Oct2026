"use client";

import { useState } from "react";

export type LeadRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  submit_count: number;
  paid_at: string | null;
  name: string;
  phone: string;
  email: string;
  profile: string | null;
  status: string;
  is_test: boolean;
  wa_opt_out: boolean;
  reminder_sent_at: string | null;
  followup_status: string;
  followup_note: string | null;
  attended_class1: boolean;
  refund_status: string;
  razorpay_payment_id: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
};

const FOLLOWUP: [string, string][] = [
  ["new", "New"],
  ["messaged", "Messaged"],
  ["interested", "Interested"],
  ["no_reply", "No reply"],
  ["not_interested", "Not interested"],
];

const fmtTime = (t: string | null) =>
  t ? new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "–";

function ago(t: string) {
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

async function save(id: string, patch: Record<string, unknown>) {
  const r = await fetch("/api/admin/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...patch }),
  });
  return r.ok;
}

// Opens your own WhatsApp with a short, personal message already typed. Sent by you, one person at a time.
function waLink(l: LeadRow, siteUrl: string, batchStart: string) {
  const first = l.name.split(" ")[0];
  const msg =
    `Hi ${first}, Deepak here from incrementalvalue. I saw you started enrolling for the 2027 D2C Growth Cohort ` +
    `(batch starts ${batchStart}) but the payment didn't go through. Any question I can help with?\n\n` +
    `If you'd like to complete it: ${siteUrl}/?utm_source=whatsapp&utm_medium=manual&utm_campaign=followup#enroll`;
  return `https://wa.me/${l.phone}?text=${encodeURIComponent(msg)}`;
}

export function FollowUps({ rows, siteUrl, batchStart }: { rows: LeadRow[]; siteUrl: string; batchStart: string }) {
  const [data, setData] = useState(rows);
  const [savedId, setSavedId] = useState<string | null>(null);
  const update = async (id: string, patch: Partial<LeadRow>) => {
    setData((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (await save(id, patch)) {
      setSavedId(id);
      setTimeout(() => setSavedId((s) => (s === id ? null : s)), 1200);
    }
  };

  return (
    <div className="tbl-wrap">
      <table className="tbl tbl-edit">
        <thead>
          <tr>
            <th>Last submit</th>
            <th>Name</th>
            <th>Profile</th>
            <th>Source</th>
            <th>Auto reminder</th>
            <th>Message</th>
            <th>Status</th>
            <th>Note</th>
            <th>Opt-out</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l) => (
            <tr key={l.id} className={l.wa_opt_out ? "row-muted" : ""}>
              <td title={`First: ${fmtTime(l.created_at)}`}>
                {ago(l.updated_at || l.created_at)}
                {l.submit_count > 1 && <div className="cell-sub">submitted {l.submit_count}×</div>}
              </td>
              <td>
                {l.name} {l.is_test && <span className="tag tag-lead">test</span>}
                <div className="cell-sub">+{l.phone}</div>
              </td>
              <td>{l.profile || "–"}</td>
              <td>{[l.utm_source, l.utm_campaign].filter(Boolean).join(" / ") || "direct"}</td>
              <td>{l.reminder_sent_at ? "Sent " + ago(l.reminder_sent_at) : "–"}</td>
              <td>
                {l.wa_opt_out ? (
                  <span className="cell-sub">Opted out</span>
                ) : (
                  <a
                    className="btn btn-sm btn-wa"
                    href={waLink(l, siteUrl, batchStart)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => l.followup_status === "new" && update(l.id, { followup_status: "messaged" })}
                  >
                    WhatsApp
                  </a>
                )}
              </td>
              <td>
                <select value={l.followup_status} onChange={(e) => update(l.id, { followup_status: e.target.value })}>
                  {FOLLOWUP.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
                {savedId === l.id && <span className="saved">✓</span>}
              </td>
              <td>
                <input
                  className="note"
                  defaultValue={l.followup_note || ""}
                  placeholder="Add note"
                  onBlur={(e) => e.target.value !== (l.followup_note || "") && update(l.id, { followup_note: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={l.wa_opt_out}
                  title="Asked not to be messaged. No reminders will be sent."
                  onChange={(e) => update(l.id, { wa_opt_out: e.target.checked })}
                />
              </td>
            </tr>
          ))}
          {!data.length && (
            <tr>
              <td colSpan={9}>No pending leads. Everyone who filled the form has paid.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Students({ rows }: { rows: LeadRow[] }) {
  const [data, setData] = useState(rows);
  const update = (id: string, patch: Partial<LeadRow>) => {
    setData((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    save(id, patch);
  };
  const attended = data.filter((r) => r.attended_class1).length;

  return (
    <>
      <p className="live-sum">
        <b>{data.length}</b> enrolled · <b>{attended}</b> attended class 1 ·{" "}
        <b>{data.filter((r) => r.refund_status !== "none").length}</b> refund requests
      </p>
      <div className="tbl-wrap">
        <table className="tbl tbl-edit">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>WhatsApp</th>
              <th>Email</th>
              <th>Profile</th>
              <th>Paid</th>
              <th>Enrollment ID</th>
              <th>Class 1</th>
              <th>Refund</th>
            </tr>
          </thead>
          <tbody>
            {data.map((l, i) => (
              <tr key={l.id}>
                <td>{i + 1}</td>
                <td>
                  {l.name} {l.is_test && <span className="tag tag-lead">test</span>}
                </td>
                <td>
                  <a href={`https://wa.me/${l.phone}`} target="_blank" rel="noopener noreferrer">
                    +{l.phone}
                  </a>
                </td>
                <td>{l.email}</td>
                <td>{l.profile || "–"}</td>
                <td>{fmtTime(l.paid_at)}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11 }} title={l.razorpay_payment_id || ""}>
                  {l.id.slice(0, 8).toUpperCase()}
                </td>
                <td>
                  <input type="checkbox" checked={l.attended_class1} onChange={(e) => update(l.id, { attended_class1: e.target.checked })} />
                </td>
                <td>
                  <select value={l.refund_status} onChange={(e) => update(l.id, { refund_status: e.target.value })}>
                    <option value="none">–</option>
                    <option value="requested">Requested</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan={9}>No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
