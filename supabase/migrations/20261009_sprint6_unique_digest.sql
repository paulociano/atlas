-- A deduplicação é garantida também contra imports simultâneos.
create unique index if not exists record_attachments_unique_workspace_hash on public.record_attachments(workspace_id,sha256);
