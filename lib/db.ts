import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

// Tables are created automatically on first use, so nobody has to run SQL in Neon by hand.
const SCHEMA = [
  `create table if not exists events (
    id bigserial primary key,
    ts timestamptz not null default now(),
    visitor_id text not null,
    session_id text not null,
    name text not null,
    props jsonb not null default '{}'::jsonb,
    path text, referrer text, device text,
    utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text)`,
  `create index if not exists events_ts_idx on events (ts)`,
  `create index if not exists events_session_idx on events (session_id)`,
  `create index if not exists events_name_ts_idx on events (name, ts)`,
  `create table if not exists leads (
    id text primary key,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    name text not null, phone text not null, email text not null, profile text,
    status text not null default 'lead',
    amount integer not null default 0,
    razorpay_order_id text, razorpay_payment_id text,
    paid_at timestamptz, reminder_sent_at timestamptz, confirmation_sent_at timestamptz,
    visitor_id text, session_id text, fbp text, fbc text,
    utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text)`,
  `create index if not exists leads_created_idx on leads (created_at)`,
  `create index if not exists leads_phone_idx on leads (phone)`,
  `create index if not exists leads_status_idx on leads (status)`,
  `alter table leads add column if not exists is_test boolean not null default false`,
  `alter table leads add column if not exists wa_opt_out boolean not null default false`,
  `alter table leads add column if not exists followup_status text not null default 'new'`,
  `alter table leads add column if not exists followup_note text`,
  `alter table leads add column if not exists followed_up_at timestamptz`,
  `alter table leads add column if not exists attended_class1 boolean not null default false`,
  `alter table leads add column if not exists refund_status text not null default 'none'`,
  `alter table leads add column if not exists submit_count integer not null default 1`,
  `create table if not exists kv (k text primary key, v text, updated_at timestamptz not null default now())`,
];

function raw() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

function ensureSchema() {
  if (!schemaReady) {
    const c = raw();
    schemaReady = (async () => {
      for (const stmt of SCHEMA) await c.query(stmt);
    })().catch((err) => {
      schemaReady = null; // retry on the next request
      throw err;
    });
  }
  return schemaReady;
}

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// Same tagged-template API as neon(): db()`select ...`. Makes sure the tables exist first.
export function db() {
  const c = raw();
  return (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]> =>
    ensureSchema().then(() => c(strings, ...values) as Promise<Row[]>);
}

export const hasDb = () => Boolean(process.env.DATABASE_URL);

// Small "last seen" log used by /admin/setup (webhooks, cron runs). Never throws.
export async function mark(k: string, v: string) {
  if (!hasDb()) return;
  try {
    await db()`insert into kv (k, v) values (${k}, ${v.slice(0, 300)})
               on conflict (k) do update set v = excluded.v, updated_at = now()`;
  } catch (err) {
    console.error("kv mark failed", err);
  }
}
