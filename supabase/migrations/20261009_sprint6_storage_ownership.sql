-- Require uploader-specific Storage paths and existing object ownership.
drop policy if exists atlas_files_insert on storage.objects;
create policy atlas_files_insert on storage.objects for insert to authenticated with check(
 bucket_id='atlas-private'
 and split_part(name,'/',1) ~ '^[0-9a-f-]{36}$'
 and split_part(name,'/',2)=(select auth.uid())::text
 and public.can_edit(split_part(name,'/',1)::uuid)
);
create or replace function public.validate_attachment() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.entry_id is not null and not exists(select 1 from public.entries e where e.id=new.entry_id and e.workspace_id=new.workspace_id) then raise exception 'Registro de outro workspace';end if;
 if new.storage_path not like new.workspace_id::text||'/'||new.uploaded_by::text||'/%' or new.storage_path like '%..%' then raise exception 'Caminho ou autor inválido';end if;
 if new.content_type not in ('application/pdf','text/plain','text/csv','application/json','image/png','image/jpeg') then raise exception 'Tipo inválido';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='atlas-private' and o.name=new.storage_path and o.owner_id=new.uploaded_by::text) then raise exception 'Upload privado não encontrado para este autor';end if;
 return new;
end $fn$;
