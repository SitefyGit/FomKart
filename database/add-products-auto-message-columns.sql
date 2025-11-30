-- Migration: add automated message support to products table
-- Run this once in Supabase SQL editor or via `supabase db push`

alter table public.products
  add column if not exists auto_message text;

alter table public.products
  add column if not exists auto_message_enabled boolean default false;

-- Refresh PostgREST schema cache so the new columns are immediately available
select pg_notify('postgrest', 'reload schema');
