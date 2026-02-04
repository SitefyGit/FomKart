-- Enable Realtime for notifications table
-- Run this in your Supabase SQL Editor

begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for all tables;
commit;

-- OR if you want to be selective (default Supabase setup usually has supabase_realtime created)
-- alter publication supabase_realtime add table public.notifications;
