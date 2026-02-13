-- BC Golf Safaris Team Chat - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Channels table
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  is_private boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Channel members
create table public.channel_members (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(channel_id, user_id)
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  channel_id uuid references public.channels(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Direct messages table
create table public.direct_messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Push subscriptions for notifications
create table public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, endpoint)
);

-- Create indexes for better query performance
create index idx_messages_channel_id on public.messages(channel_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_direct_messages_participants on public.direct_messages(sender_id, recipient_id);
create index idx_direct_messages_created_at on public.direct_messages(created_at desc);
create index idx_channel_members_user_id on public.channel_members(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.direct_messages enable row level security;
alter table public.push_subscriptions enable row level security;

-- RLS Policies

-- Profiles: users can read all active profiles, update only their own
create policy "Profiles are viewable by authenticated users" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Channels: authenticated users can read public channels
create policy "Public channels are viewable" on public.channels
  for select using (auth.role() = 'authenticated' and (not is_private or exists (
    select 1 from public.channel_members where channel_id = id and user_id = auth.uid()
  )));

create policy "Admins can create channels" on public.channels
  for insert with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Admins can update channels" on public.channels
  for update using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Admins can delete channels" on public.channels
  for delete using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Channel members
create policy "Channel members viewable by members" on public.channel_members
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage channel members" on public.channel_members
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Messages: users can read messages in channels they're members of
create policy "Channel messages viewable by members" on public.messages
  for select using (
    auth.role() = 'authenticated' and 
    exists (select 1 from public.channel_members where channel_id = messages.channel_id and user_id = auth.uid())
  );

create policy "Members can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from public.channel_members where channel_id = messages.channel_id and user_id = auth.uid())
  );

-- Direct messages: users can only see their own DMs
create policy "Users can view their DMs" on public.direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can send DMs" on public.direct_messages
  for insert with check (auth.uid() = sender_id);

-- Push subscriptions: users can only manage their own
create policy "Users can view own push subscriptions" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create default General channel
insert into public.channels (id, name, description, is_private)
values ('00000000-0000-0000-0000-000000000001', 'General', 'General team chat', false);

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.channel_members;
