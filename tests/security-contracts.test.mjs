import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
test('notifications update grants are restricted to read_at',()=>{
 const sql=read('supabase/migrations/20261009_notifications_hardening.sql');
 assert.match(sql,/revoke update on public\.notifications from authenticated/i);
 assert.match(sql,/grant update\(read_at\) on public\.notifications to authenticated/i);
});
test('signup requires a full name and links return to the published application',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/full_name:fullName\.trim\(\)/);
 assert.match(page,/fullName\.trim\(\)\.split/);
 assert.match(page,/emailRedirectTo:'https:\/\/paulociano\.github\.io\/atlas\/'/);
});
test('sensitive server-only credentials must not enter browser code or deploy workflow',()=>{
 for(const path of ['lib/supabase.ts','app/page.tsx','.github/workflows/pages.yml']){
  const source=read(path);
  assert.doesNotMatch(source,/sb_secret_|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY/);
 }
});
test('audit, notifications, team, and approval flows stay wired into navigation',()=>{
 const page=read('app/page.tsx');
 for(const module of ['AuditPanel','NotificationsPanel','TeamPanel','GovernancePanel','PendingCenter']){
  assert.match(page,new RegExp('<'+module+'\\b'));
 }
});

test('reproducible migration files cover governance, profiles and notifications',()=>{
 for(const path of ['supabase/migrations/20261009_full_name_profiles.sql','supabase/migrations/20261009_governance_baseline.sql','supabase/migrations/20261009_notifications_baseline.sql','supabase/migrations/20261009_profile_self_service.sql','supabase/migrations/20261009_notifications_hardening.sql']) assert.ok(Boolean(read(path)),path);
 assert.match(read('supabase/migrations/20261009_governance_baseline.sql'),/create function public.accept_invite/);
 assert.match(read('supabase/migrations/20261009_notifications_baseline.sql'),/create policy notifications_read/);
});

