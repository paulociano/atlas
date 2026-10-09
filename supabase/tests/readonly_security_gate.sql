-- Auditoria somente leitura: checks de segurança do ATLAS.
select 'tables_without_rls' as check_name,count(*) as violations
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
select 'definer_search_path_missing' as check_name,count(*) as violations
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prosecdef and not ('search_path=""'=any(p.proconfig));
select 'anon_definer_execute' as check_name,count(*) as violations
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prosecdef and has_function_privilege('anon',p.oid,'EXECUTE');
select 'private_bucket_public' as check_name,count(*) as violations
from storage.buckets where id='atlas-private' and public=true;
select 'feedback_access_policies' as check_name,count(*) as policy_count
from pg_policies where schemaname='public' and tablename='private_feedback';
