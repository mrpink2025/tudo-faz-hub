-- Create/replace timestamp trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create listing_locations table
create table if not exists public.listing_locations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  address_line1 text,
  address_line2 text,
  neighborhood text,
  city text not null,
  state text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.listing_locations enable row level security;

-- Policies: owners and admins can manage
drop policy if exists "Owners and admins can select listing_locations" on public.listing_locations;
create policy "Owners and admins can select listing_locations"
on public.listing_locations
for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (
        l.user_id = auth.uid()
        or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
      )
  )
);

drop policy if exists "Owners and admins can insert listing_locations" on public.listing_locations;
create policy "Owners and admins can insert listing_locations"
on public.listing_locations
for insert
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (
        l.user_id = auth.uid()
        or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
      )
  )
);

drop policy if exists "Owners and admins can update listing_locations" on public.listing_locations;
create policy "Owners and admins can update listing_locations"
on public.listing_locations
for update
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (
        l.user_id = auth.uid()
        or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
      )
  )
);

drop policy if exists "Owners and admins can delete listing_locations" on public.listing_locations;
create policy "Owners and admins can delete listing_locations"
on public.listing_locations
for delete
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (
        l.user_id = auth.uid()
        or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
      )
  )
);

-- Trigger for updated_at
drop trigger if exists update_listing_locations_updated_at on public.listing_locations;
create trigger update_listing_locations_updated_at
before update on public.listing_locations
for each row
execute function public.update_updated_at_column();

-- Helpful indexes
create index if not exists idx_listing_locations_listing_id on public.listing_locations(listing_id);
create index if not exists idx_listing_locations_city on public.listing_locations(city);
create index if not exists idx_listing_locations_state on public.listing_locations(state);

-- Public view exposing only non-sensitive fields
create or replace view public.listing_locations_public as
select
  listing_id,
  neighborhood,
  city,
  state
from public.listing_locations;

-- Allow everyone to read the public view
grant select on public.listing_locations_public to anon, authenticated;