"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { COURSE } from "@/lib/config";
import { cookie, fbc, ga, ids, isInternal, pixel, pixelCustom, track, utm } from "@/lib/track-client";

const EnrollCtx = createContext<{ open: (source: string) => void }>({ open: () => {} });
export const useEnroll = () => useContext(EnrollCtx);

const PROFILES = ["Working marketer", "Freelancer / Agency", "Fresher / Job seeker", "Founder"];

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function EnrollProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const source = useRef("unknown");
  const dialog = useRef<HTMLDivElement>(null);

  const open = useCallback((src: string) => {
    source.current = src;
    setError("");
    setOpen(true);
    track("form_open", { source: src });
    loadRazorpay();
  }, []);

  // WhatsApp reminder links land on /#enroll → open the form directly.
  useEffect(() => {
    if (location.hash === "#enroll") open("reminder_link");
  }, [open]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("input")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, busy]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const { visitorId, sessionId } = ids();
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          phone: f.get("phone"),
          email: f.get("email"),
          profile: f.get("profile"),
          visitorId,
          sessionId,
          utm: utm(),
          fbp: cookie("_fbp"),
          fbc: fbc(),
          test: isInternal(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        track("form_error", { error: data.error });
        setBusy(false);
        return;
      }

      pixel("Lead", { content_name: COURSE.name }, data.eventIds.lead);
      pixel("InitiateCheckout", { value: COURSE.price, currency: "INR" }, data.eventIds.checkout);
      ga("generate_lead", { value: COURSE.price, currency: "INR" });
      ga("begin_checkout", { value: COURSE.price, currency: "INR" });

      if (!(await loadRazorpay()) || !window.Razorpay) {
        setError("Payment window could not load. Check your internet and try again.");
        setBusy(false);
        return;
      }
      track("checkout_open", { source: source.current });
      pixelCustom("cohort_checkout_initiated_capi", { value: COURSE.price, currency: "INR" }, data.eventIds.cohortCheckout);

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        order_id: data.orderId,
        name: COURSE.brand,
        description: COURSE.name,
        prefill: data.prefill,
        notes: { lead_id: data.leadId },
        theme: { color: "#3155F5" },
        // Go to the thank-you page at once; it verifies the payment on the server.
        handler: (r: Record<string, string>) => {
          setRedirecting(true);
          track("payment_success");
          const q = new URLSearchParams({
            l: data.leadId,
            o: r.razorpay_order_id,
            p: r.razorpay_payment_id,
            s: r.razorpay_signature,
          });
          location.href = `/thank-you?${q}`;
        },
        modal: {
          ondismiss: () => {
            track("checkout_dismissed");
            setBusy(false);
          },
        },
      });
      rzp.on("payment.failed", (r) => {
        const err = (r as { error?: { reason?: string } }).error;
        track("payment_failed", { reason: err?.reason });
      });
      rzp.open();
      setOpen(false);
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  return (
    <EnrollCtx.Provider value={{ open }}>
      {children}
      {redirecting && (
        <div className="modal-backdrop pay-redirect" role="status">
          <div className="spinner" />
          <p>Payment successful. Opening your confirmation…</p>
        </div>
      )}
      {isOpen && (
        <div className="modal-backdrop" onClick={() => !busy && setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enroll-title"
            ref={dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" aria-label="Close" onClick={() => !busy && setOpen(false)}>
              ×
            </button>
            <p className="kicker modal-kicker">Starts {COURSE.batchStart.replace(/^\w+, | \d{4}$/g, "")} · Closes {COURSE.enrollCloses}</p>
            <h3 id="enroll-title">Reserve your seat</h3>
            <p className="modal-sub">
              Fill this in, then pay <b>₹{COURSE.price.toLocaleString("en-IN")}</b> securely. Batch details come on WhatsApp.
            </p>
            <form onSubmit={submit} className="form">
              <label>
                Full name
                <input name="name" required minLength={2} autoComplete="name" placeholder="Your name" />
              </label>
              <label>
                WhatsApp number
                <div className="phone">
                  <span>+91</span>
                  <input
                    name="phone"
                    required
                    inputMode="numeric"
                    autoComplete="tel-national"
                    pattern="[0-9 ]{10,12}"
                    maxLength={12}
                    placeholder="10-digit number"
                  />
                </div>
                <span className="field-hint">We&apos;ll send your enrollment details and class updates here.</span>
              </label>
              <label>
                Email
                <input name="email" type="email" required autoComplete="email" placeholder="you@email.com" />
              </label>
              <label>
                You are a
                <select name="profile" required defaultValue="">
                  <option value="" disabled>
                    Choose one
                  </option>
                  {PROFILES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-lg btn-block" disabled={busy}>
                {busy ? "Please wait…" : `Continue to payment · ₹${COURSE.price.toLocaleString("en-IN")}`}
              </button>
              <p className="form-note">
                <LockIcon /> Secure payment by Razorpay · UPI, cards, net banking
              </p>
            </form>
          </div>
        </div>
      )}
    </EnrollCtx.Provider>
  );
}

export function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

export function CTA({ source, children, className = "btn btn-lg" }: { source: string; children: ReactNode; className?: string }) {
  const { open } = useEnroll();
  return (
    <button
      className={className}
      onClick={() => {
        track("cta_click", { source });
        open(source);
      }}
    >
      {children}
    </button>
  );
}
