import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "iv_admin";

export const adminToken = () =>
  crypto.createHmac("sha256", process.env.ADMIN_PASSWORD || "unset").update("iv-admin-v1").digest("hex");

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  return c === adminToken();
}
