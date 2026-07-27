-- Creator OS v1.5 — schema Supabase
-- Corre esto en: Supabase Dashboard → SQL Editor → New query → Run

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
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "creator_ideas_own" on public.creator_ideas;
create policy "creator_ideas_own"
  on public.creator_ideas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
