-- Digital deliverables + auto-delivery support

alter table if exists public.products
  add column if not exists digital_files jsonb default '[]'::jsonb,
  add column if not exists course_delivery jsonb,
  add column if not exists auto_deliver boolean default false;

update public.products
set digital_files = '[]'::jsonb
where digital_files is null;

update public.products
set auto_deliver = coalesce(auto_deliver, false);

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'digital-products') then
    insert into storage.buckets (id, name, public) values ('digital-products', 'digital-products', true);
  end if;
end $$;

drop policy if exists "Public can read digital-products" on storage.objects;
create policy "Public can read digital-products"
  on storage.objects for select to public
  using (bucket_id = 'digital-products');

drop policy if exists "Authenticated can upload digital-products" on storage.objects;
create policy "Authenticated can upload digital-products"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'digital-products');

drop policy if exists "Owners can delete digital-products" on storage.objects;
create policy "Owners can delete digital-products"
  on storage.objects for delete to authenticated
  using (bucket_id = 'digital-products' and owner = auth.uid());

notify pgrst, 'reload schema';
