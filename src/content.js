// Conteúdo institucional e vídeos: rotas públicas e administrativas.
const express = require('express');
const db = require('./db');
const { PHOTO_RE } = require('./validate');

const POS_RE = /^(center|top|bottom|left|right|\d{1,3}% \d{1,3}%)$/;
const VIDEO_RE = /^(\/(uploads|assets)\/[\w.\/-]+|https:\/\/[^\s"'<>]+)$/;

module.exports = ({ HttpError, log }) => {
  const pub = express.Router(), adm = express.Router();

  const str = (v, max, label, { required = false } = {}) => {
    const s = v == null ? '' : String(v).trim();
    if (required && !s) throw new HttpError(422, `${label}: preencha este campo.`);
    if (s.length > max) throw new HttpError(422, `${label}: texto longo demais (máx. ${max} caracteres).`);
    return s || null;
  };
  const img = (v, label) => {
    const s = str(v, 400, label);
    if (s && (s.includes('..') || !PHOTO_RE.test(s))) throw new HttpError(422, `${label}: use o botão de envio de imagem.`);
    return s;
  };
  const section = async slug => { const s = await db.one('SELECT * FROM site_content WHERE slug=$1', [slug]); if (!s) throw new HttpError(404, 'Seção não encontrada.'); return s; };
  const imgId = req => { const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Imagem não encontrada.'); return id; };

  // ---- público (somente publicados)
  pub.get('/content', async (req, res) => {
    const [s, i, v] = await Promise.all([
      db.rows('SELECT slug,title,subtitle,body,extra FROM site_content WHERE published=1 ORDER BY sort'),
      db.rows('SELECT id,slug,url,alt,caption,position FROM content_images WHERE published=1 ORDER BY sort,id'),
      db.rows('SELECT slot,title,description,url,poster FROM videos WHERE published=1 AND url IS NOT NULL')]);
    const by = {}; i.forEach(x => (by[x.slug] = by[x.slug] || []).push(x));
    res.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.json({ sections: s.map(x => ({ ...x, images: by[x.slug] || [] })), videos: Object.fromEntries(v.map(x => [x.slot, x])) });
  });

  // ---- admin: conteúdo
  adm.get('/content', async (req, res) => {
    const [s, i] = await Promise.all([db.rows('SELECT * FROM site_content ORDER BY sort'), db.rows('SELECT * FROM content_images ORDER BY sort,id')]);
    res.json(s.map(x => ({ ...x, images: i.filter(y => y.slug === x.slug) })));
  });
  adm.put('/content/:slug', async (req, res) => {
    const cur = await section(req.params.slug), b = req.body, o = {};
    if ('title' in b) o.title = str(b.title, 200, 'Título', { required: true });
    if ('subtitle' in b) o.subtitle = str(b.subtitle, 300, 'Subtítulo');
    if ('body' in b) o.body = str(b.body, 6000, 'Texto');
    if ('extra' in b) o.extra = str(b.extra, 300, 'Título do bloco extra');
    if ('published' in b) o.published = b.published ? 1 : 0;
    const cols = Object.keys(o);
    if (!cols.length) throw new HttpError(422, 'Nenhum campo para atualizar.');
    const r = await db.one(`UPDATE site_content SET ${cols.map((c, i) => `${c}=$${i + 1}`)}, updated_at=now() WHERE slug=$${cols.length + 1} RETURNING *`, [...Object.values(o), cur.slug]);
    await log(req, 'editar', 'site_content'); res.json(r);
  });
  adm.post('/content/:slug/images', async (req, res) => {
    const s = await section(req.params.slug), b = req.body;
    const url = img(b.url, 'Imagem'); if (!url) throw new HttpError(422, 'Imagem: envie um arquivo primeiro.');
    const pos = b.position ? String(b.position) : 'center'; if (!POS_RE.test(pos)) throw new HttpError(422, 'Enquadramento inválido.');
    const r = await db.one(`INSERT INTO content_images(slug,url,alt,caption,position,sort) VALUES($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(sort),0)+10 FROM content_images WHERE slug=$1)) RETURNING *`,
      [s.slug, url, str(b.alt, 300, 'Texto alternativo'), str(b.caption, 300, 'Legenda'), pos]);
    await log(req, 'criar', 'content_images', r.id); res.status(201).json(r);
  });
  adm.put('/content/images/:id', async (req, res) => {
    const id = imgId(req), b = req.body, o = {};
    if ('alt' in b) o.alt = str(b.alt, 300, 'Texto alternativo');
    if ('caption' in b) o.caption = str(b.caption, 300, 'Legenda');
    if ('published' in b) o.published = b.published ? 1 : 0;
    if ('position' in b) { if (!POS_RE.test(String(b.position))) throw new HttpError(422, 'Enquadramento inválido.'); o.position = String(b.position); }
    const cols = Object.keys(o);
    if (!cols.length) throw new HttpError(422, 'Nenhum campo para atualizar.');
    const r = await db.one(`UPDATE content_images SET ${cols.map((c, i) => `${c}=$${i + 1}`)} WHERE id=$${cols.length + 1} RETURNING *`, [...Object.values(o), id]);
    if (!r) throw new HttpError(404, 'Imagem não encontrada.');
    await log(req, 'editar', 'content_images', id); res.json(r);
  });
  adm.post('/content/images/:id/move', async (req, res) => {
    const id = imgId(req), dir = req.body.dir === 'up' ? -1 : req.body.dir === 'down' ? 1 : 0;
    if (!dir) throw new HttpError(422, 'Direção inválida.');
    const cur = await db.one('SELECT * FROM content_images WHERE id=$1', [id]);
    if (!cur) throw new HttpError(404, 'Imagem não encontrada.');
    const list = await db.rows('SELECT id FROM content_images WHERE slug=$1 ORDER BY sort,id', [cur.slug]);
    const i = list.findIndex(x => x.id === id), j = i + dir;
    if (j >= 0 && j < list.length) { [list[i], list[j]] = [list[j], list[i]]; for (let k = 0; k < list.length; k++) await db.query('UPDATE content_images SET sort=$1 WHERE id=$2', [(k + 1) * 10, list[k].id]); }
    await log(req, 'reordenar', 'content_images', id); res.json({ ok: true });
  });
  adm.delete('/content/images/:id', async (req, res) => {
    const id = imgId(req), r = await db.query('DELETE FROM content_images WHERE id=$1', [id]);
    if (!r.rowCount) throw new HttpError(404, 'Imagem não encontrada.');
    await log(req, 'excluir', 'content_images', id); res.status(204).end();
  });

  // ---- admin: vídeos (dois espaços fixos)
  adm.get('/videos', async (req, res) => res.json(await db.rows('SELECT * FROM videos ORDER BY slot')));
  adm.put('/videos/:slot', async (req, res) => {
    if (!['canil', 'filhotes'].includes(req.params.slot)) throw new HttpError(404, 'Vídeo não encontrado.');
    const b = req.body, o = {};
    if ('title' in b) o.title = str(b.title, 200, 'Título');
    if ('description' in b) o.description = str(b.description, 600, 'Descrição');
    if ('url' in b) { o.url = str(b.url, 600, 'URL do vídeo'); if (o.url && (o.url.includes('..') || !VIDEO_RE.test(o.url))) throw new HttpError(422, 'URL do vídeo: use um link https:// ou envie o arquivo.'); }
    if ('poster' in b) o.poster = img(b.poster, 'Miniatura');
    if ('published' in b) o.published = b.published ? 1 : 0;
    if (o.published && (o.url === null || (!('url' in b) && !(await db.one('SELECT url FROM videos WHERE slot=$1', [req.params.slot]))?.url)))
      throw new HttpError(422, 'Para publicar, informe a URL ou envie o arquivo do vídeo.');
    const cols = Object.keys(o);
    if (!cols.length) throw new HttpError(422, 'Nenhum campo para atualizar.');
    const r = await db.one(`UPDATE videos SET ${cols.map((c, i) => `${c}=$${i + 1}`)}, updated_at=now() WHERE slot=$${cols.length + 1} RETURNING *`, [...Object.values(o), req.params.slot]);
    await log(req, 'editar', 'videos'); res.json(r);
  });
  return { pub, adm };
};
