import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Cheap poll for the admin live feed: only events newer than `after`, plus who is on the page right now.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const after = Number(new URL(req.url).searchParams.get("after") || 0) || 0;
  const sql = db();
  const [events, active] = await Promise.all([
    sql`select id::text as id, ts, name, props, visitor_id, session_id, utm_source, device
          from events where id > ${after} and ts > now() - interval '5 minutes'
         order by id desc limit 200`,
    sql`select count(distinct session_id)::int n from events where ts > now() - interval '2 minutes'`,
  ]);
  return NextResponse.json(
    { events, activeNow: active[0]?.n ?? 0 },
    { headers: { "Cache-Control": "no-store" } }
  );
}
