-- Profiles table for user data
create table if not exists public.profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy if not exists "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy if not exists "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy if not exists "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- Trigger to maintain updated_at
create trigger if not exists update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Function to handle new users and insert into profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), null)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger on auth.users to create profile row
create trigger if not exists on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for listing images
insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do nothing;

-- Storage policies for listing images
create policy if not exists "Listing images are publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'listing-media');

create policy if not exists "Users can upload their listing images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can update their listing images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can delete their listing images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Realtime settings for messages
alter table public.messages replica identity full;
alter publication supabase_realtime add table public.messages;