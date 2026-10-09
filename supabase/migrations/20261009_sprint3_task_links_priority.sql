-- Sprint 3: vínculos de tarefa e prioridade sem invalidar ações já registradas.
alter table public.tasks add column if not exists source_entry_id uuid references public.entries(id) on delete set null;
alter table public.tasks add column if not exists assignee_user_id uuid references auth.users(id) on delete set null;
alter table public.tasks add column if not exists priority text not null default 'normal';
alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks add constraint tasks_priority_check check(priority in ('baixa','normal','alta','urgente'));
create index if not exists tasks_source_entry_idx on public.tasks(source_entry_id) where source_entry_id is not null;
create index if not exists tasks_assignee_idx on public.tasks(workspace_id,assignee_user_id) where assignee_user_id is not null;
create or replace function public.validate_task_links() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.source_entry_id is not null and not exists(select 1 from public.entries e where e.id=new.source_entry_id and e.workspace_id=new.workspace_id and e.kind in ('decisao','reuniao')) then raise exception 'Registro de origem inválido para esta organização';end if;
 if new.assignee_user_id is not null and not exists(select 1 from public.memberships m where m.user_id=new.assignee_user_id and m.workspace_id=new.workspace_id) then raise exception 'Responsável não pertence à organização';end if;
 return new;
end $fn$;
drop trigger if exists tasks_validate_links on public.tasks;
create trigger tasks_validate_links before insert or update of source_entry_id,assignee_user_id,workspace_id on public.tasks for each row execute function public.validate_task_links();
revoke all on function public.validate_task_links() from public,anon,authenticated;
