-- Sprint 6: armazenamento privado e vínculo de fontes.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('atlas-private','atlas-private',false,5242880,array['application/pdf','text/plain','text/csv','application/json','image/png','image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
create table if not exists public.record_attachments(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 entry_id uuid references public.entries(id) on delete set null,
 storage_path text not null unique,
 original_name text not null,
 content_type text not null,
 byte_size integer not null check(byte_size between 1 and 5242880),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 version integer not null default 1,
 uploaded_by uuid not null references auth.users(id),
 source_url text,
 created_at timestamptz not null default now(),
 unique(workspace_id,sha256,version)
);
create index if not exists record_attachments_workspace_date on public.record_attachments(workspace_id,created_at desc);
create or replace function public.validate_attachment() returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.entry_id is not null and not exists(select 1 from public.entries e where e.id=new.entry_id and e.workspace_id=new.workspace_id) then raise exception 'Registro de outro workspace';end if;
 if new.storage_path not like new.workspace_id::text||'/%' or new.storage_path like '%..%' then raise exception 'Caminho inválido';end if;
 if new.content_type not in ('application/pdf','text/plain','text/csv','application/json','image/png','image/jpeg') then raise exception 'Tipo inválido';end if;
 return new;
end $fn$;
drop trigger if exists record_attachment_guard on public.record_attachments;
create trigger record_attachment_guard before insert on public.record_attachments for each row execute function public.validate_attachment();
revoke all on function public.validate_attachment() from public,anon,authenticated;
alter table public.record_attachments enable row level security;
drop policy if exists attachments_read on public.record_attachments;
create policy attachments_read on public.record_attachments for select to authenticated using(public.has_membership(workspace_id));
drop policy if exists attachments_insert on public.record_attachments;
create policy attachments_insert on public.record_attachments for insert to authenticated with check(public.can_edit(workspace_id) and uploaded_by=(select auth.uid()));
grant select,insert on public.record_attachments to authenticated;
drop policy if exists atlas_files_select on storage.objects;
create policy atlas_files_select on storage.objects for select to authenticated using(bucket_id='atlas-private' and split_part(name,'/',1) ~ '^[0-9a-f-]{36}$' and public.has_membership(split_part(name,'/',1)::uuid));
drop policy if exists atlas_files_insert on storage.objects;
create policy atlas_files_insert on storage.objects for insert to authenticated with check(bucket_id='atlas-private' and split_part(name,'/',1) ~ '^[0-9a-f-]{36}$' and public.can_edit(split_part(name,'/',1)::uuid));
