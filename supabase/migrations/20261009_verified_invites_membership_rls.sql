-- Convites direcionados exigem e-mail confirmado.
create or replace function public.accept_invite(raw_token text) returns uuid language plpgsql security definer set search_path='' as $fn$
declare inv public.invites%rowtype; current_email text; verified_at timestamptz;
begin
 if auth.uid() is null or raw_token !~ '^[0-9a-f]{48}$' then raise exception 'invalid invitation';end if;
 select lower(email),email_confirmed_at into current_email,verified_at from auth.users where id=auth.uid();
 select * into inv from public.invites where token_hash=encode(digest(raw_token,'sha256'),'hex') and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if not found then raise exception 'invitation expired, revoked or invalid';end if;
 if inv.invited_email is not null and (inv.invited_email is distinct from current_email or verified_at is null) then raise exception 'Confirme o e-mail da conta convidada antes de aceitar';end if;
 insert into public.memberships(workspace_id,user_id,role) values(inv.workspace_id,auth.uid(),inv.role) on conflict(workspace_id,user_id) do nothing;
 update public.invites set accepted_by=auth.uid(),accepted_at=now() where id=inv.id;
 return inv.workspace_id;
end $fn$;
revoke all on function public.accept_invite(text) from public,anon;
grant execute on function public.accept_invite(text) to authenticated;
-- RLS das notificações requer associação ativa à organização.
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()) and public.has_membership(workspace_id));
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated using(user_id=(select auth.uid()) and public.has_membership(workspace_id)) with check(user_id=(select auth.uid()) and public.has_membership(workspace_id));
