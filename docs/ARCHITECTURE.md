# ATLAS Architecture

- Source of truth: Supabase Postgres tables, protected with membership-based RLS.
- Records: immutable creation metadata; audits append database-triggered events.
- Knowledge: typed entries with draft/current/archive state, event time, source URL.
- Meetings/training attendance: explicit per-person assertions linked to event.
- Actions: tracked tasks with status. AI: server-only key, bearer-authenticated reads restricted by RLS, retrieved source snippets cited by ordinal.
- Security: no service role key in browser, no cross-workspace reads, deny-by-default policies, user-scoped API.
- Privacy: source material and employee records belong in private DB, never GitHub; establish purpose, access and retention policies before use.

## Deployment dependencies
1. Supabase project + schema + verified auth email configuration.
2. Set env vars securely in hosting. Never commit actual keys.
3. Production domain, monitoring, backups, rate limiting at edge, approved data retention, policies for membership invitations, administrative operations and change approvals.
4. External ingestion, document connectors, embedding search and meeting transcription are NOT implemented in this commit.

## Known limits
Only the basic workspace owner can be created in the UI. Inviting users, version approval, SSO/MFA, robust audit retention, automated imports, semantic search, offline cache and advanced reporting are future work. Do not treat current source as production security-certified.
