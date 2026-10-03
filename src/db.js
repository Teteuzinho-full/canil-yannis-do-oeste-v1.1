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
]];

async function init() {
  const c = await pool.connect();
  try {
    await c.query('SELECT pg_advisory_lock(727001)'); // evita corrida entre instâncias no cold start
    await c.query('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY)');
    const { rows: r } = await c.query('SELECT COALESCE(MAX(version),0)::int AS v FROM schema_migrations');
    for (let v = r[0].v; v < MIGRATIONS.length; v++) {
      await c.query('BEGIN');
      try { for (const s of MIGRATIONS[v]) await c.query(s); await c.query('INSERT INTO schema_migrations(version) VALUES($1)', [v + 1]); await c.query('COMMIT'); }
      catch (e) { await c.query('ROLLBACK'); throw e; }
    }
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      const { rowCount } = await c.query('SELECT 1 FROM users WHERE lower(email)=lower($1)', [ADMIN_EMAIL]);
      if (!rowCount) await c.query('INSERT INTO users(email,password_hash,role) VALUES($1,$2,$3)', [ADMIN_EMAIL.trim().toLowerCase(), bcrypt.hashSync(ADMIN_PASSWORD, 12), 'SUPER_ADMIN']);
    }
  } finally {
    try { await c.query('SELECT pg_advisory_unlock(727001)'); } catch { /* conexão já fechada */ }
    c.release();
  }
}
let started;
const ready = () => started || (started = init().catch(e => { started = null; throw e; }));

module.exports = { query, rows, one, ready };
