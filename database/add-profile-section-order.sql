-- Adds a column to store preferred section order on creator profiles
alter table if exists public.users
  add column if not exists profile_section_order text[] default null;
