create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role text not null check (role in ('chairman','treasurer','coordinator','sub_coordinator')),
  created_at timestamptz not null default now()
);

create table if not exists funds (
  id uuid primary key default uuid_generate_v4(),
  amount numeric(12,2) not null check (amount > 0),
  source text not null,
  donor_name text not null,
  note text,
  added_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  assigned_to uuid references users(id),
  created_by uuid references users(id),
  status text not null check (status in ('pending','in_progress','completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  deadline date,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount > 0),
  requested_by uuid references users(id),
  status text not null check (status in ('pending_main','pending_chairman','pending_treasurer','released','rejected')),
  main_approved_by uuid references users(id),
  chairman_approved_by uuid references users(id),
  released_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists bills (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,
  amount numeric(12,2) not null,
  proof_note text not null,
  photo_url text,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
