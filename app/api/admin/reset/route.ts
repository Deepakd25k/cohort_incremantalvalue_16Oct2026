import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

// Clears testing data before launch. Real paid students are never deleted.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.confirm !== "RESET") return NextResponse.json({ error: "Type RESET to confirm" }, { status: 400 });
  const sql = db();
  const [ev] = await sql`with d as (delete from events returning 1) select count(*)::int n from d`;
  const [ld] = await sql`with d as (delete from leads where status <> 'paid' or is_test returning 1) select count(*)::int n from d`;
  return NextResponse.json({ ok: true, events: ev.n, leads: ld.n });
}
