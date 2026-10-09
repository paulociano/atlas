-- Baseline incremental de notificações anterior à migration de endurecimento.
create table public.notifications(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('approval','overdue')),
 entity_id uuid not null,
 title text not null,
 read_at timestamptz,
 created_at timestamptz not null default now(),
 unique(user_id,kind,entity_id)
);
alter table public.notifications enable row level security;
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,update on public.notifications to authenticated;
create function public.refresh_my_notifications(target_workspace uuid) returns integer language plpgsql security definer set search_path='' as $fn$
declare created_count integer;
begin
 if not exists(select 1 from public.memberships where workspace_id=target_workspace and user_id=auth.uid()) then raise exception 'No workspace access';end if;
 insert into public.notifications(workspace_id,user_id,kind,entity_id,title)
 select e.workspace_id,auth.uid(),'approval',e.id,e.title from public.entries e
 where e.workspace_id=target_workspace and e.status='rascunho' and exists(select 1 from public.memberships m where m.workspace_id=target_workspace and m.user_id=auth.uid() and m.role in ('owner','admin'))
 on conflict(user_id,kind,entity_id) do nothing;
 insert into public.notifications(workspace_id,user_id,kind,entity_id,title)
 select t.workspace_id,auth.uid(),'overdue',t.id,t.title from public.tasks t
 where t.workspace_id=target_workspace and t.done=false and t.due_at<now()
 on conflict(user_id,kind,entity_id) do nothing;
 get diagnostics created_count=row_count;
 delete from public.notifications n where n.workspace_id=target_workspace and n.user_id=auth.uid() and
 ((n.kind='approval' and not exists(select 1 from public.entries e where e.id=n.entity_id and e.status='rascunho'))
 or (n.kind='overdue' and not exists(select 1 from public.tasks t where t.id=n.entity_id and t.done=false and t.due_at<now())));
 return created_count;
end $fn$;
revoke all on function public.refresh_my_notifications(uuid) from public,anon;
grant execute on function public.refresh_my_notifications(uuid) to authenticated;
