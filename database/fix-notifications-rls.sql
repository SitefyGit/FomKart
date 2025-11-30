-- Fix RLS policies for notifications table

-- Enable RLS if not already enabled
alter table public.notifications enable row level security;

-- Drop existing policies if they exist, to prevent errors on re-run
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can create notifications for themselves" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can delete their own notifications" on public.notifications;


-- Create policies
create policy "Users can view their own notifications" on public.notifications 
  for select using (auth.uid() = user_id);

create policy "Users can create notifications for themselves" on public.notifications 
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own notifications" on public.notifications 
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);
