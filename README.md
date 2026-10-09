# ATLAS
Segundo cérebro corporativo. Interface responsiva, registros, decisões, reuniões, treinamentos e ações.

## GitHub Pages
Site esperado: https://paulociano.github.io/atlas/

Projeto Next.js exportado como conteúdo estático, publicado por `.github/workflows/pages.yml`. No GitHub, abra **Settings → Pages → Build and deployment → Source: GitHub Actions**. Esta configuração pode exigir ação manual porque o conector GitHub não oferece edição das configurações de Pages.

### Conexão de dados
Projeto Supabase ATLAS criado em São Paulo (`nblhmcnqytcbndatrgtd`); esquema inicial aplicado e RLS habilitado. No GitHub, configure **Settings → Secrets and variables → Actions → Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave **publishable** ou pública do Supabase (nunca service_role).

A configuração atual de build já aponta para o projeto ATLAS; as variáveis em Actions podem ser usadas numa próxima revisão para facilitar rotação. Em Auth → URL Configuration do Supabase, configure Site URL `https://paulociano.github.io/atlas/` e redirect URL correspondente. Configurar MFA e políticas de acesso antes de uso corporativo.

O banco exclusivo ATLAS foi criado em 09/10/2026. A chave publishable é pública por design e consta na configuração de build, jamais utilize service_role no GitHub Pages.

### Limitações
GitHub Pages hospeda apenas arquivos estáticos, não funções Next.js/API. A busca ATLAS é textual, restrita pelos registros carregados via Supabase RLS. IA generativa, ingestão automática, webhooks, tarefas programadas e transcrição exigem serviços backend externos. O código do antigo endpoint de IA foi removido do build estático.

### Desenvolvimento
`npm install && npm run dev`. Testes: `npm run lint && npm test && npm run build`. Não envie dados pessoais para o repositório público.
