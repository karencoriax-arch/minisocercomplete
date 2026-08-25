create extension if not exists pgcrypto;

create table if not exists public.msc_profiles_v3 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,18}$'),
  display_name text not null default 'Jugador MSC' check (char_length(display_name) between 1 and 28),
  progress jsonb not null default '{}'::jsonb,
  msc integer not null default 0 check (msc >= 0),
  gems integer not null default 0 check (gems >= 0),
  level integer not null default 1 check (level >= 1),
  rating integer not null default 0 check (rating between 0 and 5600),
  wins integer not null default 0 check (wins >= 0),
  goals integer not null default 0 check (goals >= 0),
  tournaments integer not null default 0 check (tournaments >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.msc_friendships_v3 (
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (user_low,user_high),
  check (user_low <> user_high),
  check (user_low < user_high),
  check (requested_by = user_low or requested_by = user_high)
);

create table if not exists public.msc_rooms_v3 (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'OPEN' check (status in ('OPEN','READY','PLAYING','FINISHED')),
  format smallint not null default 3 check (format in (3,4)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  check (guest_user_id is null or guest_user_id <> host_user_id)
);

create index if not exists msc_profiles_v3_rating_idx on public.msc_profiles_v3 (rating desc,wins desc);
create index if not exists msc_rooms_v3_open_idx on public.msc_rooms_v3 (code,status) where status in ('OPEN','READY');
create index if not exists msc_rooms_v3_expiry_idx on public.msc_rooms_v3 (expires_at);

alter table public.msc_profiles_v3 enable row level security;
alter table public.msc_friendships_v3 enable row level security;
alter table public.msc_rooms_v3 enable row level security;

drop policy if exists "profiles readable by signed users" on public.msc_profiles_v3;
create policy "profiles readable by signed users" on public.msc_profiles_v3 for select to authenticated using (true);
drop policy if exists "own profile insert" on public.msc_profiles_v3;
create policy "own profile insert" on public.msc_profiles_v3 for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own profile update" on public.msc_profiles_v3;
create policy "own profile update" on public.msc_profiles_v3 for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "friendships visible to participants" on public.msc_friendships_v3;
create policy "friendships visible to participants" on public.msc_friendships_v3 for select to authenticated using (auth.uid() = user_low or auth.uid() = user_high);
drop policy if exists "friendship requests by participant" on public.msc_friendships_v3;
create policy "friendship requests by participant" on public.msc_friendships_v3 for insert to authenticated with check (auth.uid() = requested_by and (auth.uid() = user_low or auth.uid() = user_high));
drop policy if exists "friendships updated by participant" on public.msc_friendships_v3;
create policy "friendships updated by participant" on public.msc_friendships_v3 for update to authenticated using (auth.uid() = user_low or auth.uid() = user_high) with check (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "rooms visible to signed users" on public.msc_rooms_v3;
create policy "rooms visible to signed users" on public.msc_rooms_v3 for select to authenticated using (expires_at > now());
drop policy if exists "room host insert" on public.msc_rooms_v3;
create policy "room host insert" on public.msc_rooms_v3 for insert to authenticated with check (auth.uid() = host_user_id and guest_user_id is null);
drop policy if exists "room participants update" on public.msc_rooms_v3;
create policy "room participants update" on public.msc_rooms_v3 for update to authenticated using (auth.uid() = host_user_id or auth.uid() = guest_user_id) with check (auth.uid() = host_user_id or auth.uid() = guest_user_id);

create or replace function public.msc_join_room_v3(p_code text,p_user_id uuid)
returns public.msc_rooms_v3
language plpgsql
security definer
set search_path = public
as $$
declare room public.msc_rooms_v3;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'unauthorized'; end if;
  select * into room from public.msc_rooms_v3 where code = upper(trim(p_code)) and status = 'OPEN' and expires_at > now() for update;
  if room.id is null then raise exception 'room_not_available'; end if;
  if room.host_user_id = p_user_id then return room; end if;
  update public.msc_rooms_v3 set guest_user_id=p_user_id,status='READY',updated_at=now() where id=room.id returning * into room;
  return room;
end;
$$;
revoke all on function public.msc_join_room_v3(text,uuid) from public;
grant execute on function public.msc_join_room_v3(text,uuid) to authenticated;

create or replace function public.msc_friends_v3(p_user_id uuid)
returns table(user_id uuid,handle text,level integer,rating integer,status text)
language sql
security definer
set search_path = public
as $$
  select p.user_id,p.handle,p.level,p.rating,f.status
  from public.msc_friendships_v3 f
  join public.msc_profiles_v3 p on p.user_id = case when f.user_low=p_user_id then f.user_high else f.user_low end
  where auth.uid()=p_user_id and (f.user_low=p_user_id or f.user_high=p_user_id)
  order by (f.status='ACCEPTED') desc,p.rating desc;
$$;
revoke all on function public.msc_friends_v3(uuid) from public;
grant execute on function public.msc_friends_v3(uuid) to authenticated;

create or replace function public.msc_touch_updated_at_v3() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end $$;
drop trigger if exists msc_profiles_v3_touch on public.msc_profiles_v3;
create trigger msc_profiles_v3_touch before update on public.msc_profiles_v3 for each row execute function public.msc_touch_updated_at_v3();
drop trigger if exists msc_rooms_v3_touch on public.msc_rooms_v3;
create trigger msc_rooms_v3_touch before update on public.msc_rooms_v3 for each row execute function public.msc_touch_updated_at_v3();