test('version captures only creation and content or status changes',()=>{const sql=read('supabase/migrations/20261009_governance_baseline.sql');assert.match(sql,/create trigger entry_version_insert after insert/i);assert.match(sql,/create trigger entry_version_update after update of title,body,status/i);assert.doesNotMatch(sql,/create trigger entry_version_capture after insert or update/i)});
test('production lookup indexes are versioned',()=>{const sql=read('supabase/migrations/20261009_search_and_fk_indexes.sql');assert.match(sql,/entries_search_index/);assert.match(sql,/to_tsvector\('portuguese'/);assert.match(sql,/entry_versions_workspace_idx/) });

test('notification reconciliation removes approvals when admin rights are revoked',()=>{
 const sql=read('supabase/migrations/20261009_notification_permission_reconciliation.sql');
 assert.match(sql,/delete from public\.notifications n/i);
 assert.match(sql,/n\.kind='approval'/i);
 assert.match(sql,/m\.role in \('owner','admin'\)/i);
 assert.match(sql,/n\.user_id=\(select auth\.uid\(\)\)/i);
 assert.match(sql,/e\.workspace_id=target_workspace/i);
});

test('SQL isolation rehearsal is guarded and rollback-only',()=>{const sql=read('supabase/tests/rls_isolation.sql');assert.match(sql,/atlas\.allow_isolation_test/);assert.match(sql,/set local role authenticated/);assert.match(sql,/request\.jwt\.claim\.sub/);assert.match(sql,/cross-workspace/);assert.match(sql,/rollback;\s*$/i)});

test('owner-only team management forbids self changes and owner demotion',()=>{
 const sql=read('supabase/migrations/20261009_safe_member_administration.sql');
 assert.match(sql,/role='owner'/);
 assert.match(sql,/target_user=\(select auth\.uid\(\)\)/);
 assert.match(sql,/existing_role='owner'/);
 assert.match(sql,/new_role in \('admin','editor','viewer'\)/);
 assert.match(sql,/revoke all on function public\.manage_workspace_member/);
});

test('invites bind recipients and support revocation',()=>{const sql=read('supabase/migrations/20261009_email_bound_invites.sql');assert.match(sql,/inv\.invited_email is distinct from current_email/);assert.match(sql,/revoked_at is null/);assert.match(sql,/revoke all on function public\.create_invite/);assert.match(sql,/function public\.revoke_invite/);const ui=read('components/team-panel.tsx');assert.match(ui,/create_email_invite/);assert.match(ui,/revoke_invite/);});

test('targeted invites require confirmed email and notifications require active membership',()=>{
 const sql=read('supabase/migrations/20261009_verified_invites_membership_rls.sql');
 assert.match(sql,/email_confirmed_at/);
 assert.match(sql,/inv\.invited_email is distinct from current_email/);
 assert.match(sql,/verified_at is null/);
 assert.match(sql,/public\.has_membership\(workspace_id\)/);
 assert.match(sql,/notifications_read/);
 assert.match(sql,/notifications_update/);
});

test('voluntary exit protects last owner and membership scope',()=>{
 const sql=read('supabase/migrations/20261009_voluntary_workspace_exit.sql');
 assert.match(sql,/user_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/current_role='owner'/);
 assert.match(sql,/other_owners=0/);
 assert.match(sql,/delete from public\.memberships/);
 assert.match(sql,/revoke all on function public\.leave_workspace/);
 assert.match(read('components/team-panel.tsx'),/leave_workspace/);
});

test('attendance links only to workspace members without losing external participants',()=>{
 const sql=read('supabase/migrations/20261009_attendance_profile_link.sql');
 assert.match(sql,/participant_user_id uuid references auth\.users/);
 assert.match(sql,/new\.participant_user_id is not null and not exists/);
 assert.match(sql,/workspace_id=new\.workspace_id/);
 const page=read('app/page.tsx');
 assert.match(page,/participant_user_id:attUser\|\|null/);
 assert.match(page,/Participante externo ou sem perfil/);
});

test('read-only production metadata audit covers Sprint 2 security gates',()=>{const sql=read('supabase/tests/security_metadata_audit.sql');assert.match(sql,/pg_policies/);assert.match(sql,/has_function_privilege/);assert.match(sql,/email_confirmed_at/);assert.match(sql,/column_privileges/);assert.doesNotMatch(sql,/\b(insert|update|delete|drop|alter|truncate|create)\s+(?:table|into|from|public\.)/i)});

test('Sprint 3 tasks validate source and assignee within same workspace',()=>{
 const sql=read('supabase/migrations/20261009_sprint3_task_links_priority.sql');
 assert.match(sql,/e\.workspace_id=new\.workspace_id/);
 assert.match(sql,/m\.workspace_id=new\.workspace_id/);
 assert.match(sql,/e\.kind in \('decisao','reuniao'\)/);
 assert.match(sql,/tasks_priority_check/);
 const page=read('app/page.tsx');
 assert.match(page,/source_entry_id:taskSource\|\|null/);
 assert.match(page,/assignee_user_id:taskAssignee\|\|null/);
 assert.match(page,/priority:taskPriority/);
});

test('Sprint 3 status, comments, and archival have workspace authorization',()=>{
 const sql=read('supabase/migrations/20261009_sprint3_status_comments.sql');
 assert.match(sql,/status in \('pendente','em_andamento','bloqueada','concluida','cancelada'\)/);
 assert.match(sql,/public\.has_membership\(workspace_id\)/);
 assert.match(sql,/public\.can_edit\(workspace_id\)/);
 assert.match(sql,/t\.workspace_id=task_comments\.workspace_id/);
 const archive=read('supabase/migrations/20261009_sprint3_archive_entry.sql');
 assert.match(archive,/role in \('owner','admin'\)/);
 assert.match(archive,/current_status<>'vigente'/);
 const ui=read('app/page.tsx');
 assert.match(ui,/TaskComments taskId=/);
 assert.match(ui,/archive_entry/);
 assert.match(ui,/scrollIntoView/);
});

test('Sprint 4 private feedback, meeting minutes and attendance contracts',()=>{
 const sql=read('supabase/migrations/20261009_sprint4_meetings_training_feedback.sql');
 assert.match(sql,/private_feedback_read/);
 assert.match(sql,/recipient_id=\(select auth\.uid\(\)\) or author_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/e\.workspace_id=new\.workspace_id/);
 assert.match(sql,/m\.workspace_id=new\.workspace_id/);
 assert.match(sql,/absence_reason/);
 assert.match(sql,/mandatory_training/);
 const ui=read('components/rituals-panel.tsx');
 for(const action of ['meeting_minutes','private_feedback','attendance','mandatory_training']) assert.match(ui,new RegExp(action));
 assert.match(read('app/page.tsx'),/RitualsPanel workspaceId=/);
});

test('Sprint 4 mandatory ritual updates require administrative RPC',()=>{
 const sql=read('supabase/migrations/20261009_sprint4_attendance_update_required.sql');
 assert.match(sql,/role in \('owner','admin'\)/);
 assert.match(sql,/public\.can_edit\(workspace_id\)/);
 assert.match(sql,/function public\.set_training_required/);
 const ui=read('components/rituals-panel.tsx');
 assert.match(ui,/rpc\('set_training_required'/);
});

test('Drive-inspired ritual examples are anonymized and read-only',()=>{
 const examples=read('lib/record-examples.ts');
 const ui=read('components/record-examples.tsx');
 assert.match(examples,/Duplicado/);
 assert.match(examples,/Atrasado/);
 assert.match(examples,/Ausente justificado/);
 assert.match(examples,/Sem participação efetiva/);
 assert.match(ui,/não adicionam dados ao workspace/);
 assert.doesNotMatch(ui,/supabase\.from\(|\.insert\(/);
 assert.match(read('components/rituals-panel.tsx'),/<RecordExamples\/>/);
});

test('Sprint 5 records use server filtering and paginated loading',()=>{
 const page=read('app/page.tsx');
 const hook=read('lib/use-workspace-record-search.ts');
 assert.match(hook,/\.range\(page\*PAGE_SIZE,page\*PAGE_SIZE\+PAGE_SIZE-1\)/);
 assert.match(hook,/count:'exact'/);
 assert.match(page,/searchLoading/);
 assert.match(page,/searchError/);
 assert.match(page,/setSearchPage/);
});
test('Sprint 5 notifications revalidate on focus with realtime fallback',()=>{
 const notices=read('components/notifications-panel.tsx');
 assert.match(notices,/addEventListener\('focus'/);
 assert.match(notices,/postgres_changes/);
 assert.match(notices,/removeChannel/);
});

test('Sprint 5 accessibility and live unread badge',()=>{
 const css=read('app/globals.css');
 const page=read('app/page.tsx');
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(page,/atlas-badge-/);
 assert.match(page,/window\.addEventListener\('focus',onFocus\)/);
 assert.match(read('supabase/migrations/20261009_sprint5_notifications_realtime.sql'),/alter publication supabase_realtime add table public\.notifications/);
});

test('dashboard counts use exact database counts instead of 500-entry preview',()=>{
 const hook=read('lib/use-workspace-counts.ts');
 const page=read('app/page.tsx');
 assert.match(hook,/count:'exact',head:true/);
 assert.match(hook,/\.in\('kind',\['decisao','regra','conduta'\]\)/);
 assert.match(page,/workspaceCounts\?\.records/);
 assert.match(page,/workspaceCounts\?\.openTasks/);
});

test('limited overview is explicitly disclosed when count exceeds preview',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/workspaceCounts\.records>entries\.length/);
 assert.match(page,/Consulte Base de conhecimento/);
});

test('workspace preview loading is isolated from the main page',()=>{
 const hook=read('lib/use-workspace-data.ts');
 const page=read('app/page.tsx');
 assert.match(hook,/useCallback/);
 assert.match(hook,/\.limit\(500\)/);
 assert.match(hook,/Promise\.all/);
 assert.match(page,/useWorkspaceData\(wid\)/);
 assert.doesNotMatch(page,/async function refresh\(id:string\)/);
});

test('workspace switch ignores stale responses from prior workspace',()=>{
 const hook=read('lib/use-workspace-data.ts');
 assert.match(hook,/latestWorkspace\.current=workspaceId/);
 assert.match(hook,/if\(id!==latestWorkspace\.current\)return/);
});
