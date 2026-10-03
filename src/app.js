const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const db = require('./db');
const pages = require('./pages');
const { TABLES, clean } = require('./validate');
const { BASE_URL } = require('./config');

const { JWT_SECRET, NODE_ENV, VERCEL, BLOB_READ_WRITE_TOKEN } = process.env;
if (!JWT_SECRET || JWT_SECRET.length < 16) throw new Error('Defina JWT_SECRET (16+ caracteres).');
const prod = NODE_ENV === 'production' || !!VERCEL;
const ROOT = path.join(__dirname, '..');

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const app = express();
app.disable('x-powered-by');
if (prod) app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:', 'https://*.public.blob.vercel-storage.com'], connectSrc: ["'self'"], frameAncestors: ["'none'"] } } }));
app.use(express.json({ limit: '50kb' }));
app.use(async (req, res, next) => { try { await db.ready(); next(); } catch (e) { next(e); } }); // migrations no primeiro acesso

const log = (req, action, entity, id) =>
  db.query('INSERT INTO audit_log(user_id,action,entity,entity_id,ip) VALUES($1,$2,$3,$4,$5)', [req.user?.id ?? null, action, entity ?? null, id ?? null, req.ip]).catch(() => {});
const idOf = req => { const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Registro não encontrado.'); return id; };

// ---- sessão (cookie httpOnly + JWT) e proteção CSRF
const cookie = (req, n) => (req.headers.cookie || '').split(';').map(s => s.trim().split('=')).find(([k]) => k === n)?.[1];
function auth(req, res, next) {
  try { req.user = jwt.verify(cookie(req, 'sid') || '', JWT_SECRET); next(); }
  catch { next(new HttpError(401, 'Sessão expirada. Entre novamente.')); }
}
const role = (...r) => (req, res, next) => r.includes(req.user.role) ? next() : next(new HttpError(403, 'Você não tem permissão para esta ação.'));
app.use('/api', (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method) && req.headers['x-requested-with'] !== 'fetch') return next(new HttpError(403, 'Requisição bloqueada.'));
  next();
});
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas requisições. Aguarde um minuto.' } }));

// ---- público
app.get('/api/dogs', async (req, res) => res.json(await db.rows('SELECT id,name,sex,pedigree,description,photo FROM dogs WHERE published=1 ORDER BY id DESC')));
app.get('/api/litters', async (req, res) => res.json(await db.rows(
  `SELECT l.id,l.name,l.birth_date,l.status,l.notes,l.photo,s.name AS sire_name,d.name AS dam_name FROM litters l
   LEFT JOIN dogs s ON s.id=l.sire_id LEFT JOIN dogs d ON d.id=l.dam_id WHERE l.published=1 ORDER BY l.id DESC`)));
app.get('/api/gallery', async (req, res) => res.json(await db.rows('SELECT id,caption,category,photo FROM gallery WHERE published=1 ORDER BY id DESC')));
app.get('/api/testimonials', async (req, res) => res.json(await db.rows('SELECT id,name,text,dog_name,photo FROM testimonials WHERE published=1 ORDER BY id DESC')));

// ---- autenticação
const DUMMY = bcrypt.hashSync('x', 12);
const cookieOpts = `HttpOnly; SameSite=Strict; Path=/${prod ? '; Secure' : ''}`;
app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60_000, limit: 10, message: { error: 'Muitas tentativas. Tente de novo em 15 minutos.' } }), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(), pw = String(req.body.password || '');
  if (!email || !pw) throw new HttpError(422, 'Informe e-mail e senha.');
  const u = await db.one('SELECT * FROM users WHERE lower(email)=$1', [email]);
  const ok = bcrypt.compareSync(pw, u ? u.password_hash : DUMMY);
  if (!u || !ok) { await log(req, 'login_falhou'); throw new HttpError(401, 'E-mail ou senha incorretos.'); }
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '8h' });
  res.setHeader('Set-Cookie', `sid=${token}; ${cookieOpts}; Max-Age=28800`);
  req.user = u; await log(req, 'login'); res.json({ email: u.email, role: u.role });
});
app.post('/api/auth/logout', (req, res) => { res.setHeader('Set-Cookie', `sid=; ${cookieOpts}; Max-Age=0`); res.json({ ok: true }); });
app.get('/api/auth/me', auth, (req, res) => res.json({ email: req.user.email, role: req.user.role }));
app.post('/api/auth/password', auth, rateLimit({ windowMs: 15 * 60_000, limit: 10, message: { error: 'Muitas tentativas. Tente de novo em 15 minutos.' } }), async (req, res) => {
  const cur = String(req.body.current || ''), nw = String(req.body.next || '');
  if (nw.length < 10) throw new HttpError(422, 'A nova senha precisa ter pelo menos 10 caracteres.');
  const u = await db.one('SELECT * FROM users WHERE id=$1', [req.user.id]);
  if (!u || !bcrypt.compareSync(cur, u.password_hash)) throw new HttpError(422, 'A senha atual está incorreta.');
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [bcrypt.hashSync(nw, 12), u.id]);
  await log(req, 'senha_alterada'); res.json({ ok: true });
});

