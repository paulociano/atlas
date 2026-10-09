-- Execute SOMENTE em projeto Supabase de homologação descartável.
-- Exige: SET atlas.allow_isolation_test = 'true'; na mesma sessão.
-- A transação é revertida integralmente, inclusive usuários de teste.
begin;
do $guard$ begin
 if current_setting('atlas.allow_isolation_test',true) is distinct from 'true' then
  raise exception 'BLOQUEADO: configure atlas.allow_isolation_test=true APENAS na homologação';
 end if;
end $guard$;
create temporary table atlas_test_ids(kind text primary key,id uuid not null);
insert into atlas_test_ids values
 ('owner_a','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
 ('editor_a','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
 ('viewer_a','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
 ('owner_b','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
 ('workspace_a','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10'),
 ('workspace_b','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb10');
insert into auth.users(id,aud,role,email,encrypted_password,created_at,updated_at)
select id,'authenticated','authenticated',kind||'@atlas.invalid','',now(),now()
from atlas_test_ids where kind like '%_a' or kind like '%_b';
insert into public.workspaces(id,name,created_by)
select (select id from atlas_test_ids where kind='workspace_a'),'ATLAS TEST A',(select id from atlas_test_ids where kind='owner_a')
union all
select (select id from atlas_test_ids where kind='workspace_b'),'ATLAS TEST B',(select id from atlas_test_ids where kind='owner_b');
insert into public.memberships(workspace_id,user_id,role)
select (select id from atlas_test_ids where kind='workspace_a'),id,
 case kind when 'owner_a' then 'owner' when 'editor_a' then 'editor' else 'viewer' end
 from atlas_test_ids where kind in ('owner_a','editor_a','viewer_a')
union all select (select id from atlas_test_ids where kind='workspace_b'),(select id from atlas_test_ids where kind='owner_b'),'owner';
insert into public.entries(workspace_id,kind,title,body,created_by)
select (select id from atlas_test_ids where kind='workspace_a'),'decisao','Segredo A','Apenas A',(select id from atlas_test_ids where kind='owner_a')
union all select (select id from atlas_test_ids where kind='workspace_b'),'decisao','Segredo B','Apenas B',(select id from atlas_test_ids where kind='owner_b');
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',true);
do $assert$ declare n integer; begin
 select count(*) into n from public.entries;
 if n<>1 then raise exception 'RLS falhou: viewer A vê % entradas, esperado 1',n;end if;
 if public.can_edit('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10') then raise exception 'viewer pode editar';end if;
 if public.has_membership('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb10') then raise exception 'acesso cross-workspace';end if;
end $assert$;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',true);
do $assert$ begin
 if not public.can_edit('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10') then raise exception 'editor sem edição';end if;
 if public.can_edit('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb10') then raise exception 'editor cross-workspace';end if;
end $assert$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',true);
do $assert$ declare n integer; begin
 select count(*) into n from public.entries;
 if n<>1 then raise exception 'RLS falhou: owner B vê % entradas, esperado 1',n;end if;
end $assert$;
rollback;
