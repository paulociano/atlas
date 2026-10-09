-- Índices existentes em produção e ausentes do baseline versionado.
create index if not exists entries_created_by_idx on public.entries(created_by);
create index if not exists tasks_created_by_idx on public.tasks(created_by);
create index if not exists attendance_recorded_by_idx on public.attendance(recorded_by);
create index if not exists invites_workspace_idx on public.invites(workspace_id);
create index if not exists entry_versions_workspace_idx on public.entry_versions(workspace_id,entry_id,revision desc);
create index if not exists entries_search_index on public.entries using gin(to_tsvector('portuguese',coalesce(title,'')||' '||coalesce(body,'')));
