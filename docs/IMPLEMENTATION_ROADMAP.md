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
- [~] Auditoria read-only de metadados das 24 funções SECURITY DEFINER: search_path explícito e sem EXECUTE ao papel anon; revisão interna de autorização por função continua pendente.
- [~] Auditoria read-only confirmou RLS em 14 tabelas públicas. Os testes reais por papel e entre organizações em ambiente isolado continuam pendentes.
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
- [x] Listagem principal com filtros e paginação no servidor (30/página) e contagens exatas no painel; prévias locais limitadas a 500 são sinalizadas explicitamente.
- [x] Notificações e contador atualizados ao recuperar foco e via eventos Realtime; RPC reconcilia permissões; publicação da tabela confirmada no Supabase.
- [x] Estados de carregamento/erro da busca, formulários responsivos, foco visível e preferência por movimento reduzido; testes de acessibilidade em navegador real permanecem no gate E2E.
- [~] Dados de workspace, contagens e busca separados em três hooks; apresentação de `app/page.tsx` ainda merece divisão em componentes de tela (dívida técnica).

## Sprint 6 — Documentos e memória (P1)
- [x] Bucket privado com limites de tamanho/tipo, metadados de autoria e RLS por organização; testes reais de upload e download autenticados pendentes.
- [~] Importação manual com prévia de texto, consentimento, hash SHA-256, rejeição de duplicatas na interface e origem vinculada; versionamento evolutivo e limpeza de objetos órfãos ainda pendentes.
- [~] Modelos anonimizados da Sprint 4 e URL de origem de anexo registrados; links estáveis e importação em lote ainda pendentes.

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

## Sprint 5 — Registro técnico
A consulta principal de registros usa contagem exata e páginas de 30 resultados, com filtro de categoria no banco e busca por título/corpo. O painel de notificações reconcilia via RPC ao carregar e ao voltar o foco, e tenta receber alterações via Supabase Realtime. A publicação supabase_realtime para notifications está habilitada e verificada em produção; a entrega efetiva no cliente ainda carece de teste autenticado. A aplicação ainda usa um resumo local limitado a 500 registros para visão geral e relacionamentos; essa dependência deverá ser removida antes de declarar o requisito global de ausência de truncamento como cumprido. Testes E2E sem ambiente isolado continuam pendentes.

## Encerramento funcional da Sprint 5
Busca paginada e indicadores de contagem exata estão operacionais no código; notificações têm reconciliação e canal Realtime confirmado. Os previews de outras áreas ainda carregam até 500 registros por conveniência, com aviso claro ao usuário. Qualidade mobile/foco/movimento reduzido implementada, mas homologação em navegadores reais, autenticação multiusuário e verificação assistiva seguem sem execução em ambiente isolado. A divisão restante de `app/page.tsx` é dívida de arquitetura, não ocultada como item aprovado.

## Sprint 6 — Integração
UI em `components/documents-panel.tsx`; migration em `supabase/migrations/20261009_sprint6_private_attachments.sql`. Metadados mantêm nome, SHA-256 informado pelo navegador, autor, URL de origem e vínculo opcional ao registro. Limites: a prévia textual é parcial; hash calculado no cliente não é verificado pelo banco contra bytes armazenados; o formulário usa até 500 registros recentes no seletor; falha ao gravar metadados após upload pode deixar arquivo órfão; migrações históricas ainda requerem teste de bootstrap isolado. Não foram importados documentos reais automaticamente.

## 2026-10-09 | Gate gratuito de metadados de segurança
Consulta read-only no Supabase de produção identificou 14 tabelas públicas com RLS ativo e 24 funções SECURITY DEFINER com search_path explícito e sem EXECUTE anônimo. Verificações de violations retornaram zero nos três controles. SQL reproduzível em `supabase/tests/readonly_security_gate.sql`. Isso não prova isolamento multiusuário nem substitui auditoria do corpo das funções, restauração ou E2E autenticado. Nenhum recurso pago criado.
