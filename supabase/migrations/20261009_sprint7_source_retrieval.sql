-- Sprint 7: retrieval only, no external AI cost and no query text stored.
create table if not exists public.atlas_query_events(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index if not exists atlas_query_events_user_time on public.atlas_query_events(user_id,created_at desc);
alter table public.atlas_query_events enable row level security;
revoke all on public.atlas_query_events from anon,authenticated;
create or replace function public.search_atlas_sources(target_workspace uuid, search_text text)
returns table(entry_id uuid,title text,kind text,excerpt text,occurred_at timestamptz)
language plpgsql security definer set search_path='' as $fn$
declare uid uuid := (select auth.uid()); term text;
begin
 if uid is null then raise exception 'Autenticação necessária';end if;
 if not exists(select 1 from public.memberships m where m.workspace_id=target_workspace and m.user_id=uid) then raise exception 'Sem acesso ao workspace';end if;
 term:=trim(coalesce(search_text,''));
 if length(term)<3 or length(term)>180 then raise exception 'Consulta deve ter entre 3 e 180 caracteres';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if (select count(*) from public.atlas_query_events q where q.user_id=uid and q.created_at>now()-interval '1 minute')>=12 then raise exception 'Limite de consultas atingido. Tente novamente em um minuto';end if;
 insert into public.atlas_query_events(user_id,workspace_id) values(uid,target_workspace);
 return query select e.id,e.title,e.kind,left(e.body,600),e.occurred_at
 from public.entries e where e.workspace_id=target_workspace
 and (e.title ilike '%'||term||'%' or e.body ilike '%'||term||'%')
 order by e.occurred_at desc,e.id desc limit 8;
end $fn$;
revoke all on function public.search_atlas_sources(uuid,text) from public,anon;
grant execute on function public.search_atlas_sources(uuid,text) to authenticated;
