-- Sprint 4: correção de autorização para alteração de presença e obrigatoriedade.
create policy attendance_update on public.attendance for update to authenticated using(public.can_edit(workspace_id)) with check(public.can_edit(workspace_id) and exists(select 1 from public.entries e where e.id=entry_id and e.workspace_id=attendance.workspace_id and e.kind in ('reuniao','treinamento')));
grant update on public.attendance to authenticated;
create or replace function public.set_training_required(target_entry uuid,is_required boolean) returns void language plpgsql security definer set search_path='' as $fn$
declare w uuid;
begin
 select workspace_id into w from public.entries where id=target_entry and kind='treinamento' for update;
 if w is null or not exists(select 1 from public.memberships where workspace_id=w and user_id=(select auth.uid()) and role in ('owner','admin')) then raise exception 'Somente proprietários e administradores podem classificar treinamentos';end if;
 update public.entries set mandatory_training=is_required where id=target_entry;
end $fn$;
revoke all on function public.set_training_required(uuid,boolean) from public,anon;
grant execute on function public.set_training_required(uuid,boolean) to authenticated;