// ---- admin (CRUD + upload)
const adm = express.Router();
adm.use(auth, role('ADMIN', 'SUPER_ADMIN'));
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_MB = 4; // limite de corpo das funções do Vercel é ~4,5 MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (q, f, cb) => cb(EXT[f.mimetype] ? null : new HttpError(422, 'Envie uma imagem JPG, PNG ou WebP.'), !!EXT[f.mimetype]) });
adm.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(422, 'Selecione uma imagem.');
  const name = crypto.randomBytes(12).toString('hex') + EXT[req.file.mimetype];
  let url;
  if (BLOB_READ_WRITE_TOKEN) {
    const { put } = require('@vercel/blob');
    url = (await put('yannis/' + name, req.file.buffer, { access: 'public', contentType: req.file.mimetype, addRandomSuffix: false })).url;
  } else if (VERCEL) throw new HttpError(503, 'Armazenamento de imagens não configurado (falta BLOB_READ_WRITE_TOKEN).');
  else { await fs.mkdir(path.join(ROOT, 'uploads'), { recursive: true }); await fs.writeFile(path.join(ROOT, 'uploads', name), req.file.buffer); url = '/uploads/' + name; }
  await log(req, 'upload'); res.status(201).json({ url });
});
const tb = t => { if (!Object.hasOwn(TABLES, t)) throw new HttpError(404, 'Recurso não encontrado.'); return t; };
adm.get('/stats', async (req, res) => {
  const c = t => db.one(`SELECT COUNT(*)::int AS total, COALESCE(SUM(published),0)::int AS pub FROM ${t}`);
  const [dogs, litters, gallery, testimonials, recent] = await Promise.all([c('dogs'), c('litters'), c('gallery'), c('testimonials'),
    db.rows("SELECT action,entity,created_at FROM audit_log WHERE action<>'login_falhou' ORDER BY id DESC LIMIT 8")]);
  res.json({ dogs, litters, gallery, testimonials, recent });
});
adm.get('/audit', role('SUPER_ADMIN'), async (req, res) => res.json(await db.rows('SELECT * FROM audit_log ORDER BY id DESC LIMIT 100')));
adm.get('/:t', async (req, res) => res.json(await db.rows(`SELECT * FROM ${tb(req.params.t)} ORDER BY id DESC`)));
adm.post('/:t', async (req, res) => {
  const t = tb(req.params.t), { out, errors } = clean(t, req.body, true);
  if (errors.length) throw new HttpError(422, errors.join(' '));
  const cols = Object.keys(out);
  const r = await db.one(`INSERT INTO ${t}(${cols.join(',')}) VALUES(${cols.map((_, i) => '$' + (i + 1))}) RETURNING *`, Object.values(out));
  await log(req, 'criar', t, r.id); res.status(201).json(r);
});
adm.put('/:t/:id', async (req, res) => {
  const t = tb(req.params.t), id = idOf(req), { out, errors } = clean(t, req.body, false);
  if (errors.length) throw new HttpError(422, errors.join(' '));
  const cols = Object.keys(out);
  if (!cols.length) throw new HttpError(422, 'Nenhum campo para atualizar.');
  if (t === 'dogs' && (out.sire_id === id || out.dam_id === id)) throw new HttpError(422, 'Um cão não pode ser pai ou mãe de si mesmo.');
  const r = await db.one(`UPDATE ${t} SET ${cols.map((c, i) => `${c}=$${i + 1}`)}, updated_at=now() WHERE id=$${cols.length + 1} RETURNING *`, [...Object.values(out), id]);
  if (!r) throw new HttpError(404, 'Registro não encontrado.');
  await log(req, 'editar', t, id); res.json(r);
});
adm.delete('/:t/:id', async (req, res) => {
  const t = tb(req.params.t), id = idOf(req), r = await db.query(`DELETE FROM ${t} WHERE id=$1`, [id]);
  if (!r.rowCount) throw new HttpError(404, 'Registro não encontrado.');
  await log(req, 'excluir', t, id); res.status(204).end();
});
app.use('/api/admin', adm);

// ---- SEO, páginas e estáticos
app.get('/robots.txt', (q, r) => r.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${BASE_URL}/sitemap.xml\n`));
app.get('/sitemap.xml', async (q, r) => r.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${(await pages.urls()).map(u => `<url><loc>${BASE_URL}${u}</loc></url>`).join('')}</urlset>`));
app.get('/rottweilers', async (q, r) => r.send(await pages.dogs(String(q.query.sexo || ''))));
app.get('/rottweilers/:id', async (q, r, n) => { const h = await pages.dog(Number(q.params.id) || 0); h ? r.send(h) : n(); });
app.get('/filhotes', async (q, r) => r.send(await pages.litters()));
app.get('/ninhadas/:id', async (q, r, n) => { const h = await pages.litter(Number(q.params.id) || 0); h ? r.send(h) : n(); });
if (!VERCEL) app.use('/uploads', express.static(path.join(ROOT, 'uploads'), { maxAge: '7d', setHeaders: r => r.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use(express.static(path.join(ROOT, 'public'), { extensions: ['html'], maxAge: prod ? '1h' : 0 }));
app.use((req, res) => req.path.startsWith('/api') ? res.status(404).json({ error: 'Rota não encontrada.' }) : res.status(404).sendFile(path.join(ROOT, 'public/404.html')));
app.use((err, req, res, next) => {
  let s = err.status || 500, m = err.message;
  const PG = { 23505: [409, 'Já existe um registro com esses dados.'], 23503: [422, 'O cão escolhido não existe mais.'], 23514: [422, 'Algum valor informado é inválido.'], '22P02': [422, 'Algum dado está em formato inválido.'] };
  if (err.code === 'LIMIT_FILE_SIZE') { s = 422; m = `Imagem maior que ${MAX_MB} MB.`; }
  else if (PG[err.code]) [s, m] = PG[err.code];
  else if (err.type === 'entity.parse.failed') { s = 400; m = 'JSON inválido.'; }
  else if (s === 500) { console.error(err); m = 'Erro interno. Tente novamente em instantes.'; }
  res.status(s).json({ error: m });
});
module.exports = app;
