import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

const COLS = [
  "created_at", "name", "phone", "email", "profile", "status", "paid_at", "reminder_sent_at",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "razorpay_payment_id",
  "followup_status", "followup_note", "attended_class1", "refund_status", "is_test",
] as const;

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("unauthorized", { status: 401 });
  const paidOnly = new URL(req.url).searchParams.get("status") === "paid";
  const rows = (paidOnly
    ? await db()`select * from leads where status = 'paid' and not is_test order by paid_at`
    : await db()`select * from leads order by created_at desc`) as Record<string, unknown>[];
  const csv = [COLS.join(","), ...rows.map((r) => COLS.map((c) => esc(r[c])).join(","))].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${paidOnly ? "students" : "leads"}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
