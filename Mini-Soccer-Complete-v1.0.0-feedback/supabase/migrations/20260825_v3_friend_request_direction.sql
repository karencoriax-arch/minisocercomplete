drop function if exists public.msc_friends_v3(uuid);
create function public.msc_friends_v3(p_user_id uuid)
returns table(user_id uuid,handle text,level integer,rating integer,status text,requested_by uuid)
language sql
security invoker
set search_path = public
as $$
  select p.user_id,p.handle,p.level,p.rating,f.status,f.requested_by
  from public.msc_friendships_v3 f
  join public.msc_profiles_v3 p on p.user_id = case when f.user_low=p_user_id then f.user_high else f.user_low end
  where auth.uid()=p_user_id and (f.user_low=p_user_id or f.user_high=p_user_id)
  order by (f.status='ACCEPTED') desc,p.rating desc;
$$;
revoke execute on function public.msc_friends_v3(uuid) from public, anon;
grant execute on function public.msc_friends_v3(uuid) to authenticated;
