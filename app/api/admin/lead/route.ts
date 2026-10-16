import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

const FOLLOWUP = ["new", "messaged", "interested", "not_interested", "no_reply"];
const REFUND = ["none", "requested", "refunded"];

// Updates follow-up / student fields on one lead from the admin dashboard.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (typeof b.id !== "string") return NextResponse.json({ error: "id required" }, { status: 400 });
  const sql = db();

  if (FOLLOWUP.includes(b.followup_status))
    await sql`update leads set followup_status = ${b.followup_status}, followed_up_at = now(), updated_at = now() where id = ${b.id}`;
  if (typeof b.followup_note === "string")
    await sql`update leads set followup_note = ${b.followup_note.slice(0, 500)}, updated_at = now() where id = ${b.id}`;
  if (typeof b.wa_opt_out === "boolean")
    await sql`update leads set wa_opt_out = ${b.wa_opt_out}, updated_at = now() where id = ${b.id}`;
  if (typeof b.attended_class1 === "boolean")
    await sql`update leads set attended_class1 = ${b.attended_class1}, updated_at = now() where id = ${b.id}`;
  if (REFUND.includes(b.refund_status))
    await sql`update leads set refund_status = ${b.refund_status}, updated_at = now() where id = ${b.id}`;

  return NextResponse.json({ ok: true });
}
