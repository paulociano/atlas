-- Convites vinculados ao e-mail, com revogação. Convites legados continuam aceitos enquanto válidos.
alter table public.invites add column if not exists invited_email text;
alter table public.invites add column if not exists revoked_at timestamptz;
create index if not exists invites_workspace_pending_idx on public.invites(workspace_id,created_at desc) where accepted_at is null;
create or replace function public.create_email_invite(target_workspace uuid,target_role text,target_email text) returns text language plpgsql security definer set search_path='' as $fn$
declare raw_token text; email_normalized text;
begin
 if auth.uid() is null or not exists(select 1 from public.memberships where workspace_id=target_workspace and user_id=auth.uid() and role in ('owner','admin')) then raise exception 'not authorized';end if;
 if target_role not in ('admin','editor','viewer') then raise exception 'invalid role';end if;
 email_normalized:=lower(trim(target_email));
 if length(email_normalized)>254 or email_normalized !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid email';end if;
 raw_token:=encode(gen_random_bytes(24),'hex');
 insert into public.invites(workspace_id,token_hash,role,created_by,invited_email) values(target_workspace,encode(digest(raw_token,'sha256'),'hex'),target_role,auth.uid(),email_normalized);
 return raw_token;
end $fn$;
create or replace function public.accept_invite(raw_token text) returns uuid language plpgsql security definer set search_path='' as $fn$
declare inv public.invites%rowtype; current_email text;
begin
 if auth.uid() is null or raw_token !~ '^[0-9a-f]{48}$' then raise exception 'invalid invitation';end if;
 select lower(email) into current_email from auth.users where id=auth.uid();
 select * into inv from public.invites where token_hash=encode(digest(raw_token,'sha256'),'hex') and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if not found then raise exception 'invitation expired, revoked or invalid';end if;
 if inv.invited_email is not null and inv.invited_email is distinct from current_email then raise exception 'Este convite pertence a outro e-mail';end if;
 insert into public.memberships(workspace_id,user_id,role) values(inv.workspace_id,auth.uid(),inv.role) on conflict(workspace_id,user_id) do nothing;
 update public.invites set accepted_by=auth.uid(),accepted_at=now() where id=inv.id;
 return inv.workspace_id;
end $fn$;
create or replace function public.revoke_invite(target_invite uuid) returns void language plpgsql security definer set search_path='' as $fn$
declare w uuid;
begin
 select workspace_id into w from public.invites where id=target_invite and accepted_at is null and revoked_at is null for update;
 if w is null or not exists(select 1 from public.memberships where workspace_id=w and user_id=auth.uid() and role in ('owner','admin')) then raise exception 'not authorized';end if;
 update public.invites set revoked_at=now() where id=target_invite;
end $fn$;
create or replace function public.list_workspace_invites(target_workspace uuid)
returns table(id uuid,invited_email text,role text,created_at timestamptz,expires_at timestamptz,revoked_at timestamptz,accepted_at timestamptz)
language plpgsql security definer set search_path='' as $fn$
begin
 if not exists(select 1 from public.memberships where workspace_id=target_workspace and user_id=auth.uid() and role in ('owner','admin')) then raise exception 'not authorized';end if;
 return query select i.id,i.invited_email,i.role,i.created_at,i.expires_at,i.revoked_at,i.accepted_at from public.invites i where i.workspace_id=target_workspace order by i.created_at desc limit 100;
end $fn$;
revoke all on function public.create_invite(uuid,text) from public,anon,authenticated;
revoke all on function public.create_email_invite(uuid,text,text),public.revoke_invite(uuid),public.list_workspace_invites(uuid) from public,anon;
grant execute on function public.create_email_invite(uuid,text,text),public.revoke_invite(uuid),public.list_workspace_invites(uuid) to authenticated;
