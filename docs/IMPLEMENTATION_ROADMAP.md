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
- [x] Convites vinculados a e-mail verificado, revogação, expiração e listagem administrativa (aceite e revogação rastreáveis pelo estado no banco; auditoria formal de convites pendente).
- [x] Gestão de integrantes pelo proprietário, mudança de papéis, remoção e saída voluntária, protegendo o último proprietário (admin não administra membros).
- [x] Vínculo opcional entre presença de treinamento e perfil do integrante com isolamento por workspace; política de privacidade e retenção organizacional ainda pendentes.
- [ ] Testes E2E reais de identidade, primeira organização e permissões em homologação separada (dependência para homologar a Sprint 2).

## Sprint 3 — Decisões e execução (P1)
- [x] Tarefas vinculadas a decisão/reunião por FK com validação por workspace e navegação direta ao registro.
- [x] Responsável, prioridade, status granular e comentários de tarefa; revisões de mudanças registradas em audit_events.
- [x] Aprovação e versionamento existentes, arquivamento administrativo de registros vigentes implementado e auditado. Política de retenção institucional detalhada será tratada em governança/compliance.
- [x] Navegação para entidade exata de tarefas e registros a partir de auditoria/avisos, quando ainda existir e estiver carregada.

## Sprint 4 — Treinamentos, reuniões e feedbacks (P1)
- [x] Atas de reuniões com pauta, decisões e encaminhamentos; participantes permanecem vinculados ao registro de presença.
- [x] Registro de presença/falta, justificativa, opção de treinamento obrigatório e aderência calculada sobre participações registradas (não sobre todos os convocados).
- [x] Feedbacks individuais em tabela exclusiva, com RLS de autor/destinatário e interface integrada; registros legados do tipo feedback continuam sendo registros comuns e não devem armazenar informações confidenciais.

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

## Status de homologação sem custos adicionais
A implementação funcional da Sprint 2 está entregue. Auditoria SQL read-only de cinco controles foi aprovada no Supabase ativo. Testes E2E autenticados com contas independentes e ambiente isolado seguem pendentes por decisão de não provisionar branch paga. Não tratar a Sprint 2 como homologada até concluir esse gate.

## Sprint 3 — Nota de aceite
Entregas funcionais implantadas em código e migrations. Os contratos automatizados e o build são o gate mínimo; E2E multiusuário em homologação segue pendente devido à opção de não criar ambiente pago. Navegação profunda ocorre dentro da sessão da aplicação (não é URL compartilhável). Comentários são append-only para colaboradores com permissão de edição. Arquivamento não apaga versões ou logs.

## Sprint 4 — Limites de aceite
O registro estruturado e os controles foram implementados, mas a taxa de presença usa apenas os participantes cadastrados, não uma lista formal de convocados. A privacidade aplica-se à nova tabela private_feedback e não retroage para entradas legadas do tipo feedback. Testes multiusuário autenticados seguem não executados por ausência de homologação isolada, sem custo adicional autorizado.
