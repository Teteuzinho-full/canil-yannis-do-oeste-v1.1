const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) throw new Error('Defina DATABASE_URL (string de conexão do Postgres).');
const pool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });

const query = (text, params) => pool.query(text, params);
const rows = async (text, params) => (await query(text, params)).rows;
const one = async (text, params) => (await query(text, params)).rows[0] || null;

const TS = 'TIMESTAMPTZ NOT NULL DEFAULT now()';
const MIGRATIONS = [[
  `CREATE TABLE users(id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK(role IN('ADMIN','SUPER_ADMIN')), created_at ${TS})`,
  `CREATE TABLE dogs(id SERIAL PRIMARY KEY, name TEXT NOT NULL, sex TEXT CHECK(sex IN('MACHO','FEMEA')), birth_date TEXT,
    pedigree TEXT, titles TEXT, description TEXT, photo TEXT,
    sire_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL, dam_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL,
    published SMALLINT NOT NULL DEFAULT 0, created_at ${TS}, updated_at ${TS})`,
  `CREATE TABLE litters(id SERIAL PRIMARY KEY, name TEXT NOT NULL, birth_date TEXT,
    status TEXT NOT NULL DEFAULT 'PROXIMA' CHECK(status IN('PROXIMA','DISPONIVEL','RESERVADO','ENCERRADO')),
    sire_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL, dam_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL,
    notes TEXT, photo TEXT, published SMALLINT NOT NULL DEFAULT 0, created_at ${TS}, updated_at ${TS})`,
  `CREATE TABLE gallery(id SERIAL PRIMARY KEY, caption TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'CANIL' CHECK(category IN('ROTTWEILERS','FILHOTES','NINHADAS','EXPOSICOES','CANIL')),
    photo TEXT NOT NULL, published SMALLINT NOT NULL DEFAULT 0, created_at ${TS}, updated_at ${TS})`,
  `CREATE TABLE testimonials(id SERIAL PRIMARY KEY, name TEXT NOT NULL, text TEXT NOT NULL, dog_name TEXT, photo TEXT,
    published SMALLINT NOT NULL DEFAULT 0, created_at ${TS}, updated_at ${TS})`,
  `CREATE TABLE audit_log(id SERIAL PRIMARY KEY, user_id INTEGER, action TEXT NOT NULL, entity TEXT, entity_id INTEGER, ip TEXT, created_at ${TS})`,
  'CREATE INDEX idx_dogs_pub ON dogs(published)',
  'CREATE INDEX idx_litters_pub ON litters(published, status)',
  'CREATE INDEX idx_gallery_pub ON gallery(published)',
], [
  `CREATE TABLE site_content(slug TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT, body TEXT, extra TEXT,
    sort INTEGER NOT NULL DEFAULT 0, published SMALLINT NOT NULL DEFAULT 1, created_at ${TS}, updated_at ${TS})`,
  `CREATE TABLE content_images(id SERIAL PRIMARY KEY, slug TEXT NOT NULL REFERENCES site_content(slug) ON UPDATE CASCADE ON DELETE CASCADE,
    url TEXT NOT NULL, alt TEXT, caption TEXT, position TEXT NOT NULL DEFAULT 'center', sort INTEGER NOT NULL DEFAULT 0,
    published SMALLINT NOT NULL DEFAULT 1, created_at ${TS})`,
  'CREATE INDEX idx_content_images_slug ON content_images(slug, sort)',
  `CREATE TABLE videos(slot TEXT PRIMARY KEY CHECK(slot IN('canil','filhotes')), title TEXT, description TEXT, url TEXT, poster TEXT,
    published SMALLINT NOT NULL DEFAULT 0, updated_at ${TS})`,
  'ALTER TABLE gallery DROP CONSTRAINT IF EXISTS gallery_category_check',
  `ALTER TABLE gallery ADD CONSTRAINT gallery_category_check CHECK(category IN('ROTTWEILERS','FILHOTES','NINHADAS','EXPOSICOES','CANIL',
    'ALIMENTACAO','VACINACAO','SAUDE','VETERINARIO','PEDIGREE','MICROCHIPAGEM','PESSOAS'))`,
  async c => {
    const { SECTIONS, IMAGES, GALLERY, VIDEOS, C } = require('./seed-content');
    for (const s of SECTIONS) await c.query('INSERT INTO site_content(slug,sort,title,subtitle,body,extra) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (slug) DO NOTHING', [s.slug, s.sort, s.title, s.subtitle, s.body, s.extra]);
    let n = 0;
    for (const [slug, f, alt, cap, pub] of IMAGES) await c.query('INSERT INTO content_images(slug,url,alt,caption,sort,published) VALUES($1,$2,$3,$4,$5,$6)', [slug, `${C}${f}.webp`, alt, cap, (n += 10), pub]);
    for (const [f, cap, cat, pub] of GALLERY) await c.query('INSERT INTO gallery(caption,category,photo,published) VALUES($1,$2,$3,$4)', [cap, cat, `${C}${f}.webp`, pub]);
    for (const v of VIDEOS) await c.query('INSERT INTO videos(slot,title,description,url,poster,published) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (slot) DO NOTHING', [v.slot, v.title, v.description, v.url, v.poster, v.published]);
  },
]];

async function init() {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    // lock válido só dentro desta transação: seguro também com o pooler do Neon (pgbouncer)
    await c.query('SELECT pg_advisory_xact_lock(727001)');
    await c.query('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY)');
    const { rows: r } = await c.query('SELECT COALESCE(MAX(version),0)::int AS v FROM schema_migrations');
    for (let v = r[0].v; v < MIGRATIONS.length; v++) {
      for (const s of MIGRATIONS[v]) await (typeof s === 'function' ? s(c) : c.query(s));
      await c.query('INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING', [v + 1]);
    }
    // Espaços e maiúsculas nas variáveis de ambiente não podem quebrar a criação do administrador.
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase(), pw = (process.env.ADMIN_PASSWORD || '').trim();
    if (email && pw) {
      const u = await c.query('SELECT id FROM users WHERE lower(email)=$1', [email]);
      if (!u.rowCount) await c.query('INSERT INTO users(email,password_hash,role) VALUES($1,$2,$3) ON CONFLICT (email) DO NOTHING', [email, bcrypt.hashSync(pw, 12), 'SUPER_ADMIN']);
      else if (process.env.ADMIN_RESET_PASSWORD === '1') await c.query('UPDATE users SET password_hash=$1 WHERE id=$2', [bcrypt.hashSync(pw, 12), u.rows[0].id]); // use uma vez e remova a variável
    }
    await c.query('COMMIT');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch { /* conexão já encerrada */ }
    throw e;
  } finally {
    c.release();
  }
}
// Erros típicos de corrida entre instâncias no primeiro acesso: tenta de novo antes de falhar.
const RETRY = new Set(['23505', '42P07', '40P01', '40001', '55P03']);
let started;
const ready = () => started || (started = (async () => {
  for (let i = 1; ; i++) {
    try { return await init(); }
    catch (e) {
      if (i >= 4 || !RETRY.has(e.code)) { started = null; throw e; }
      console.error(`[migração] tentativa ${i} falhou (${e.code}: ${e.message}); repetindo`);
      await new Promise(r => setTimeout(r, 400 * i));
    }
  }
})());

module.exports = { query, rows, one, ready };
