alter table public.msc_profiles_v3 add column if not exists state_blob jsonb not null default '{}'::jsonb;
