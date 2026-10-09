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
