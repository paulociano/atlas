-- ATLAS: perfis institucionais com nome completo
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(length(trim(full_name)) between 3 and 160),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;
create policy profiles_self_read on public.profiles for select to authenticated
 using(user_id=(select auth.uid()));
create policy profiles_team_read on public.profiles for select to authenticated
 using(exists(select 1 from public.memberships m1 join public.memberships m2 on m1.workspace_id=m2.workspace_id where m1.user_id=(select auth.uid()) and m2.user_id=profiles.user_id));
create or replace function public.sync_signup_profile() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if nullif(trim(coalesce(new.raw_user_meta_data->>'full_name','')),'') is not null then
  insert into public.profiles(user_id,full_name) values(new.id,trim(new.raw_user_meta_data->>'full_name')) on conflict(user_id) do nothing;
 end if;
 return new;
end$fn$;
revoke all on function public.sync_signup_profile() from public,anon,authenticated;
create trigger user_signup_profile after insert on auth.users for each row execute function public.sync_signup_profile();
