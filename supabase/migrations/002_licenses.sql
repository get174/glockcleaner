-- Migration 002: Licenses table for GlockCleaner
-- Run this in your Supabase SQL Editor

-- 1. Create licenses table
create table if not exists public.licenses (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  license_key text unique not null,
  payment_id text unique not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.licenses enable row level security;

-- 3. RLS Policies - Only service role can access
drop policy if exists "Service role can manage licenses" on public.licenses;

create policy "Service role can manage licenses"
  on public.licenses for all
  using (auth.role() = 'service_role');

-- 4. Index for performance
create index if not exists idx_licenses_license_key on public.licenses (license_key);
create index if not exists idx_licenses_payment_id on public.licenses (payment_id);
create index if not exists idx_licenses_email on public.licenses (email);