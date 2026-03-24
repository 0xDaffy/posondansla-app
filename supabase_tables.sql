-- PosonDansla: Supabase schema + RLS
-- Run this in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

-- Profiles tied to Supabase Auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique not null,
  role text not null check (role in ('chairman','treasurer','coordinator','sub')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  source text not null,
  donor_name text not null,
  note text,
  date date not null default current_date,
  added_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Drinks','Food','Ice','Cups','Equipment','Decorations','Transport','Miscellaneous')),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  requested_by uuid not null references public.profiles(id),
  requested_by_role text not null check (requested_by_role in ('chairman','treasurer','coordinator','sub')),
  status text not null check (status in ('pending_main','pending_chairman','pending_treasurer','released','rejected')),
  main_approved_by uuid references public.profiles(id),
  chairman_approved_by uuid references public.profiles(id),
  released_by uuid references public.profiles(id),
  rejected_by uuid references public.profiles(id),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  status text not null check (status in ('pending','in_progress','completed')),
  progress int not null default 0 check (progress between 0 and 100),
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  requested_by uuid not null references public.profiles(id),
  deadline date,
  priority text not null check (priority in ('low','medium','high')),
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  proof_note text,
  photo_path text,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_by_role text not null check (uploaded_by_role in ('chairman','treasurer','coordinator','sub')),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  visibility text not null check (visibility in ('all','main_coordinator')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.chairman_requests (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  priority text not null check (priority in ('low','medium','high')),
  message text not null,
  created_by uuid not null references public.profiles(id),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Single JSON state snapshot for web app sync (cross-device)
create table if not exists public.app_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Updated timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

drop trigger if exists trg_task_requests_updated_at on public.task_requests;
create trigger trg_task_requests_updated_at before update on public.task_requests for each row execute function public.set_updated_at();

drop trigger if exists trg_chairman_requests_updated_at on public.chairman_requests;
create trigger trg_chairman_requests_updated_at before update on public.chairman_requests for each row execute function public.set_updated_at();

-- Auto-create profile when auth user created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'username', lower(split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data->>'role', 'sub')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.funds enable row level security;
alter table public.expenses enable row level security;
alter table public.tasks enable row level security;
alter table public.task_requests enable row level security;
alter table public.bills enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.chairman_requests enable row level security;
alter table public.app_state enable row level security;

-- helper: current user role
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Profiles policies
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid());

-- Funds policies
drop policy if exists "funds read by all roles" on public.funds;
create policy "funds read by all roles" on public.funds
  for select using (auth.uid() is not null);

drop policy if exists "funds insert treasurer only" on public.funds;
create policy "funds insert treasurer only" on public.funds
  for insert with check (public.current_role() = 'treasurer');

-- Expenses policies
drop policy if exists "expenses read by all roles" on public.expenses;
create policy "expenses read by all roles" on public.expenses
  for select using (auth.uid() is not null);

drop policy if exists "expenses insert by chairman coordinator sub" on public.expenses;
create policy "expenses insert by chairman coordinator sub" on public.expenses
  for insert with check (public.current_role() in ('chairman','coordinator','sub'));

drop policy if exists "expenses update by approvers" on public.expenses;
create policy "expenses update by approvers" on public.expenses
  for update using (public.current_role() in ('chairman','coordinator','treasurer'));

-- Tasks policies
drop policy if exists "tasks read all" on public.tasks;
create policy "tasks read all" on public.tasks
  for select using (auth.uid() is not null);

drop policy if exists "tasks create chairman coordinator sub" on public.tasks;
create policy "tasks create chairman coordinator sub" on public.tasks
  for insert with check (public.current_role() in ('chairman','coordinator','sub'));

drop policy if exists "tasks update coordinator sub" on public.tasks;
create policy "tasks update coordinator sub" on public.tasks
  for update using (public.current_role() in ('coordinator','sub','chairman'));

-- Task requests
drop policy if exists "task_requests read all" on public.task_requests;
create policy "task_requests read all" on public.task_requests
  for select using (auth.uid() is not null);

drop policy if exists "task_requests insert sub" on public.task_requests;
create policy "task_requests insert sub" on public.task_requests
  for insert with check (public.current_role() = 'sub');

drop policy if exists "task_requests update coordinator" on public.task_requests;
create policy "task_requests update coordinator" on public.task_requests
  for update using (public.current_role() = 'coordinator');

-- Bills
drop policy if exists "bills read all rows" on public.bills;
create policy "bills read all rows" on public.bills
  for select using (auth.uid() is not null);

drop policy if exists "bills insert by all roles" on public.bills;
create policy "bills insert by all roles" on public.bills
  for insert with check (public.current_role() in ('chairman','treasurer','coordinator','sub'));

-- Notifications
drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications
  for select using (user_id = auth.uid() or user_id is null);

drop policy if exists "notifications insert authenticated" on public.notifications;
create policy "notifications insert authenticated" on public.notifications
  for insert with check (auth.uid() is not null);

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications
  for update using (user_id = auth.uid());

-- Announcements
drop policy if exists "announcements read auth" on public.announcements;
create policy "announcements read auth" on public.announcements
  for select using (auth.uid() is not null);

drop policy if exists "announcements insert chairman" on public.announcements;
create policy "announcements insert chairman" on public.announcements
  for insert with check (public.current_role() = 'chairman');

-- Chairman requests
drop policy if exists "chairman_requests read auth" on public.chairman_requests;
create policy "chairman_requests read auth" on public.chairman_requests
  for select using (auth.uid() is not null);

drop policy if exists "chairman_requests insert coordinator" on public.chairman_requests;
create policy "chairman_requests insert coordinator" on public.chairman_requests
  for insert with check (public.current_role() = 'coordinator');

drop policy if exists "chairman_requests update chairman" on public.chairman_requests;
create policy "chairman_requests update chairman" on public.chairman_requests
  for update using (public.current_role() = 'chairman');

-- App state policies (anon/client sync)
drop policy if exists "app_state select all" on public.app_state;
create policy "app_state select all" on public.app_state
  for select using (true);

drop policy if exists "app_state insert all" on public.app_state;
create policy "app_state insert all" on public.app_state
  for insert with check (true);

drop policy if exists "app_state update all" on public.app_state;
create policy "app_state update all" on public.app_state
  for update using (true);

-- Storage bucket for bill photos
insert into storage.buckets (id, name, public)
values ('bills', 'bills', false)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "bills bucket read auth" on storage.objects;
create policy "bills bucket read auth" on storage.objects
  for select using (bucket_id = 'bills' and auth.uid() is not null);

drop policy if exists "bills bucket upload auth" on storage.objects;
create policy "bills bucket upload auth" on storage.objects
  for insert with check (bucket_id = 'bills' and auth.uid() is not null);

drop policy if exists "bills bucket update owner" on storage.objects;
create policy "bills bucket update owner" on storage.objects
  for update using (bucket_id = 'bills' and auth.uid() = owner);

drop policy if exists "bills bucket delete owner" on storage.objects;
create policy "bills bucket delete owner" on storage.objects
  for delete using (bucket_id = 'bills' and auth.uid() = owner);
