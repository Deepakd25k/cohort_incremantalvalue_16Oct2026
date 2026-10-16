"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isInternal, setInternal } from "@/lib/track-client";

// Opening /admin marks this browser as "internal": its visits are never tracked or sent to Meta/GA.
export function InternalBadge() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    setInternal(true);
    setOn(isInternal());
  }, []);
  if (on === null) return null;
  return (
    <button
      type="button"
      className={`live-pill ${on ? "on" : ""}`}
      title="Your own visits from this browser are not counted. Click to toggle."
      onClick={() => {
        setInternal(!on);
        setOn(!on);
      }}
    >
      {on ? "✓ My visits excluded" : "My visits counted"}
    </button>
  );
}

export function ResetButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm btn-danger"
      disabled={busy}
      onClick={async () => {
        const typed = window.prompt(
          "This deletes ALL visits/events and every unpaid or test lead.\nReal paid students are kept.\n\nType RESET to confirm:"
        );
        if (typed !== "RESET") return;
        setBusy(true);
        const r = await fetch("/api/admin/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: "RESET" }),
        }).then((x) => x.json()).catch(() => ({}));
        setBusy(false);
        alert(r.ok ? `Done. Removed ${r.events} events and ${r.leads} leads.` : "Reset failed. Try again.");
        router.refresh();
      }}
    >
      {busy ? "Resetting…" : "Reset test data"}
    </button>
  );
}
