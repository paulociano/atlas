-- Baseline incremental de governança para ambiente inicial.
create table public.invites(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,token_hash text not null unique,role text not null check(role in ('admin','editor','viewer')),created_by uuid not null references auth.users(id),expires_at timestamptz not null default (now()+interval '7 days'),accepted_by uuid references auth.users(id),accepted_at timestamptz,created_at timestamptz not null default now());
alter table public.invites enable row level security;
create table public.entry_versions(id bigint generated always as identity primary key,entry_id uuid not null references public.entries(id),workspace_id uuid not null references public.workspaces(id),revision integer not null,title text not null,body text not null,status text not null,changed_by uuid references auth.users(id),changed_at timestamptz not null default now(),unique(entry_id,revision));
alter table public.entry_versions enable row level security;
create policy versions_read on public.entry_versions for select to authenticated using(public.has_membership(workspace_id));
grant select on public.entry_versions to authenticated;
create function public.create_invite(target_workspace uuid,target_role text) returns text language plpgsql security definer set search_path='' as $fn$
declare raw_token text;
begin
 if auth.uid() is null or not exists(select 1 from public.memberships where workspace_id=target_workspace and user_id=auth.uid() and role in ('owner','admin')) then raise exception 'not authorized';end if;
 if target_role not in ('admin','editor','viewer') then raise exception 'invalid role';end if;
 raw_token:=encode(gen_random_bytes(24),'hex');
 insert into public.invites(workspace_id,token_hash,role,created_by) values(target_workspace,encode(digest(raw_token,'sha256'),'hex'),target_role,auth.uid());
 return raw_token;
end $fn$;
create function public.accept_invite(raw_token text) returns uuid language plpgsql security definer set search_path='' as $fn$
declare inv public.invites%rowtype;
begin
 if auth.uid() is null or raw_token !~ '^[0-9a-f]{48}$' then raise exception 'invalid invitation';end if;
 select * into inv from public.invites where token_hash=encode(digest(raw_token,'sha256'),'hex') and accepted_at is null and expires_at>now() for update;
 if not found then raise exception 'invitation expired or invalid';end if;
 insert into public.memberships(workspace_id,user_id,role) values(inv.workspace_id,auth.uid(),inv.role) on conflict(workspace_id,user_id) do nothing;
 update public.invites set accepted_by=auth.uid(),accepted_at=now() where id=inv.id;
 return inv.workspace_id;
end $fn$;
create function public.approve_entry(target_entry uuid) returns void language plpgsql security definer set search_path='' as $fn$
declare w uuid;
begin
 select workspace_id into w from public.entries where id=target_entry for update;
 if w is null or not exists(select 1 from public.memberships where workspace_id=w and user_id=auth.uid() and role in ('owner','admin')) then raise exception 'not authorized';end if;
 update public.entries set status='vigente' where id=target_entry and status='rascunho';
end $fn$;
create function public.update_entry_draft(target_entry uuid,new_title text,new_body text) returns void language plpgsql security definer set search_path='' as $fn$
declare item public.entries%rowtype;
begin
 select * into item from public.entries where id=target_entry for update;
 if not found or item.status<>'rascunho' or not exists(select 1 from public.memberships where workspace_id=item.workspace_id and user_id=auth.uid() and role in ('owner','admin','editor')) then raise exception 'not authorized or not draft';end if;
 if length(trim(new_title)) not between 1 and 180 or length(trim(new_body)) not between 1 and 30000 then raise exception 'invalid entry';end if;
 update public.entries set title=trim(new_title),body=trim(new_body) where id=target_entry;
end $fn$;
create function public.capture_entry_version() returns trigger language plpgsql security definer set search_path='' as $fn$
declare n integer;
begin
 select coalesce(max(revision),0)+1 into n from public.entry_versions where entry_id=new.id;
 insert into public.entry_versions(entry_id,workspace_id,revision,title,body,status,changed_by) values(new.id,new.workspace_id,n,new.title,new.body,new.status,auth.uid());
 return new;
end $fn$;
create trigger entry_version_capture after insert or update on public.entries for each row execute function public.capture_entry_version();
create or replace function public.audit_change() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if tg_op='DELETE' then insert into public.audit_events(workspace_id,entity,entity_id,operation,actor,payload) values(old.workspace_id,tg_table_name,old.id,tg_op,auth.uid(),to_jsonb(old));return old;
 else insert into public.audit_events(workspace_id,entity,entity_id,operation,actor,payload) values(new.workspace_id,tg_table_name,new.id,tg_op,auth.uid(),to_jsonb(new));return new;end if;
end $fn$;
revoke all on function public.create_invite(uuid,text),public.accept_invite(text),public.approve_entry(uuid),public.update_entry_draft(uuid,text,text) from public,anon;
grant execute on function public.create_invite(uuid,text),public.accept_invite(text),public.approve_entry(uuid),public.update_entry_draft(uuid,text,text) to authenticated;
revoke all on function public.capture_entry_version() from public,anon,authenticated;
