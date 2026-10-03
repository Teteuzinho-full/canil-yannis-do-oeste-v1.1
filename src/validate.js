const COMMON = ['name', 'sex', 'birth_date', 'pedigree', 'titles', 'description', 'photo', 'sire_id', 'dam_id', 'published'];
const TABLES = {
  dogs: COMMON,
  litters: ['name', 'birth_date', 'status', 'sire_id', 'dam_id', 'notes', 'photo', 'published'],
  gallery: ['caption', 'category', 'photo', 'published'],
  testimonials: ['name', 'text', 'dog_name', 'photo', 'published'],
};
const REQUIRED = { dogs: ['name'], litters: ['name'], gallery: ['caption', 'photo'], testimonials: ['name', 'text'] };
const ENUMS = {
  sex: ['MACHO', 'FEMEA'], status: ['PROXIMA', 'DISPONIVEL', 'RESERVADO', 'ENCERRADO'],
  category: ['ROTTWEILERS', 'FILHOTES', 'NINHADAS', 'EXPOSICOES', 'CANIL'],
};
const LONG = ['description', 'notes', 'text', 'titles'];
const LABEL = { name: 'Nome', sex: 'Sexo', status: 'Status', birth_date: 'Data de nascimento', photo: 'Foto', sire_id: 'Pai', dam_id: 'Mãe',
  caption: 'Legenda', category: 'Categoria', text: 'Depoimento', dog_name: 'Cão adquirido', titles: 'Títulos', pedigree: 'Pedigree',
  description: 'Descrição', notes: 'Informações' };
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
      if (v.length > (LONG.includes(c) ? 2000 : 200)) errors.push(`${l}: texto longo demais.`);
      if (ENUMS[c] && v && !ENUMS[c].includes(v)) errors.push(`${l}: valor inválido.`);
      if (c === 'photo' && v && !/^(\/uploads\/[\w.-]+|https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/[\w.\/%-]+)$/.test(v)) errors.push('Foto: use o botão de envio de imagem.');
      if (c === 'birth_date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errors.push('Data de nascimento: use o formato AAAA-MM-DD.');
      if (v === '' && DEFAULT[c]) v = DEFAULT[c];
      else if (v === '' && ['sex', 'birth_date', 'photo'].includes(c) && !REQUIRED[table].includes(c)) v = null;
    }
    out[c] = v;
  }
  for (const c of REQUIRED[table]) if ((isCreate || c in out) && !out[c]) errors.push(`${LABEL[c]}: preencha este campo.`);
  return { out, errors };
}
module.exports = { TABLES, clean };
