-- Images support: bucket, table, policies, and cover_image
begin;

-- 1) Add cover_image to listings
alter table public.listings
  add column if not exists cover_image text;

-- 2) Table to store multiple images per listing
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.listing_images enable row level security;

-- Drop old policies if they exist (idempotent)
drop policy if exists "Public can view images for published listings or owner or admin" on public.listing_images;
drop policy if exists "Users can insert images for their own listings" on public.listing_images;
drop policy if exists "Users can update their own listing images" on public.listing_images;
drop policy if exists "Users can delete their own listing images" on public.listing_images;

-- Policies
create policy "Public can view images for published listings or owner or admin"
  on public.listing_images
  for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (
          (l.approved = true and l.status = 'published')
          or l.user_id = auth.uid()
          or public.has_role(auth.uid(), 'admin')
        )
    )
  );

create policy "Users can insert images for their own listings"
  on public.listing_images
  for insert
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
    )
  );

create policy "Users can update their own listing images"
  on public.listing_images
  for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
    )
  );

create policy "Users can delete their own listing images"
  on public.listing_images
  for delete
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
    )
  );

-- Helpful index
create index if not exists idx_listing_images_listing_id_position on public.listing_images (listing_id, position);

-- 3) Storage bucket for images
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Storage policies for bucket 'listing-images'
-- Public read
drop policy if exists "Public can read listing images" on storage.objects;
create policy "Public can read listing images"
  on storage.objects
  for select
  using (bucket_id = 'listing-images');

-- Authenticated users can upload/update/delete within their own folder (top-level folder = user id)
-- INSERT
drop policy if exists "Users can upload their own listing images" on storage.objects;
create policy "Users can upload their own listing images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE
drop policy if exists "Users can update their own listing images" on storage.objects;
create policy "Users can update their own listing images"
  on storage.objects
  for update
  using (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE
drop policy if exists "Users can delete their own listing images" on storage.objects;
create policy "Users can delete their own listing images"
  on storage.objects
  for delete
  using (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

commit;