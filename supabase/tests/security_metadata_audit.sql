-- Auditoria de metadados somente-leitura do Supabase ATLAS.
-- Sem usuários fictícios, sem DDL/DML, sem custo de branch. Resultado esperado: todos passed=true.
with checks as (
 select 'RLS habilitado em tabelas críticas' as check_name,
  (select count(*)=5 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('entries','tasks','memberships','notifications','invites') and c.relrowsecurity) as passed
 union all select 'Anon não executa RPCs da equipe',
  not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('accept_invite','create_email_invite','manage_workspace_member','leave_workspace','revoke_invite') and has_function_privilege('anon',p.oid,'EXECUTE'))
 union all select 'UPDATE de notificações limitado a read_at',
  (select count(*)=1 and bool_and(column_name='read_at') from information_schema.column_privileges where table_schema='public' and table_name='notifications' and grantee='authenticated' and privilege_type='UPDATE')
 union all select 'Notificações com RLS de pertencimento',
  (select count(*)=2 from pg_policies where schemaname='public' and tablename='notifications' and policyname in ('notifications_read','notifications_update') and qual like '%has_membership%')
 union all select 'Convites exigem email confirmado',
  (select pg_get_functiondef(p.oid) like '%email_confirmed_at%' from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='accept_invite' limit 1)
)
select check_name,coalesce(passed,false) as passed from checks order by check_name;
