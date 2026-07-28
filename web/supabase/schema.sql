-- Ideazo — schema Supabase (repo: creator-os)
-- Prefer applying via MCP `apply_migration` or: Dashboard → SQL Editor → Run
-- Re-run safe: uses IF NOT EXISTS / DROP POLICY IF EXISTS

create table if not exists public.creator_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_ideas (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  idea jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists creator_ideas_user_updated_idx
  on public.creator_ideas (user_id, updated_at desc);

alter table public.creator_profiles enable row level security;
alter table public.creator_ideas enable row level security;

drop policy if exists "creator_profiles_own" on public.creator_profiles;
create policy "creator_profiles_own"
  on public.creator_profiles
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "creator_ideas_own" on public.creator_ideas;
create policy "creator_ideas_own"
  on public.creator_ideas
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Billing / usage (cupo mensual free; plan pro solo asignación manual)
-- ---------------------------------------------------------------------------

create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active',
  updated_at timestamptz not null default now()
);

-- Limpieza si venía de schema con Stripe
alter table public.billing_subscriptions
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  drop column if exists current_period_end;

create table if not exists public.usage_monthly (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  generations_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.billing_subscriptions enable row level security;
alter table public.usage_monthly enable row level security;

drop policy if exists "billing_subscriptions_own_select" on public.billing_subscriptions;
create policy "billing_subscriptions_own_select"
  on public.billing_subscriptions
  for select
  using ((select auth.uid()) = user_id);

-- Escrituras solo via service role. El cliente no puede auto-asignarse plan "pro".
drop policy if exists "billing_subscriptions_own_write" on public.billing_subscriptions;
drop policy if exists "billing_subscriptions_own_update" on public.billing_subscriptions;

drop policy if exists "usage_monthly_own_select" on public.usage_monthly;
create policy "usage_monthly_own_select"
  on public.usage_monthly
  for select
  using ((select auth.uid()) = user_id);

-- Sin escritura directa del cliente: solo increment_ai_generation (security definer).
drop policy if exists "usage_monthly_own_upsert" on public.usage_monthly;

create or replace function public.increment_ai_generation(p_month text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_count int;
  user_plan text;
  user_status text;
  effective_limit int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select plan, status into user_plan, user_status
  from public.billing_subscriptions
  where user_id = uid;

  if user_plan = 'pro' and user_status in ('active', 'trialing') then
    effective_limit := 500;
  else
    effective_limit := 15;
  end if;

  insert into public.usage_monthly as u (user_id, month, generations_count, updated_at)
  values (uid, p_month, 1, now())
  on conflict (user_id, month)
  do update set
    generations_count = u.generations_count + 1,
    updated_at = now()
  where u.generations_count < effective_limit
  returning generations_count into new_count;

  if new_count is null then
    raise exception 'usage_limit';
  end if;

  return new_count;
end;
$$;

revoke all on function public.increment_ai_generation(text) from public;
grant execute on function public.increment_ai_generation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Soft launch: invites + waitlist + funnel
-- ---------------------------------------------------------------------------

create table if not exists public.invite_codes (
  code text primary key,
  max_uses int not null default 10,
  uses int not null default 0,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_access (
  user_id uuid primary key references auth.users (id) on delete cascade,
  invite_code text references public.invite_codes (code),
  granted_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.funnel_events (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  event text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_event_created_idx
  on public.funnel_events (event, created_at desc);

alter table public.invite_codes enable row level security;
alter table public.user_access enable row level security;
alter table public.waitlist enable row level security;
alter table public.funnel_events enable row level security;

-- Invites: sin SELECT público; canje solo vía redeem_invite_code (security definer).
drop policy if exists "invite_codes_select_active" on public.invite_codes;

drop policy if exists "user_access_own" on public.user_access;
create policy "user_access_own"
  on public.user_access
  for select
  using ((select auth.uid()) = user_id);

-- Waitlist insert abierto (anon + authenticated); sin lectura pública
drop policy if exists "waitlist_insert" on public.waitlist;
create policy "waitlist_insert"
  on public.waitlist
  for insert
  with check (true);

drop policy if exists "funnel_events_insert_own" on public.funnel_events;
create policy "funnel_events_insert_own"
  on public.funnel_events
  for insert
  to authenticated
  with check (
    user_id is null or (select auth.uid()) = user_id
  );

create or replace function public.redeem_invite_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  normalized text := lower(trim(p_code));
  row_code public.invite_codes%rowtype;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.user_access where user_id = uid) then
    return true;
  end if;

  select * into row_code
  from public.invite_codes
  where lower(code) = normalized and active = true
  for update;

  if not found then
    raise exception 'invalid_invite';
  end if;

  if row_code.uses >= row_code.max_uses then
    raise exception 'invite_exhausted';
  end if;

  update public.invite_codes
  set uses = uses + 1
  where code = row_code.code;

  insert into public.user_access (user_id, invite_code)
  values (uid, row_code.code);

  return true;
end;
$$;

revoke all on function public.redeem_invite_code(text) from public;
grant execute on function public.redeem_invite_code(text) to authenticated;

-- Seed soft-launch invite (cámbialo en producción)
insert into public.invite_codes (code, max_uses, note)
values ('IDEAZO-EARLY', 25, 'Soft launch seed')
on conflict (code) do nothing;
