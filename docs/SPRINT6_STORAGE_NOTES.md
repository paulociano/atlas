# Sprint 6 | Documentos e memória

O bucket privado `atlas-private` e a tabela `public.record_attachments` foram implantados no Supabase ATLAS.

A interface de documentos está em `components/documents-panel.tsx`, acessível pelo menu **Documentos**. Ela faz prévia de arquivos textuais, requer consentimento, gera hash SHA-256 no navegador, detecta duplicação entre itens consultados, permite associar um registro e URL de origem e abre anexos por link temporário.

Migrations versionadas:
- `supabase/migrations/20261009_sprint6_private_attachments.sql`
- `supabase/migrations/20261009_sprint6_storage_cleanup.sql`

Segurança: bucket não público, tamanho máximo 5 MB, MIME types restritos, RLS por workspace, autoria e política para o usuário remover upload próprio em falha de gravação de metadados.

Limites: não houve importação automática do Drive nem testes autenticados E2E; versão de documentos ainda exige evolução, a deduplicação de frontend considera os 100 anexos consultados, hashes informados pelo cliente não são recalculados pelo banco e a recuperação de migrations históricas em banco limpo ainda não está homologada. O CI valida contratos e build, não substitui teste de upload com duas organizações.
