-- ============================================================
-- Servix Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'user' check (role in ('user', 'professional')),
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  cover_url text,
  country_code text,
  city text,
  language text default 'en',
  dark_mode boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- PROFESSIONAL DETAILS TABLE
-- ============================================================
create table if not exists public.professional_details (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  profession text,
  specialization text,
  bio text,
  price numeric(10, 2),
  currency text default 'USD',
  is_available boolean default true,
  rating numeric(3, 2) default 0,
  total_reviews integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(profile_id)
);

alter table public.professional_details enable row level security;
create policy "Professional details are viewable by everyone" on public.professional_details for select using (true);
create policy "Professionals can manage their own details" on public.professional_details for all using (auth.uid() = profile_id);

-- ============================================================
-- REQUESTS TABLE
-- ============================================================
create table if not exists public.requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed')),
  message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.requests enable row level security;
create policy "Users can view their own requests" on public.requests for select using (auth.uid() = user_id or auth.uid() = professional_id);
create policy "Users can create requests" on public.requests for insert with check (auth.uid() = user_id);
create policy "Involved parties can update requests" on public.requests for update using (auth.uid() = user_id or auth.uid() = professional_id);

-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now() not null,
  unique(user_id, professional_id)
);

alter table public.conversations enable row level security;
create policy "Users can view their conversations" on public.conversations for select using (auth.uid() = user_id or auth.uid() = professional_id);
create policy "Users can create conversations" on public.conversations for insert with check (auth.uid() = user_id or auth.uid() = professional_id);
create policy "Users can update their conversations" on public.conversations for update using (auth.uid() = user_id or auth.uid() = professional_id);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;
create policy "Users can view messages in their conversations" on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id
      and (user_id = auth.uid() or professional_id = auth.uid())
    )
  );
create policy "Users can send messages" on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where id = conversation_id
      and (user_id = auth.uid() or professional_id = auth.uid())
    )
  );
create policy "Users can update their own message read status" on public.messages for update
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id
      and (user_id = auth.uid() or professional_id = auth.uid())
    )
  );

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  request_id uuid references public.requests(id) on delete cascade not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now() not null,
  unique(reviewer_id, request_id)
);

alter table public.reviews enable row level security;
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Auto-update professional rating trigger
create or replace function update_professional_rating()
returns trigger as $$
begin
  update public.professional_details
  set
    rating = (select avg(rating) from public.reviews where professional_id = new.professional_id),
    total_reviews = (select count(*) from public.reviews where professional_id = new.professional_id),
    updated_at = now()
  where profile_id = new.professional_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_insert
  after insert on public.reviews
  for each row execute function update_professional_rating();

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;
create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Anyone can insert notifications" on public.notifications for insert with check (true);
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- BLOCKS TABLE
-- ============================================================
create table if not exists public.blocks (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(blocker_id, blocked_id)
);

alter table public.blocks enable row level security;
create policy "Users can view their own blocks" on public.blocks for select using (auth.uid() = blocker_id);
create policy "Users can create blocks" on public.blocks for insert with check (auth.uid() = blocker_id);
create policy "Users can delete their own blocks" on public.blocks for delete using (auth.uid() = blocker_id);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  details text,
  created_at timestamptz default now() not null
);

alter table public.reports enable row level security;
create policy "Users can create reports" on public.reports for insert with check (auth.uid() = reporter_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;

create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload their avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users can update their avatar" on storage.objects for update with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Cover images are publicly accessible" on storage.objects for select using (bucket_id = 'covers');
create policy "Users can upload their cover" on storage.objects for insert with check (bucket_id = 'covers' and auth.role() = 'authenticated');
create policy "Users can update their cover" on storage.objects for update with check (bucket_id = 'covers' and auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at before update on public.profiles for each row execute function handle_updated_at();
create trigger handle_professional_details_updated_at before update on public.professional_details for each row execute function handle_updated_at();
create trigger handle_requests_updated_at before update on public.requests for each row execute function handle_updated_at();
