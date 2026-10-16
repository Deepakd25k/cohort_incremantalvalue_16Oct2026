import { NextResponse } from "next/server";
import { db, hasDb } from "@/lib/db";
import { COURSE } from "@/lib/config";

// Runtime only: never query the DB at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  let sold = 0;
  if (hasDb()) {
    try {
      const rows = (await db()`select count(*)::int as n from leads where status = 'paid'`) as { n: number }[];
      sold = rows[0].n;
    } catch (err) {
      console.error("seats query failed", err);
    }
  }
  const show = sold >= COURSE.showSeatCounterAfter;
  return NextResponse.json(
    { left: show ? Math.max(COURSE.seats - sold, 0) : null, total: COURSE.seats },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
