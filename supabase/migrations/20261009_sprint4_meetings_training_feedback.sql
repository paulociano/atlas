-- Sprint 4: reuniões estruturadas, justificativas e feedback privado.
create table if not exists public.meeting_minutes(entry_id uuid primary key references public.entries(id) on delete cascade,workspace_id uuid not null references public.workspaces(id) on delete cascade,agenda text not null default '',decisions text not null default '',next_steps text not null default '',updated_at timestamptz not null default now());
create or replace function public.sprint4_check_meeting() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if not exists(select 1 from public.entries e where e.id=new.entry_id and e.workspace_id=new.workspace_id and e.kind='reuniao') then raise exception 'Ata requer reunião da mesma organização';end if;
 return new;
end $fn$;
create trigger sprint4_meeting_guard before insert or update on public.meeting_minutes for each row execute function public.sprint4_check_meeting();
alter table public.meeting_minutes enable row level security;
create policy minutes_read on public.meeting_minutes for select to authenticated using(public.has_membership(workspace_id));
create policy minutes_insert on public.meeting_minutes for insert to authenticated with check(public.can_edit(workspace_id));
create policy minutes_update on public.meeting_minutes for update to authenticated using(public.can_edit(workspace_id)) with check(public.can_edit(workspace_id));
grant select,insert,update on public.meeting_minutes to authenticated;
alter table public.entries add column if not exists mandatory_training boolean not null default false;
alter table public.attendance add column if not exists absence_reason text;
alter table public.attendance add column if not exists excused boolean not null default false;
alter table public.attendance add constraint attendance_reason_size check(absence_reason is null or length(absence_reason)<=500);
create table if not exists public.private_feedback(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,recipient_id uuid not null references auth.users(id),author_id uuid not null references auth.users(id),body text not null check(length(trim(body)) between 1 and 5000),created_at timestamptz not null default now());
create or replace function public.sprint4_feedback_guard() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if not exists(select 1 from public.memberships m where m.workspace_id=new.workspace_id and m.user_id=new.recipient_id) then raise exception 'Destinatário fora da organização';end if;
 return new;
end $fn$;
create trigger sprint4_feedback_guard before insert on public.private_feedback for each row execute function public.sprint4_feedback_guard();
alter table public.private_feedback enable row level security;
create policy private_feedback_read on public.private_feedback for select to authenticated using(public.has_membership(workspace_id) and (recipient_id=(select auth.uid()) or author_id=(select auth.uid())));
create policy private_feedback_insert on public.private_feedback for insert to authenticated with check(public.can_edit(workspace_id) and author_id=(select auth.uid()));
grant select,insert on public.private_feedback to authenticated;
revoke all on function public.sprint4_check_meeting(),public.sprint4_feedback_guard() from public,anon,authenticated;
