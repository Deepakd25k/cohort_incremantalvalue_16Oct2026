import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
