-- Rhodes Bachelorette App — Supabase Schema
-- Run in Supabase SQL Editor. Enable RLS on all tables after creation.

-- ── trips ────────────────────────────────────────────────────────────────────
create table public.trips (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  bride_name      text not null,
  destination     text,
  start_date      date,
  end_date        date,
  owner_id        uuid references auth.users not null,
  cover_image_url text,
  estimated_guests int,
  created_at      timestamptz default now()
);

alter table public.trips enable row level security;

-- only trip members can see the trip
create policy "trip members can read"
  on public.trips for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
        and trip_members.user_id = auth.uid()
    )
  );

-- only owner can update trip settings
create policy "owner can update trip"
  on public.trips for update
  using (owner_id = auth.uid());

-- authenticated users can create a trip
create policy "auth users can create trip"
  on public.trips for insert
  with check (owner_id = auth.uid());

-- ── trip_members ─────────────────────────────────────────────────────────────
create table public.trip_members (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid references public.trips not null,
  user_id      uuid references auth.users not null,
  role         text not null check (role in ('owner','guest')),
  display_name text not null,
  avatar_url   text,
  phone        text,
  email        text,
  joined_at    timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (trip_id, user_id)
);

alter table public.trip_members enable row level security;

-- all members of the same trip can see each other
create policy "trip members can read members"
  on public.trip_members for select
  using (
    exists (
      select 1 from public.trip_members as tm
      where tm.trip_id = trip_members.trip_id
        and tm.user_id = auth.uid()
    )
  );

-- users can update only their own member record
create policy "member can update own profile"
  on public.trip_members for update
  using (user_id = auth.uid());

-- accepting an invite inserts a new member
create policy "user can insert own member"
  on public.trip_members for insert
  with check (user_id = auth.uid());

-- owner can delete (kick) members
create policy "owner can delete members"
  on public.trip_members for delete
  using (
    exists (
      select 1 from public.trips
      where trips.id = trip_members.trip_id
        and trips.owner_id = auth.uid()
    )
  );

-- ── trip_invites ─────────────────────────────────────────────────────────────
create table public.trip_invites (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid references public.trips not null,
  token        text unique not null,
  created_by   uuid references auth.users not null,
  expires_at   timestamptz,
  max_uses     int,
  current_uses int default 0,
  created_at   timestamptz default now()
);

alter table public.trip_invites enable row level security;

-- only owner can create invites
create policy "owner can manage invites"
  on public.trip_invites for all
  using (created_by = auth.uid());

-- anyone can read an invite by token (to validate it before joining)
create policy "public can read invite by token"
  on public.trip_invites for select
  using (true);

-- ── chats ────────────────────────────────────────────────────────────────────
create table public.chats (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references public.trips not null,
  type       text not null check (type in ('group','private')),
  created_at timestamptz default now()
);

alter table public.chats enable row level security;

