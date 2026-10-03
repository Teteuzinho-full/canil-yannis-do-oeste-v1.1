# Deploy no Vercel — passo a passo

1. **Banco Postgres**: no painel do Vercel, aba *Storage* → *Create Database* → *Neon* (Postgres). Conecte ao projeto: isso cria `DATABASE_URL` (ou `POSTGRES_URL`) automaticamente.
2. **Armazenamento de fotos**: *Storage* → *Create* → *Blob*. Conecte ao projeto: isso cria `BLOB_READ_WRITE_TOKEN`.
3. **Variáveis** (Settings → Environment Variables, ambiente Production): `JWT_SECRET` (texto longo e aleatório), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BASE_URL` (https://seu-dominio).
4. **Subir o código** para um repositório no GitHub (sem `node_modules` nem `.env`) e importar em vercel.com/new. Framework: *Other*; sem build command.
5. **Deploy**. No primeiro acesso as tabelas e o administrador são criados sozinhos.
6. Abra `https://seu-dominio/admin`, entre e cadastre os cães.
7. **Domínio próprio**: Settings → Domains. Depois atualize `BASE_URL` e faça um novo deploy (canonical, sitemap e Open Graph usam esse valor).
