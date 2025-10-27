-- Guards for orders: enforce status transitions and set deadlines

-- 1) Add approve_by column if missing
alter table public.orders add column if not exists approve_by timestamp with time zone;

-- 2) Trigger function to enforce transitions and set timestamps
create or replace function public.orders_status_guard()
returns trigger as $$
declare
  v_uid uuid := auth.uid();
begin
  -- Ensure only buyer or seller can update (RLS should already cover this)
  if not (v_uid = new.buyer_id or v_uid = new.seller_id) then
    raise exception 'Not allowed';
  end if;

  -- Only seller can mark delivered
  if new.status = 'delivered' and v_uid <> new.seller_id then
    raise exception 'Only the seller can mark as delivered';
  end if;

  -- Only buyer can mark completed or request revision
  if new.status = 'completed' and v_uid <> new.buyer_id then
    raise exception 'Only the buyer can mark as completed';
  end if;
  if new.status = 'revision_requested' and v_uid <> new.buyer_id then
    raise exception 'Only the buyer can request revision';
  end if;

  -- Auto set timestamps on key transitions
  if new.status = 'delivered' and (old.status is distinct from new.status) then
    new.delivered_at := timezone('utc', now());
    new.approve_by := timezone('utc', now()) + interval '3 days';
  end if;
  if new.status = 'completed' and (old.status is distinct from new.status) then
    new.completed_at := timezone('utc', now());
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 3) Attach trigger
drop trigger if exists trg_orders_status_guard on public.orders;
create trigger trg_orders_status_guard
before update on public.orders
for each row execute procedure public.orders_status_guard();

notify pgrst, 'reload schema';
