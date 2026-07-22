-- Premium subscriptions (Razorpay) — operator billing state.
-- Roles still live in auth.users raw_app_meta_data; this table is the payment source of truth.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  razorpay_customer_id text,
  razorpay_subscription_id text unique,
  plan_currency text not null check (plan_currency in ('INR', 'USD')),
  status text not null default 'created'
    check (status in (
      'created',
      'authenticated',
      'active',
      'pending',
      'halted',
      'cancelled',
      'completed',
      'expired',
      'paused'
    )),
  current_period_end timestamptz,
  manual_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_uidx
  on public.subscriptions (user_id);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

create table if not exists public.billing_webhook_events (
  id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

-- Users can read their own subscription row only.
create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete for authenticated clients — service role only.
