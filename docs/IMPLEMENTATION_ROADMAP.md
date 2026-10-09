# ATLAS — Plano de execução após auditoria (2026-10-09)

Fonte de verdade do código: este repositório. Fonte de verdade dos dados: Supabase ATLAS. Hospedagem: GitHub Pages. Nenhuma chave privada no cliente.

## Gates para cada entrega
- CI deve passar: TypeScript, testes e build estático.
- Toda mudança SQL deve ter migration versionada e revisão de RLS/grants.
- Teste negativo de acesso cross-workspace em staging antes de produção.
- Registrar rollback, estado do deploy e limites da verificação.
- Dados pessoais e feedbacks ficam fora do repositório público.

## Sprint 1 — Segurança e recuperação (P0)
- [x] Restringir UPDATE de notificações ao campo read_at.
- [x] Versionar essa alteração e adicionar testes de contratos básicos.
- [ ] Reconciliar o esquema completo do banco com migrations reexecutáveis num banco novo.
- [ ] Revisar SECURITY DEFINER, grants e search_path em todas as RPCs.
- [ ] Configurar teste de RLS por papéis (owner/admin/editor/viewer) e entre workspaces.
- [ ] Estabelecer backups, procedimento de restauração e ambiente de homologação.
- [ ] Ativar proteção contra senhas vazadas; testar signup, OTP, login, redefinição e convite.
**Aceite:** bootstrap reproduzível, isolamento comprovado, recuperação ensaiada.

## Sprint 2 — Identidade e colaboração (P0/P1)
- [ ] Convites vinculados a e-mail, revogação e expiração com auditoria.
- [ ] Gestão de integrantes por owner/admin e ações de saída/desativação.
- [ ] Identidade de participantes vinculada a perfis, com política de privacidade.
- [ ] Testes E2E de identidade, primeira organização e permissões.

## Sprint 3 — Decisões e execução (P1)
- [ ] Relacionar tarefa ↔ decisão ↔ reunião com FKs e links profundos.
- [ ] Responsável, prioridade, status granular, revisão e comentários em tarefas.
- [ ] Aprovação/versionamento completos, gestão de vigência e política de arquivamento.
- [ ] Abrir entidade exata na auditoria e nos avisos.

## Sprint 4 — Treinamentos, reuniões e feedbacks (P1)
- [ ] Atas com pauta, participantes, decisões e encaminhamentos.
- [ ] Presenças e justificativas, rituais obrigatórios, métricas de aderência.
- [ ] Feedbacks privados por destinatário e políticas específicas de acesso.

## Sprint 5 — Pesquisa, notificações e UX (P1)
- [ ] Busca paginada e filtrada no servidor, sem limite silencioso de 500.
- [ ] Realtime/foco para avisos, deduplicação e reconciliação de permissão.
- [ ] Estados de erro/carregamento, acessibilidade, mobile e qualidade web.
- [ ] Quebrar app/page.tsx em módulos com state e data access dedicados.

## Sprint 6 — Documentos e memória (P1)
- [ ] Storage privado, política de tipos/tamanho, anexos com autoria.
- [ ] Importação com preview, consentimento, deduplicação, origem e versionamento.
- [ ] Modelos de registros e links de fonte estáveis.

## Sprint 7 — ATLAS AI (P2)
- [ ] Supabase Edge Function, secrets server-side, identidade do usuário e rate limiting.
- [ ] Recuperação respeitando RLS, fontes verificáveis e avaliação de respostas.
- [ ] Logs mínimos, política de retenção e custos por organização.

## Sprint 8 — Gestão e operação (P2)
- [ ] Dashboards de execução, treinamentos e qualidade de conhecimento.
- [ ] Alertas de erro, monitoramento, custos, backup testado e manual operacional.
- [ ] Revisão de privacidade, acesso, conformidade e homologação antes de dados sensíveis.

## Definição de pronto
Mudança integrada ao GitHub, migration aplicada quando necessária, testes adequados ao risco, execução de CI e deploy verificados. Não confundir build verde com autorização ou jornada E2E comprovada.
