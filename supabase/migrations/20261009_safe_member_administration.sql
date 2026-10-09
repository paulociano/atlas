-- Administração de equipe restrita ao owner. new_role NULL remove o membro.
create or replace function public.manage_workspace_member(target_workspace uuid,target_user uuid,new_role text)
returns void language plpgsql security definer set search_path='' as $fn$
declare existing_role text;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.memberships where workspace_id=target_workspace and user_id=(select auth.uid()) and role='owner') then raise exception 'Somente o proprietário pode administrar membros';end if;
 if target_user=(select auth.uid()) then raise exception 'Não é possível alterar seu próprio acesso';end if;
 select role into existing_role from public.memberships where workspace_id=target_workspace and user_id=target_user for update;
 if existing_role is null then raise exception 'Membro não encontrado';end if;
 if existing_role='owner' then raise exception 'O proprietário não pode ser removido ou rebaixado';end if;
 if new_role is null then delete from public.memberships where workspace_id=target_workspace and user_id=target_user;
 elsif new_role in ('admin','editor','viewer') then update public.memberships set role=new_role where workspace_id=target_workspace and user_id=target_user;
 else raise exception 'Papel inválido';end if;
end $fn$;
revoke all on function public.manage_workspace_member(uuid,uuid,text) from public,anon;
grant execute on function public.manage_workspace_member(uuid,uuid,text) to authenticated;
