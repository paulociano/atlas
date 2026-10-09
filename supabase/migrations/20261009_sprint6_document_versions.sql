-- Versionamento server-side de anexos: a sequência fica no banco.
alter table public.record_attachments add column if not exists previous_version_id uuid references public.record_attachments(id);
create or replace function public.attachment_version_guard() returns trigger language plpgsql security definer set search_path='' as $fn$
declare old_record public.record_attachments%rowtype;
begin
 if new.previous_version_id is null then
  new.version:=1;
 else
  select * into old_record from public.record_attachments where id=new.previous_version_id for update;
  if not found or old_record.workspace_id<>new.workspace_id or old_record.original_name<>new.original_name then raise exception 'Versão anterior inválida';end if;
  if old_record.sha256=new.sha256 then raise exception 'Documento idêntico à versão anterior';end if;
  if exists(select 1 from public.record_attachments where previous_version_id=old_record.id) then raise exception 'Uma nova versão já foi publicada';end if;
  new.version:=old_record.version+1;
 end if;
 return new;
end $fn$;
drop trigger if exists attachment_version_guard on public.record_attachments;
create trigger attachment_version_guard before insert on public.record_attachments for each row execute function public.attachment_version_guard();
create unique index if not exists record_attachments_one_successor on public.record_attachments(previous_version_id) where previous_version_id is not null;
revoke all on function public.attachment_version_guard() from public,anon,authenticated;
