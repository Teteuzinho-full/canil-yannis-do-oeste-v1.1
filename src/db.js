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
], [
  'ALTER TABLE dogs ADD COLUMN IF NOT EXISTS details TEXT',
  'ALTER TABLE dogs ADD COLUMN IF NOT EXISTS video TEXT',
  'ALTER TABLE dogs ADD COLUMN IF NOT EXISTS video_poster TEXT',
  'ALTER TABLE dogs ADD COLUMN IF NOT EXISTS pedigree_image TEXT',
  async c => {
    const { SAVANA: s } = require('./seed-content');
    await c.query(`INSERT INTO dogs(name,sex,birth_date,pedigree,description,photo,details,video,video_poster,pedigree_image,published)
      SELECT $1::text,$2::text,$3::text,$4::text,$5::text,$6::text,$7::text,$8::text,$9::text,$10::text,1
      WHERE NOT EXISTS (SELECT 1 FROM dogs WHERE lower(name)='savana')`,
      [s.name, s.sex, s.birth_date, s.pedigree, s.description, s.photo, s.details, s.video, s.video_poster, s.pedigree_image]);
  },
], [
  'ALTER TABLE site_content ADD COLUMN IF NOT EXISTS summary TEXT',
  'ALTER TABLE site_content ADD COLUMN IF NOT EXISTS details TEXT',
  async c => {
    const { TOPIC_TEXT, NEW_ROWS } = require('./seed-topics');
    for (const r of NEW_ROWS) await c.query('INSERT INTO site_content(slug,sort,title,subtitle,body,summary,details) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING', [r.slug, r.sort, r.title, r.subtitle, null, r.summary, r.details]);
    for (const [slug, t] of Object.entries(TOPIC_TEXT))
      await c.query('UPDATE site_content SET summary=COALESCE(summary,$2::text), details=COALESCE(details,$3::text), subtitle=COALESCE(subtitle,$4::text) WHERE slug=$1', [slug, t.summary ?? null, t.details ?? null, t.subtitle ?? null]);
  },
], [
  `CREATE TABLE site_settings(key TEXT PRIMARY KEY, grp TEXT NOT NULL, label TEXT NOT NULL, value TEXT, multiline SMALLINT NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE faq(id SERIAL PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0, published SMALLINT NOT NULL DEFAULT 1, created_at ${TS}, updated_at ${TS})`,
  `CREATE TABLE partners(id SERIAL PRIMARY KEY, name TEXT NOT NULL, subtitle TEXT, image TEXT, wide SMALLINT NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0, published SMALLINT NOT NULL DEFAULT 1, created_at ${TS}, updated_at ${TS})`,
  `CREATE TABLE hits(day DATE NOT NULL DEFAULT current_date, kind TEXT NOT NULL, path TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day, kind, path))`,
  'ALTER TABLE site_content ADD COLUMN IF NOT EXISTS custom SMALLINT NOT NULL DEFAULT 0',
  async c => {
    const { SETTINGS, FAQ, PARTNERS, PRIVACY } = require('./seed-site');
    let n = 0;
    for (const s of SETTINGS) await c.query('INSERT INTO site_settings(key,grp,label,value,multiline,sort) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (key) DO NOTHING', [s.key, s.grp, s.label, s.value, s.multiline, (n += 10)]);
    n = 0; for (const [q, a] of FAQ) await c.query('INSERT INTO faq(question,answer,sort) VALUES($1,$2,$3)', [q, a, (n += 10)]);
    n = 0; for (const [nm, sub, img, w] of PARTNERS) await c.query('INSERT INTO partners(name,subtitle,image,wide,sort) VALUES($1,$2,$3,$4,$5)', [nm, sub, img, w, (n += 10)]);
    await c.query(`INSERT INTO site_content(slug,sort,title,subtitle,body,details,published) VALUES('privacidade',900,$1,$2,$3,$3,1) ON CONFLICT (slug) DO NOTHING`, [PRIVACY.title, PRIVACY.subtitle, PRIVACY.details]);
  },
], [
  async c => { // imagens e vídeos enviados pelo canil (tudo editável no painel)
    const A = '/assets/';
    // Rottweilers do plantel (o mais novo primeiro, para aparecer por último na lista)
    const dogs = [
      ['Vulkan', 'MACHO', '2026-08-20', 'Von Franco\'s Brasil Vulkan', A + 'videos/vulkan-poster.webp', A + 'videos/vulkan.mp4', A + 'videos/vulkan-poster.webp', A + 'dogs/vulkan-pedigree.webp'],
      ['Zaira', 'FEMEA', null, null, A + 'dogs/zaira.webp', null, null, A + 'dogs/zaira-pedigree.webp'],
      ['Mona', 'FEMEA', null, 'Linhagem Timit-Tor', A + 'dogs/mona.webp', null, null, A + 'dogs/mona-pedigree.webp'],
      ['Ducatti', 'FEMEA', null, null, A + 'dogs/ducatti.webp', null, null, A + 'dogs/ducatti-pedigree.webp'],
      ['Zeus', 'MACHO', null, null, A + 'dogs/zeus.webp', null, null, A + 'dogs/zeus-pedigree.webp'],
    ];
    for (const d of dogs) await c.query(`INSERT INTO dogs(name,sex,birth_date,description,photo,video,video_poster,pedigree_image,published)
      SELECT $1::text,$2::text,$3::text,$4::text,$5::text,$6::text,$7::text,$8::text,1 WHERE NOT EXISTS (SELECT 1 FROM dogs WHERE lower(name)=lower($1::text))`, d);
    // Galeria
    const gal = [];
    for (const i of [3, 4, 5, 6, 7, 9]) gal.push(['Filhote de Rottweiler', 'FILHOTES', A + `gallery/filhote-${i}.webp`]);
    gal.push(
      ['Acasalamento Moby Dick x Mona Timit-Tor', 'NINHADAS', A + 'gallery/galeria-1.webp'],
      ['Rottweilers do plantel', 'ROTTWEILERS', A + 'gallery/galeria-2.webp'], ['Rottweilers do plantel', 'ROTTWEILERS', A + 'gallery/galeria-3.webp'],
      ['Rottweiler adulto', 'ROTTWEILERS', A + 'gallery/galeria-4.webp'], ['Rottweiler adulto', 'ROTTWEILERS', A + 'gallery/galeria-5.webp'],
      ['Filhote de Rottweiler', 'FILHOTES', A + 'gallery/galeria-6.webp']);
    for (const g of gal) await c.query(`INSERT INTO gallery(caption,category,photo,published) SELECT $1::text,$2::text,$3::text,1 WHERE NOT EXISTS (SELECT 1 FROM gallery WHERE photo=$3::text)`, g);
    // Certificado Timit-Tor da Mona na página da linhagem
    await c.query(`INSERT INTO content_images(slug,url,alt,caption,position,sort,published)
      SELECT 'linhagem-timit-tor',$1::text,'Certificado de origem Timit-Tor da Mona','Mona Timit-Tor','top',50,1
      WHERE EXISTS (SELECT 1 FROM site_content WHERE slug='linhagem-timit-tor') AND NOT EXISTS (SELECT 1 FROM content_images WHERE url=$1::text)`, [A + 'content/mona-timit-tor-certificado.webp']);
    // Vídeo do início (antes mostrava "Em breve teremos um novo vídeo")
    await c.query(`UPDATE videos SET url=$1, poster=$2, published=1,
      title=COALESCE(NULLIF(title,''),'Conheça o Canil Yannis do Oeste'), description=COALESCE(description,'Um olhar mais próximo sobre o Canil Yannis do Oeste.'), updated_at=now()
      WHERE slot='canil' AND (url IS NULL OR url='')`, [A + 'videos/inicial.mp4', A + 'videos/inicial-poster.webp']);
  },
], [
  async c => { // ajustes: Vulkan no plantel, Mia → Ducatti, fotos dos sócios fora da galeria
    const A = '/assets/';
    await c.query(`UPDATE dogs SET description='Von Franco''s Brasil Vulkan' WHERE lower(name)='vulkan' AND description LIKE 'Filhote%'`);
    await c.query(`UPDATE dogs SET name='Ducatti', photo=$1, pedigree_image=$2 WHERE lower(name)='mia' AND photo=$3`, [A + 'dogs/ducatti.webp', A + 'dogs/ducatti-pedigree.webp', A + 'dogs/mia.webp']);
    await c.query(`UPDATE dogs SET name='Ducatti' WHERE lower(name)='mia'`);
    await c.query('DELETE FROM gallery WHERE photo = ANY($1)', [['gallery/filhote-1.webp', 'gallery/filhote-2.webp', 'gallery/zeus-1.webp'].map(f => A + f)]);
    for (const [slug, f, alt] of [['darlan', 'darlan', 'Darlan, sócio-proprietário do Canil Yannis do Oeste'], ['bruna', 'bruna', 'Bruna, sócia-proprietária e médica-veterinária do Canil Yannis do Oeste']])
      await c.query(`INSERT INTO content_images(slug,url,alt,position,sort,published)
        SELECT $1::text,$2::text,$3::text,'center',(SELECT COALESCE(MIN(sort),0)-10 FROM content_images WHERE slug=$1::text),1
        WHERE EXISTS (SELECT 1 FROM site_content WHERE slug=$1::text) AND NOT EXISTS (SELECT 1 FROM content_images WHERE url=$2::text)`, [slug, A + `content/${f}.webp`, alt]);
  },
], [
  async c => { // "Novos lares": vitrine de filhotes que já saíram do canil (substitui a lista de ninhadas)
    await c.query(`CREATE TABLE IF NOT EXISTS homes(id SERIAL PRIMARY KEY, photo TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0, published SMALLINT NOT NULL DEFAULT 1, created_at ${TS}, updated_at ${TS})`);
    // todas as fotos de filhotes da galeria vão para a nova seção
    await c.query(`INSERT INTO homes(photo,sort,published) SELECT photo,0,published FROM gallery WHERE category='FILHOTES' ORDER BY id`);
    await c.query(`DELETE FROM gallery WHERE category='FILHOTES'`);
    const { rows: [b] } = await c.query(`SELECT sort FROM site_settings WHERE key='litters_title'`);
    let n = b ? b.sort : 400;
    const NEW = [
      ['nav_homes', 'Nome no menu do site', 'Novos lares', 0],
      ['homes_title', 'Título da seção', 'Filhotes que já têm lar', 0],
      ['homes_lead', 'Frase abaixo do título', 'Filhotes que nasceram no Canil Yannis do Oeste e hoje vivem com suas famílias.', 1],
      ['homes_empty', 'Texto quando ainda não há fotos', 'As fotos dos filhotes que já foram para suas famílias aparecerão aqui.', 1],
      ['homes_cta_title', 'Chamada: título', 'Quer um Rottweiler do canil?', 0],
      ['homes_cta_text', 'Chamada: texto', 'Fale com a gente para saber sobre as próximas ninhadas.', 1],
      ['homes_cta_button', 'Chamada: texto do botão', 'Fale com a gente', 0],
      ['homes_cta_msg', 'Chamada: mensagem que abre no WhatsApp', 'Olá! Vi os filhotes que já têm lar no site e gostaria de saber sobre as próximas ninhadas.', 1],
    ];
    for (const [k, label, v, ml] of NEW) await c.query(`INSERT INTO site_settings(key,grp,label,value,multiline,sort) VALUES($1,'Novos lares',$2,$3,$4,$5) ON CONFLICT (key) DO NOTHING`, [k, label, v, ml, ++n]);
    await c.query(`DELETE FROM site_settings WHERE key = ANY($1)`, [['litters_title', 'litters_empty_title', 'litters_empty_text', 'litters_empty_cta']]);
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
