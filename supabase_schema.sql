-- ─── Rhodes Bachelorette App — Supabase Schema ───────────────────────────────
-- Run this in: Supabase → SQL Editor → New query

-- 1. Trips
create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  destination text,
  start_date  date,
  end_date    date,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- 2. Trip members
create table if not exists trip_members (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid references trips(id) on delete cascade,
  user_id      uuid references auth.users(id),
  display_name text,
  avatar_url   text,
  role         text default 'guest', -- bride | maid | guest
  joined_at    timestamptz default now()
);

-- 3. Schedule items
create table if not exists schedule_items (
  id        uuid primary key default gen_random_uuid(),
  trip_id   uuid references trips(id) on delete cascade,
  day       date not null,
  time      time not null,
  title     text not null,
  location  text,
  emoji     text,
  icon      text,
  maps_query text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 4. Chat messages
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references trips(id) on delete cascade,
  user_id    uuid references auth.users(id),
  type       text default 'text',  -- text | voice | image | location | photos
  content    text,
  media_url  text,
  created_at timestamptz default now()
);

-- 5. Saved places
create table if not exists saved_places (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references trips(id) on delete cascade,
  name       text not null,
  category   text,
  address    text,
  emoji      text,
  rating     numeric(2,1),
  distance   text,
  added_by   uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 6. Memories (photos)
create table if not exists memories (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references trips(id) on delete cascade,
  user_id    uuid references auth.users(id),
  media_url  text,
  caption    text,
  day        date,
  created_at timestamptz default now()
);

-- ─── Row Level Security (enable for all tables) ───────────────────────────────
alter table trips          enable row level security;
alter table trip_members   enable row level security;
alter table schedule_items enable row level security;
alter table chat_messages  enable row level security;
alter table saved_places   enable row level security;
alter table memories       enable row level security;

-- Allow trip members to read all data in their trip
create policy "members can read trips"
  on trips for select using (
    exists (select 1 from trip_members where trip_id = trips.id and user_id = auth.uid())
  );

create policy "members can read schedule"
  on schedule_items for select using (
    exists (select 1 from trip_members where trip_id = schedule_items.trip_id and user_id = auth.uid())
  );

create policy "members can read chat"
  on chat_messages for select using (
    exists (select 1 from trip_members where trip_id = chat_messages.trip_id and user_id = auth.uid())
  );

create policy "members can insert chat"
  on chat_messages for insert with check (
    exists (select 1 from trip_members where trip_id = chat_messages.trip_id and user_id = auth.uid())
  );

create policy "members can read places"
  on saved_places for select using (
    exists (select 1 from trip_members where trip_id = saved_places.trip_id and user_id = auth.uid())
  );

create policy "members can read memories"
  on memories for select using (
    exists (select 1 from trip_members where trip_id = memories.trip_id and user_id = auth.uid())
  );

create policy "members can insert memories"
  on memories for insert with check (
    exists (select 1 from trip_members where trip_id = memories.trip_id and user_id = auth.uid())
  );

-- Anyone can see their own membership
create policy "users can read own membership"
  on trip_members for select using (user_id = auth.uid());
