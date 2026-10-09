-- Corrige aviso de aprovação após remoção da permissão de admin.
create or replace function public.refresh_my_notifications(target_workspace uuid)
returns integer language plpgsql security definer set search_path='' as $fn$
declare inserted_count integer := 0;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.memberships where workspace_id=target_workspace and user_id=(select auth.uid())) then raise exception 'No workspace access';end if;
 insert into public.notifications(workspace_id,user_id,kind,entity_id,title)
 select e.workspace_id,(select auth.uid()),'approval',e.id,e.title from public.entries e
 where e.workspace_id=target_workspace and e.status='rascunho' and exists(select 1 from public.memberships m where m.workspace_id=target_workspace and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))
 on conflict(user_id,kind,entity_id) do nothing;
 get diagnostics inserted_count=row_count;
 insert into public.notifications(workspace_id,user_id,kind,entity_id,title)
 select t.workspace_id,(select auth.uid()),'overdue',t.id,t.title from public.tasks t
 where t.workspace_id=target_workspace and not t.done and t.due_at<now()
 on conflict(user_id,kind,entity_id) do nothing;
 delete from public.notifications n where n.workspace_id=target_workspace and n.user_id=(select auth.uid()) and (
 (n.kind='approval' and (not exists(select 1 from public.memberships m where m.workspace_id=target_workspace and m.user_id=(select auth.uid()) and m.role in ('owner','admin')) or not exists(select 1 from public.entries e where e.id=n.entity_id and e.workspace_id=target_workspace and e.status='rascunho')))
 or (n.kind='overdue' and not exists(select 1 from public.tasks t where t.id=n.entity_id and t.workspace_id=target_workspace and not t.done and t.due_at<now()))
 );
 return inserted_count;
end $fn$;
revoke all on function public.refresh_my_notifications(uuid) from public,anon;
grant execute on function public.refresh_my_notifications(uuid) to authenticated;
