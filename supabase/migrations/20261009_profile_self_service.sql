-- Incrementos aplicados anteriormente em produção, preservados para bootstrap novo.
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists department text;
grant select,insert,update on public.profiles to authenticated;
create policy profiles_self_insert on public.profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
