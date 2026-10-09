-- Arquivamento administrativo com histórico pelo trigger de versões.
create or replace function public.archive_entry(target_entry uuid)
returns void language plpgsql security definer set search_path='' as $fn$
declare target_workspace uuid; current_status text;
begin
 select workspace_id,status into target_workspace,current_status from public.entries where id=target_entry for update;
 if target_workspace is null or not exists(select 1 from public.memberships where workspace_id=target_workspace and user_id=(select auth.uid()) and role in ('owner','admin')) then raise exception 'Sem autorização';end if;
 if current_status<>'vigente' then raise exception 'Apenas registros vigentes podem ser arquivados';end if;
 update public.entries set status='arquivado' where id=target_entry;
end $fn$;
revoke all on function public.archive_entry(uuid) from public,anon;
grant execute on function public.archive_entry(uuid) to authenticated;
