"use client";

type Dict = Record<string, unknown>;
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    Razorpay?: new (opts: Dict) => { open: () => void; on: (e: string, cb: (r: Dict) => void) => void };
  }
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const SESSION_IDLE_MS = 30 * 60 * 1000;

const store = {
  get(k: string, s: Storage | null) {
    try {
      return s?.getItem(k) ?? null;
    } catch {
      return null;
    }
  },
  set(k: string, v: string, s: Storage | null) {
    try {
      s?.setItem(k, v);
    } catch {}
  },
};
const ls = () => (typeof localStorage === "undefined" ? null : localStorage);
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function ids() {
  let v = store.get("iv_vid", ls());
  if (!v) store.set("iv_vid", (v = uid()), ls());
  let s = store.get("iv_sid", ls());
  const last = Number(store.get("iv_slast", ls()) || 0);
  if (!s || Date.now() - last > SESSION_IDLE_MS) {
    s = uid();
    store.set("iv_sid", s, ls());
    store.set("iv_utm", "", ls()); // new session → fresh attribution
  }
  store.set("iv_slast", String(Date.now()), ls());
  return { visitorId: v, sessionId: s };
}

export function utm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(location.search);
  const fromUrl: Record<string, string> = {};
  UTM_KEYS.forEach((k) => q.get(k) && (fromUrl[k] = q.get(k)!.slice(0, 200)));
  if (Object.keys(fromUrl).length) {
    store.set("iv_utm", JSON.stringify(fromUrl), ls());
    return fromUrl;
  }
  try {
    return JSON.parse(store.get("iv_utm", ls()) || "{}");
  } catch {
    return {};
  }
}

// Browsers that opened /admin (the owner) and automated browsers are never tracked.
export function isInternal() {
  if (typeof window === "undefined") return true;
  if (navigator.webdriver) return true;
  return store.get("iv_internal", ls()) === "1";
}
export const setInternal = (on: boolean) => store.set("iv_internal", on ? "1" : "", ls());

const device = () => (typeof window === "undefined" ? "" : window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop");

export function track(n: string, p: Dict = {}) {
  if (isInternal()) return;
  const { visitorId, sessionId } = ids();
  const body = JSON.stringify({
    v: visitorId,
    s: sessionId,
    n,
    p,
    path: location.pathname,
    ref: document.referrer,
    d: device(),
    u: utm(),
  });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch {}
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

export function pixel(event: string, params: Dict = {}, eventID?: string) {
  if (isInternal()) return;
  window.fbq?.("track", event, params, eventID ? { eventID } : undefined);
}

export function ga(event: string, params: Dict = {}) {
  if (isInternal()) return;
  window.gtag?.("event", event, params);
}

export function cookie(name: string) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

// _fbc may not exist yet on the first page view; build it from fbclid if needed.
export function fbc() {
  const c = cookie("_fbc");
  if (c) return c;
  const id = new URLSearchParams(location.search).get("fbclid");
  return id ? `fb.1.${Date.now()}.${id}` : null;
}
