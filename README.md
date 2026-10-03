# Yannis do Oeste Rottweilers — site + painel (Node.js + Postgres)

Site público (`public/index.html` + páginas renderizadas no servidor), painel em `/admin` e API Express.
Banco: **PostgreSQL**. Fotos: **Vercel Blob** (em produção) ou pasta `uploads/` (local).

## Rodar localmente
Requer Node 20.12+ e um Postgres (local ou um banco grátis do Neon).
1. `npm install`
2. `cp .env.example .env` e preencha `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (senha com `#` vai entre aspas).
3. `npm start` → http://localhost:3000 e http://localhost:3000/admin

As tabelas são criadas sozinhas no primeiro acesso (migrations em `src/db.js`, tabela `schema_migrations`).
O usuário SUPER_ADMIN é criado a partir do `.env` se ainda não existir.

## Deploy no Vercel
Veja o passo a passo em `DEPLOY-VERCEL.md`.

## Páginas públicas (com SEO)
`/rottweilers` (`?sexo=macho|femea`), `/rottweilers/:id`, `/filhotes`, `/ninhadas/:id`: title, description, canonical, Open Graph, Twitter Card, breadcrumbs e JSON-LD; todas no `/sitemap.xml`. Itens não publicados dão 404.

## Painel
Dashboard, busca, Ctrl+K, troca de senha; cadastro de Rottweilers (pai/mãe formam o pedigree), Ninhadas, Galeria e Depoimentos; publicar/despublicar; upload de foto JPG/PNG/WebP (até 4 MB).

## API
- Públicas: `GET /api/dogs`, `/api/litters`, `/api/gallery`, `/api/testimonials`
- Auth: `POST /api/auth/login|logout|password`, `GET /api/auth/me`
- Admin: `GET|POST /api/admin/{dogs|litters|gallery|testimonials}`, `PUT|DELETE /api/admin/{...}/:id`, `POST /api/admin/upload`, `GET /api/admin/stats`, `GET /api/admin/audit` (SUPER_ADMIN)

Mutações exigem o header `X-Requested-With: fetch`. Erros: `{ "error": "mensagem" }` (400/401/403/404/409/422/429/500/503).

## Segurança
bcrypt; cookie httpOnly + SameSite=Strict (+Secure em produção); JWT 8 h; permissões no backend; validação no servidor; consultas parametrizadas; rate limit; Helmet/CSP; upload só de imagens; auditoria.
Obs.: o rate limit usa memória, então no Vercel (serverless) vale por instância — é uma proteção parcial.

## Estrutura
`api/index.js` (entrada Vercel), `src/app.js` (rotas), `src/server.js` (local), `src/db.js`, `src/pages.js`, `src/validate.js`, `public/`, `vercel.json`.

## Ainda não implementado
Recuperação de senha por e-mail, cadastro de novos usuários, linha do tempo da ninhada, FAQ editável, gráficos, auditoria Lighthouse, remoção do arquivo no Blob ao excluir um item.
