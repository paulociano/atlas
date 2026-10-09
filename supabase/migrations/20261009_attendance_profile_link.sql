-- Vínculo opcional e validado entre presença e usuário institucional.
alter table public.attendance add column if not exists participant_user_id uuid references auth.users(id) on delete set null;
create index if not exists attendance_participant_user_idx on public.attendance(participant_user_id) where participant_user_id is not null;
create or replace function public.validate_attendance_member() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.participant_user_id is not null and not exists(select 1 from public.memberships where workspace_id=new.workspace_id and user_id=new.participant_user_id) then raise exception 'O participante precisa pertencer à organização';end if;
 return new;
end $fn$;
create trigger validate_attendance_member before insert or update of participant_user_id,workspace_id on public.attendance for each row execute function public.validate_attendance_member();
revoke all on function public.validate_attendance_member() from public,anon,authenticated;
