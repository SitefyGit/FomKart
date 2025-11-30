-- Creator posts table to support profile activity updates
create table if not exists public.creator_posts (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  caption text,
  post_type text not null check (post_type in ('text','image','video')),
  media_url text,
  video_url text,
  video_provider text,
  video_id text,
  link_url text,
  tags text[] default '{}'::text[],
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists creator_posts_creator_idx on public.creator_posts (creator_id, created_at desc);

alter table public.creator_posts enable row level security;

drop policy if exists "Anyone can view public creator posts" on public.creator_posts;
create policy "Anyone can view public creator posts"
  on public.creator_posts
  for select
  using (is_public = true);

drop policy if exists "Creators manage own posts" on public.creator_posts;
create policy "Creators manage own posts"
  on public.creator_posts
  for all
  using (auth.uid() = creator_id);

create trigger creator_posts_updated_at before update on public.creator_posts
  for each row execute procedure public.handle_updated_at();
