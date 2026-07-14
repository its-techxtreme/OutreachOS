-- Curated showcase set for the public demo account (max 100 leads).
create table if not exists public.demo_sample_leads (
  lead_id bigint primary key references public.leads(id) on delete cascade,
  selected_at timestamptz not null default now()
);

alter table public.demo_sample_leads enable row level security;

revoke all on table public.demo_sample_leads from anon, authenticated;
grant select, insert, delete, truncate on table public.demo_sample_leads to service_role;
