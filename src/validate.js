const PHOTO_RE = /^(\/(uploads|assets)\/[\w.\/-]+|https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/[\w.\/%-]+)$/;
const COMMON = ['name', 'sex', 'birth_date', 'pedigree', 'titles', 'description', 'details', 'photo', 'video', 'video_poster', 'pedigree_image', 'sire_id', 'dam_id', 'published'];
const VIDEO_RE = /^(\/(uploads|assets)\/[\w.\/-]+|https:\/\/[^\s"'<>]+)$/;
const IMG_FIELDS = ['photo', 'video_poster', 'pedigree_image'];
const MAXLEN = { description: 2000, notes: 2000, text: 2000, titles: 2000, details: 6000, video: 600 };
const TABLES = {
  dogs: COMMON,
  litters: ['name', 'birth_date', 'status', 'sire_id', 'dam_id', 'notes', 'photo', 'published'],
  gallery: ['caption', 'category', 'photo', 'published'],
  testimonials: ['name', 'text', 'dog_name', 'photo', 'published'],
};
const REQUIRED = { dogs: ['name'], litters: ['name'], gallery: ['caption', 'photo'], testimonials: ['name', 'text'] };
const ENUMS = {
  sex: ['MACHO', 'FEMEA'], status: ['PROXIMA', 'DISPONIVEL', 'RESERVADO', 'ENCERRADO'],
  category: ['ROTTWEILERS', 'FILHOTES', 'NINHADAS', 'EXPOSICOES', 'CANIL', 'ALIMENTACAO', 'VACINACAO', 'SAUDE', 'VETERINARIO', 'PEDIGREE', 'MICROCHIPAGEM', 'PESSOAS'],
};
const LONG = ['description', 'notes', 'text', 'titles'];
const LABEL = { name: 'Nome', sex: 'Sexo', status: 'Status', birth_date: 'Data de nascimento', photo: 'Foto', sire_id: 'Pai', dam_id: 'Mãe',
  caption: 'Legenda', category: 'Categoria', text: 'Depoimento', dog_name: 'Cão adquirido', titles: 'Títulos', pedigree: 'Pedigree',
  description: 'Descrição', notes: 'Informações', details: 'Detalhes', video: 'Vídeo', video_poster: 'Miniatura do vídeo', pedigree_image: 'Imagem do pedigree' };
const DEFAULT = { status: 'PROXIMA', category: 'CANIL' };

function clean(table, body, isCreate) {
  const out = {}, errors = [];
  for (const c of TABLES[table]) {
    if (!(c in body)) continue;
    let v = body[c];
    const l = LABEL[c] || c;
    if (c === 'published') v = v ? 1 : 0;
    else if (c === 'sire_id' || c === 'dam_id') {
      v = v === '' || v == null ? null : Number(v);
      if (v !== null && !Number.isInteger(v)) errors.push(`${l}: escolha um cão da lista.`);
    } else {
      v = v == null ? '' : String(v).trim();
      if (v.length > (MAXLEN[c] || 200)) errors.push(`${l}: texto longo demais.`);
      if (ENUMS[c] && v && !ENUMS[c].includes(v)) errors.push(`${l}: valor inválido.`);
      if (IMG_FIELDS.includes(c) && v && (v.includes('..') || !PHOTO_RE.test(v))) errors.push(`${l}: use o botão de envio de imagem.`);
      if (c === 'video' && v && (v.includes('..') || !VIDEO_RE.test(v))) errors.push('Vídeo: use um link https:// ou envie o arquivo.');
      if (c === 'birth_date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errors.push('Data de nascimento: use o formato AAAA-MM-DD.');
      if (v === '' && DEFAULT[c]) v = DEFAULT[c];
      else if (v === '' && ['sex', 'birth_date', 'photo', 'video', 'video_poster', 'pedigree_image', 'details'].includes(c) && !REQUIRED[table].includes(c)) v = null;
    }
    out[c] = v;
  }
  for (const c of REQUIRED[table]) if ((isCreate || c in out) && !out[c]) errors.push(`${LABEL[c]}: preencha este campo.`);
  return { out, errors };
}
module.exports = { TABLES, clean, PHOTO_RE };
