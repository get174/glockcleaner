-- Migration 001: Profiles table with auto-creation on signup
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. RLS Policies - Drop existing first
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "System can insert profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "System can insert profiles"
  on public.profiles for insert
  with check (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_email text;
  user_full_name text;
  user_phone text;
  raw_meta jsonb;
  user_meta jsonb;
begin
  user_email := new.email;
  raw_meta := new.raw_user_meta_data;
  user_meta := new.user_metadata;

  -- Debug logs
  raise notice 'New user created: %', user_email;
  raise notice 'Raw user meta data: %', raw_meta;
  raise notice 'User meta data: %', user_meta;

  -- Extract data with fallbacks
  user_full_name := coalesce(
    raw_meta->>'full_name',
    user_meta->>'full_name',
    'User'
  );

  user_phone := coalesce(
    raw_meta->>'phone',
    user_meta->>'phone'
  );

  raise notice 'Final values - Name: %, Phone: %', user_full_name, user_phone;

  -- Insert profile
  insert into public.profiles (id, full_name, phone)
  values (new.id, user_full_name, user_phone);

  raise notice 'Profile created successfully for user %', user_email;

  return new;
exception
  when others then
    raise notice 'Error creating profile for user %: %', user_email, sqlerrm;
    return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 5. Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
