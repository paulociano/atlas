# Reconstrução controlada do banco ATLAS

A fonte de verdade do esquema versionado é `supabase/schema.sql`, seguida das migrations em ordem lexical. A base de produção NÃO deve ser usada para testes de reconstrução.

## Pré-requisitos
- PostgreSQL com os schemas `auth` e extensões/funções Supabase. A criação do schema `auth` não faz parte deste repositório.
- Projeto Supabase descartável ou banco de homologação recém-criado, sem dados de terceiros.
- `psql` instalado, URL de conexão administrativa armazenada fora do GitHub.

## Execução segura
1. Confirme manualmente o ID do projeto descartável.
2. Conecte com `psql` ao banco de homologação.
3. Execute `supabase/schema.sql` e, na sequência, os arquivos em `supabase/migrations/`, ordenados por nome.
4. Use `ON_ERROR_STOP=1`, abortando imediatamente a primeira falha.
5. Compare tabelas, índices, triggers, funções, RLS e grants com o inventário do ambiente de produção.
6. Execute testes reais com quatro contas de homologação, cobrindo dois workspaces isolados.
7. Descarte o banco de homologação após a validação.

## Matriz mínima de acesso
| Operação | owner | admin | editor | viewer | outro workspace |
|---|---|---|---|---|---|
| Ler registros | sim | sim | sim | sim | não |
| Criar rascunho | sim | sim | sim | não | não |
| Aprovar rascunho | sim | sim | não | não | não |
| Criar convite | sim | sim | não | não | não |
| Editar tarefa | sim | sim | sim | não | não |
| Ler notificação de outro usuário | não | não | não | não | não |
| Alterar conteúdo de notificações | não | não | não | não | não |
| Alterar read_at próprio | sim | sim | sim | sim | não |

## Pendência explícita
Esta rodada registrou baselines e testes estáticos, mas **não executou** uma reconstrução isolada nem a matriz E2E autenticada. A conclusão da Sprint 1 depende desses testes, inclusive para triggers de criação e para permissões reais.

## Teste automatizável de isolamento em homologação
O arquivo `supabase/tests/rls_isolation.sql` cria usuários/organizações sintéticos, troca o papel para `authenticated`, simula JWTs e verifica leitura entre organizações e edição por papel. Ele exige a variável de sessão `atlas.allow_isolation_test=true` e encerra com `ROLLBACK`.

**Nunca execute no banco de produção.** Em um banco descartável, abra o `psql`, execute `SET atlas.allow_isolation_test='true';` e então `\\i supabase/tests/rls_isolation.sql`. A simulação direta de JWT é um teste de banco, não substitui login real via GoTrue e os testes E2E de convites/cadastro.
