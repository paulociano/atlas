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
