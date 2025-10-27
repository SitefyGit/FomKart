-- Orders messaging & deliverables: RLS policies, indexes, and storage bucket

-- 1) Ensure tables exist (schema.sql already creates them). Create helpful indexes
create index if not exists idx_order_messages_order_id on public.order_messages(order_id);
create index if not exists idx_order_deliverables_order_id on public.order_deliverables(order_id);

-- 2) Enable RLS and add policies for order_messages
alter table public.order_messages enable row level security;
drop policy if exists "Participants can select order messages" on public.order_messages;
drop policy if exists "Participants can insert order messages" on public.order_messages;

create policy "Participants can select order messages"
  on public.order_messages for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_messages.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

create policy "Participants can insert order messages"
  on public.order_messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.orders o
      where o.id = order_messages.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- 3) Enable RLS and add policies for order_deliverables
alter table public.order_deliverables enable row level security;
drop policy if exists "Participants can select deliverables" on public.order_deliverables;
drop policy if exists "Participants can insert deliverables" on public.order_deliverables;
drop policy if exists "Uploader can delete deliverables" on public.order_deliverables;

create policy "Participants can select deliverables"
  on public.order_deliverables for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_deliverables.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

create policy "Participants can insert deliverables"
  on public.order_deliverables for insert
  with check (
    uploaded_by = auth.uid() and
    exists (
      select 1 from public.orders o
      where o.id = order_deliverables.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

create policy "Uploader can delete deliverables"
  on public.order_deliverables for delete
  using (uploaded_by = auth.uid());

-- 4) Storage: create bucket for order deliveries if missing, and policies
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'order-deliveries') then
    insert into storage.buckets (id, name, public) values ('order-deliveries', 'order-deliveries', true);
  end if;
end $$;

-- Allow read access to public objects (bucket is public)
drop policy if exists "Public can read order-deliveries" on storage.objects;
create policy "Public can read order-deliveries"
  on storage.objects for select to public
  using (bucket_id = 'order-deliveries');

-- Allow authenticated users to upload; object owner is set automatically
drop policy if exists "Authenticated can upload order-deliveries" on storage.objects;
create policy "Authenticated can upload order-deliveries"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'order-deliveries');

-- Allow owners to delete their own uploaded files
drop policy if exists "Owners can delete order-deliveries" on storage.objects;
create policy "Owners can delete order-deliveries"
  on storage.objects for delete to authenticated
  using (bucket_id = 'order-deliveries' and owner = auth.uid());

-- Reload
notify pgrst, 'reload schema';

-- 5) Notifications RLS (ensure app can read/write notifications)
alter table if exists public.notifications enable row level security;
drop policy if exists "Users can select own notifications" on public.notifications;
drop policy if exists "Users can insert own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

create policy "Users can select own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- If an admin/service role needs to insert on behalf of users, that should use the service key (bypasses RLS)
notify pgrst, 'reload schema';
