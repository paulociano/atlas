-- Sprint 3: estados e comentários de tarefas.
alter table public.tasks add column if not exists status text not null default 'pendente';
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check check(status in ('pendente','em_andamento','bloqueada','concluida','cancelada'));
update public.tasks set status='concluida' where done=true and status='pendente';
create or replace function public.sync_task_status() returns trigger language plpgsql set search_path='' as $fn$
begin
 if tg_op='INSERT' then
  if new.done then new.status:='concluida';end if;
 elsif new.done is distinct from old.done and new.status=old.status then
  new.status:=case when new.done then 'concluida' else 'pendente' end;
 elsif new.status is distinct from old.status then
  new.done:=(new.status='concluida');
 end if;
 return new;
end $fn$;
drop trigger if exists tasks_sync_status on public.tasks;
create trigger tasks_sync_status before insert or update of status,done on public.tasks for each row execute function public.sync_task_status();
create table if not exists public.task_comments(
 id uuid primary key default gen_random_uuid(),
 task_id uuid not null references public.tasks(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 author_id uuid not null references auth.users(id),
 body text not null check(length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
alter table public.task_comments enable row level security;
create policy task_comments_read on public.task_comments for select to authenticated using(public.has_membership(workspace_id));
create policy task_comments_write on public.task_comments for insert to authenticated with check(public.can_edit(workspace_id) and author_id=(select auth.uid()) and exists(select 1 from public.tasks t where t.id=task_id and t.workspace_id=task_comments.workspace_id));
grant select,insert on public.task_comments to authenticated;
create index if not exists task_comments_task_date_idx on public.task_comments(task_id,created_at);
