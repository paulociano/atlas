-- Sprint 1: limitar modificações de notificações ao estado de leitura
revoke update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;
revoke execute on function public.has_membership(uuid) from public,anon;
revoke execute on function public.can_edit(uuid) from public,anon;
revoke execute on function public.refresh_my_notifications(uuid) from public,anon;
create index if not exists idx_notifications_user_unread on public.notifications(user_id,workspace_id,created_at desc) where read_at is null;
