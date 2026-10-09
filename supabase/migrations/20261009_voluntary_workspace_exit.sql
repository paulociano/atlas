-- Saída voluntária com proteção do último proprietário.
create or replace function public.leave_workspace(target_workspace uuid)
returns void language plpgsql security definer set search_path='' as $fn$
declare current_role text; other_owners integer;
begin
 if (select auth.uid()) is null then raise exception 'Autenticação necessária';end if;
 select role into current_role from public.memberships where workspace_id=target_workspace and user_id=(select auth.uid()) for update;
 if current_role is null then raise exception 'Você não pertence a esta organização';end if;
 if current_role='owner' then
  select count(*) into other_owners from public.memberships where workspace_id=target_workspace and user_id<>(select auth.uid()) and role='owner';
  if other_owners=0 then raise exception 'O último proprietário não pode sair da organização';end if;
 end if;
 delete from public.memberships where workspace_id=target_workspace and user_id=(select auth.uid());
end $fn$;
revoke all on function public.leave_workspace(uuid) from public,anon;
grant execute on function public.leave_workspace(uuid) to authenticated;
