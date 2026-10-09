# Sprint 6 | Documentos e memória

O bucket privado `atlas-private` e a tabela `public.record_attachments` foram implantados no Supabase ATLAS.

A interface de documentos está em `components/documents-panel.tsx`, acessível pelo menu **Documentos**. Ela faz prévia de arquivos textuais, requer consentimento, gera hash SHA-256 no navegador, detecta duplicação entre itens consultados, permite associar um registro e URL de origem e abre anexos por link temporário.

Migrations versionadas:
- `supabase/migrations/20261009_sprint6_private_attachments.sql`
- `supabase/migrations/20261009_sprint6_storage_cleanup.sql`

Segurança: bucket não público, tamanho máximo 5 MB, MIME types restritos, RLS por workspace, autoria e política para o usuário remover upload próprio em falha de gravação de metadados.

Limites: não houve importação automática do Drive nem testes autenticados E2E; versão de documentos ainda exige evolução, a deduplicação de frontend considera os 100 anexos consultados, hashes informados pelo cliente não são recalculados pelo banco e a recuperação de migrations históricas em banco limpo ainda não está homologada. O CI valida contratos e build, não substitui teste de upload com duas organizações.

## Incremento: versionamento e deduplicação
A migration `supabase/migrations/20261009_sprint6_document_versions.sql` vincula `previous_version_id` ao predecessor no mesmo workspace e com o mesmo nome, incrementa a versão no banco e impede bifurcação de sucessores. Na UI, o usuário escolhe um documento anterior com o mesmo nome ao importar uma revisão. A verificação de SHA-256 consulta todo o workspace no servidor, não apenas a lista local de 100 arquivos. O hash ainda é calculado no navegador; uma verificação independente de bytes armazenados exigirá serviço confiável de backend. O aceite E2E multiusuário continua pendente.
