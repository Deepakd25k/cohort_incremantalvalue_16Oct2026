"use client";

import { useEffect } from "react";
import { ga, pixel } from "@/lib/track-client";

// Same event_id as the server-side CAPI Purchase, so Meta counts it once.
export function PurchasePixel({ leadId, value }: { leadId: string; value: number }) {
  useEffect(() => {
    const key = `iv_purchase_${leadId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    const fire = () => pixel("Purchase", { value, currency: "INR" }, `purchase_${leadId}`);
    if (window.fbq) fire();
    else setTimeout(fire, 1500);
    ga("purchase", { transaction_id: leadId, value, currency: "INR" });
  }, [leadId, value]);
  return null;
}
