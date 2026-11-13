-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '📸',
  share_token text unique,
  created_at timestamptz not null default now()
);

-- For databases created before share links existed:
alter table accounts add column if not exists share_token text unique;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  title text not null default '',
  status text not null default 'idea'
    check (status in ('idea','to_edit','editing','ready','posted')),
  post_type text not null default 'reel'
    check (post_type in ('reel','photo','carousel','story')),
  planned_at timestamptz,
  caption text not null default '',
  hashtags text not null default '',
  audio_note text not null default '',
  edit_notes text not null default '',
  inspo_url text not null default '',
  inspo_image_url text not null default '',
  thumbnail_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_account_planned_idx on posts (account_id, planned_at);

-- Lock the tables: only the server (service-role key) can read/write them.
alter table accounts enable row level security;
alter table posts enable row level security;

-- Public bucket for inspo screenshots + final thumbnails (files have random names).
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;
