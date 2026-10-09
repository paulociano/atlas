-- Autoriza remover uploads próprios por caminho workspace/user/arquivo.
create policy atlas_files_delete_own on storage.objects for delete to authenticated
using(bucket_id='atlas-private' and split_part(name,'/',2)=(select auth.uid())::text
 and split_part(name,'/',1) ~ '^[0-9a-f-]{36}$' and public.can_edit(split_part(name,'/',1)::uuid));
