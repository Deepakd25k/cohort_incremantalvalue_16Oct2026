import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const ok = process.env.ADMIN_PASSWORD && form.get("password") === process.env.ADMIN_PASSWORD;
  const res = NextResponse.redirect(new URL(ok ? "/admin" : "/admin?error=1", req.url), 303);
  if (ok)
    res.cookies.set(ADMIN_COOKIE, adminToken(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  return res;
}