create policy "trip members can read chats"
  on public.chats for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = chats.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "trip members can create chats"
  on public.chats for insert
  with check (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = chats.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- ── chat_participants ─────────────────────────────────────────────────────────
create table public.chat_participants (
  id      uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats not null,
  user_id uuid references auth.users not null,
  unique (chat_id, user_id)
);

alter table public.chat_participants enable row level security;

create policy "participants can read own chats"
  on public.chat_participants for select
  using (user_id = auth.uid());

-- ── chat_messages ────────────────────────────────────────────────────────────
create table public.chat_messages (
  id                   uuid primary key default gen_random_uuid(),
  trip_id              uuid references public.trips not null,
  chat_id              uuid references public.chats,
  sender_user_id       uuid references auth.users not null,
  sender_display_name  text not null,
  sender_avatar_url    text,
  body                 text,
  type                 text default 'text' check (type in ('text','system','voice','location','photos','event_card')),
  metadata             jsonb,
  created_at           timestamptz default now()
);

alter table public.chat_messages enable row level security;

-- all trip members can read messages
create policy "trip members can read messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = chat_messages.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- all trip members can send messages
create policy "trip members can insert messages"
  on public.chat_messages for insert
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1 from public.trip_members
      where trip_members.trip_id = chat_messages.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- ── schedule_items ────────────────────────────────────────────────────────────
create table public.schedule_items (
  id               uuid primary key default gen_random_uuid(),
  trip_id          uuid references public.trips not null,
  title            text not null,
  description      text,
  day              text not null check (day in ('thu','fri','sat','sun')),
  time             text,
  location_name    text,
  location_address text,
  map_url          text,
  icon             text,
  emoji            text,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_by       uuid references auth.users,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.schedule_items enable row level security;

create policy "trip members can read schedule"
  on public.schedule_items for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = schedule_items.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- only owner can modify schedule
create policy "owner can manage schedule"
  on public.schedule_items for all
  using (
    exists (
      select 1 from public.trips
      where trips.id = schedule_items.trip_id
        and trips.owner_id = auth.uid()
    )
  );

-- ── saved_places ──────────────────────────────────────────────────────────────
create table public.saved_places (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid references public.trips not null,
  title           text not null,
  description     text,
  category        text,
  location_name   text,
  location_address text,
  map_url         text,
  added_by        uuid references auth.users,
  added_by_name   text,
  created_at      timestamptz default now()
);

alter table public.saved_places enable row level security;

create policy "trip members can read places"
  on public.saved_places for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = saved_places.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- all members can add places
create policy "trip members can add places"
  on public.saved_places for insert
  with check (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = saved_places.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- ── albums ────────────────────────────────────────────────────────────────────
create table public.albums (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid references public.trips not null,
  title           text not null,
  cover_photo_url text,
  created_by      uuid references auth.users,
  created_by_name text,
  created_at      timestamptz default now()
);

alter table public.albums enable row level security;

create policy "trip members can read albums"
  on public.albums for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = albums.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "trip members can create albums"
  on public.albums for insert
  with check (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = albums.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- ── photos ────────────────────────────────────────────────────────────────────
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid references public.trips not null,
  album_id      uuid references public.albums,
  image_url     text not null,
  caption       text,
  uploaded_by   uuid references auth.users,
  uploader_name text,
  created_at    timestamptz default now()
);

alter table public.photos enable row level security;

create policy "trip members can read photos"
  on public.photos for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = photos.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "trip members can upload photos"
  on public.photos for insert
  with check (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = photos.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- owner can delete any photo; guest can delete only their own
create policy "owner or uploader can delete photo"
  on public.photos for delete
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.trips
      where trips.id = photos.trip_id
        and trips.owner_id = auth.uid()
    )
  );

-- ── memory_albums ─────────────────────────────────────────────────────────────
create table public.memory_albums (
  id                       uuid primary key default gen_random_uuid(),
  event_id                 uuid references public.trips not null,
  title                    text not null,
  description              text,
  icon                     text not null,
  gradient                 text,
  cover_photo_url          text,
  created_by               uuid references auth.users,
  created_by_display_name  text,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

alter table public.memory_albums enable row level security;

create policy "event members can read memory albums"
  on public.memory_albums for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_albums.event_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "event members can create memory albums"
  on public.memory_albums for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_albums.event_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "owner or admin can update memory albums"
  on public.memory_albums for update
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_albums.event_id
        and trip_members.user_id = auth.uid()
        and trip_members.role in ('owner','admin')
    )
  );

create policy "owner or admin can delete memory albums"
  on public.memory_albums for delete
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_albums.event_id
        and trip_members.user_id = auth.uid()
        and trip_members.role in ('owner','admin')
    )
  );

-- ── memory_photos ─────────────────────────────────────────────────────────────
create table public.memory_photos (
  id                           uuid primary key default gen_random_uuid(),
  event_id                     uuid references public.trips not null,
  album_id                     uuid references public.memory_albums(id) on delete cascade,
  image_url                    text not null,
  thumbnail_url                text,
  caption                      text,
  uploaded_by                  uuid references auth.users,
  uploaded_by_display_name     text,
  uploaded_by_avatar_url       text,
  is_bride_pick                boolean default false,
  favorite_count               int default 0,
  created_at                   timestamptz default now(),
  updated_at                   timestamptz default now()
);

alter table public.memory_photos enable row level security;

create policy "event members can read memory photos"
  on public.memory_photos for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_photos.event_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "event members can upload memory photos"
  on public.memory_photos for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_photos.event_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "uploader or moderator can delete memory photo"
  on public.memory_photos for delete
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_photos.event_id
        and trip_members.user_id = auth.uid()
        and trip_members.role in ('owner','admin')
    )
  );

create policy "owner or admin can mark bride pick"
  on public.memory_photos for update
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = memory_photos.event_id
        and trip_members.user_id = auth.uid()
        and trip_members.role in ('owner','admin')
    )
  );

-- ── photo_favorites ───────────────────────────────────────────────────────────
create table public.photo_favorites (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.trips not null,
  photo_id   uuid references public.memory_photos(id) on delete cascade,
  user_id    uuid references auth.users not null,
  created_at timestamptz default now(),
  unique (photo_id, user_id)
);

alter table public.photo_favorites enable row level security;

create policy "event members can read favorites"
  on public.photo_favorites for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = photo_favorites.event_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "users can manage own favorites"
  on public.photo_favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── photo_reactions ───────────────────────────────────────────────────────────
create table public.photo_reactions (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.trips not null,
  photo_id      uuid references public.memory_photos(id) on delete cascade,
  user_id       uuid references auth.users not null,
  reaction_text text not null,
  created_at    timestamptz default now()
);

alter table public.photo_reactions enable row level security;

create policy "event members can read reactions"
  on public.photo_reactions for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = photo_reactions.event_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "users can manage own reactions"
  on public.photo_reactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Storage: event-memories bucket ───────────────────────────────────────────
-- Run in Supabase dashboard → Storage → New bucket → event-memories (public: false)
--
-- Storage policies:
--   insert: auth.uid() is event member AND path starts with 'events/{event_id}/...'
--   select: auth.uid() is event member
--   delete: auth.uid() is uploader OR auth.uid() is owner/admin of event
