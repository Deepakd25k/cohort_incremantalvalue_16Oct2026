import { NextResponse } from "next/server";
import { db, hasDb } from "@/lib/db";
import { COURSE } from "@/lib/config";

export const revalidate = 60;

export async function GET() {
  let sold = 0;
  if (hasDb()) {
    const rows = (await db()`select count(*)::int as n from leads where status = 'paid'`) as { n: number }[];
    sold = rows[0].n;
  }
  const show = sold >= COURSE.showSeatCounterAfter;
  return NextResponse.json({ left: show ? Math.max(COURSE.seats - sold, 0) : null, total: COURSE.seats });
}
