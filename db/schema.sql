-- Run once in the Neon SQL editor.

create table if not exists events (
  id           bigserial primary key,
  ts           timestamptz not null default now(),
  visitor_id   text not null,
  session_id   text not null,
  name         text not null,
  props        jsonb not null default '{}'::jsonb,
  path         text,
  referrer     text,
  device       text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  utm_term     text
);
create index if not exists events_ts_idx on events (ts);
create index if not exists events_session_idx on events (session_id);
create index if not exists events_name_ts_idx on events (name, ts);

create table if not exists leads (
  id                   text primary key,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  name                 text not null,
  phone                text not null,
  email                text not null,
  profile              text,
  status               text not null default 'lead',  -- lead | checkout | paid | failed
  amount               integer not null default 0,     -- in paise
  razorpay_order_id    text,
  razorpay_payment_id  text,
  paid_at              timestamptz,
  reminder_sent_at     timestamptz,
  confirmation_sent_at timestamptz,
  visitor_id           text,
  session_id           text,
  fbp                  text,
  fbc                  text,
  utm_source           text,
  utm_medium           text,
  utm_campaign         text,
  utm_content          text,
  utm_term             text
);
create index if not exists leads_created_idx on leads (created_at);
create index if not exists leads_phone_idx on leads (phone);
create index if not exists leads_status_idx on leads (status);

-- Added later (also applied automatically by lib/db.ts)
alter table leads add column if not exists is_test boolean not null default false;
alter table leads add column if not exists wa_opt_out boolean not null default false;
alter table leads add column if not exists followup_status text not null default 'new';
alter table leads add column if not exists followup_note text;
alter table leads add column if not exists followed_up_at timestamptz;
alter table leads add column if not exists attended_class1 boolean not null default false;
alter table leads add column if not exists refund_status text not null default 'none';
