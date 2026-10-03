// Páginas públicas renderizadas no servidor (SEO: title, canonical, Open Graph, JSON-LD, breadcrumbs).
const db = require('./db');
const { BASE_URL: BASE } = require('./config');
const abs = u => (/^https?:/.test(u) ? u : BASE + u);
const WA = '5549999294208';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const SEX = { MACHO: 'Macho', FEMEA: 'Fêmea' };
const ST = { PROXIMA: ['PRÓXIMA', 's2'], DISPONIVEL: ['DISPONÍVEL', 's1'], RESERVADO: ['RESERVADO', 's2'], ENCERRADO: ['ENCERRADO', 's3'] };
const fmt = d => (d ? d.split('-').reverse().join('/') : '');
const get = id => (id ? db.one('SELECT * FROM dogs WHERE id=$1', [id]) : null);
const who = d => (d ? (d.published ? `<a class="ul" href="/rottweilers/${d.id}">${esc(d.name)}</a>` : esc(d.name)) : '<span class="mut">—</span>');
const img = (src, alt, cls = '') => (src ? `<img ${cls ? `class="${cls}" ` : ''}src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : '');

const CSS = `.pg{padding:calc(68px + 40px) 0 120px}.crumb{font-size:.82rem;color:var(--mut);margin-bottom:28px}.crumb a:hover{color:var(--gold)}
.hero2{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(28px,6vw,80px);align-items:start}.hero2>div:first-child img,.hero2>div:first-child .ph{width:100%;aspect-ratio:4/5;object-fit:cover;border:1px solid var(--line)}
.big{font-size:clamp(3.2rem,9vw,7rem);line-height:.95;margin-bottom:24px}.facts{display:grid;grid-template-columns:auto 1fr;gap:10px 28px;margin:0 0 28px}.facts dt{color:var(--mut)}.facts dd{margin:0}
.ped{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ped>div{border:1px solid var(--line);background:var(--k2);padding:18px;display:grid;gap:4px}.ped small,.mut{color:var(--mut)}.ped b{font:500 1.5rem var(--serif)}
.cta-fix{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:45;box-shadow:0 12px 40px rgba(0,0,0,.6)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:20px}.sec{margin-top:56px}.sec h2{font-size:2.2rem;margin-bottom:22px}
a.dc,a.card{display:flex}a.card{flex-direction:column}a.dc .mut{position:absolute;top:20px;left:24px}
@media(max-width:900px){.hero2{grid-template-columns:1fr}.ped{grid-template-columns:1fr}.cta-fix{width:calc(100% - 28px);justify-content:center}}`;

function layout({ title, desc, path, image, crumbs, body, cta }) {
  const url = BASE + path;
  const bc = { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: BASE + c[1] })) };
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Yannis do Oeste Rottweilers">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">${image ? `<meta property="og:image" content="${esc(abs(image))}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<meta name="theme-color" content="#0A0A0A"><link rel="icon" href="/assets/img/favicon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css"><style>${CSS}</style><script type="application/ld+json">${JSON.stringify(bc).replace(/</g, '\\u003c')}</script></head><body>
<header class="s"><div class="wrap nav"><a class="brand" href="/"><img src="/assets/img/logo.webp" alt="Emblema Yannis do Oeste" width="44" height="44"><span>Yannis do Oeste</span></a>
<nav aria-label="Principal"><ul><li><a class="ul" href="/rottweilers">Rottweilers</a></li><li><a class="ul" href="/filhotes">Filhotes</a></li><li><a class="ul" href="/#contato">Contato</a></li></ul></nav></div></header>
<main class="pg"><div class="wrap"><nav class="crumb" aria-label="Você está em">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a> › ` : `<span aria-current="page">${esc(c[0])}</span>`).join('')}</nav>${body}</div></main>
${cta ? `<a class="btn fill cta-fix" href="${esc(cta[1])}" target="_blank" rel="noopener">${esc(cta[0])} <i>→</i></a>` : ''}
<footer><div class="wrap"><div><p>Yannis do Oeste Rottweilers<br>Concórdia — SC</p></div><ul><li><a class="ul" href="/rottweilers">Rottweilers</a></li><li><a class="ul" href="/filhotes">Filhotes</a></li></ul><ul><li><a class="ul" href="https://instagram.com/yannisdooeste" target="_blank" rel="noopener">Instagram</a></li><li>© 2026 Yannis do Oeste</li></ul></div></footer></body></html>`;
}

const dogCard = d => `<a class="dc" href="/rottweilers/${d.id}">${img(d.photo, 'Rottweiler ' + d.name)}${d.photo ? '' : '<span class="mut">Foto a cadastrar</span>'}<div class="in"><h3>${esc(d.name)}</h3><p>${esc([SEX[d.sex], d.pedigree].filter(Boolean).join(' · '))}</p></div></a>`;
const parents = l => [l.sire_name, l.dam_name].filter(Boolean).map(esc).join(' × ');
const litterCard = l => { const s = ST[l.status] || ST.PROXIMA;
  return `<a class="card" href="/ninhadas/${l.id}">${img(l.photo, 'Ninhada ' + l.name, 'cp')}<div class="b"><h3>${esc(l.name)}</h3><span>${[parents(l), esc(fmt(l.birth_date))].filter(Boolean).join(' · ')}</span><span><span class="status ${s[1]}">${s[0]}</span></span></div></a>`; };
const LQ = `SELECT l.*,s.name AS sire_name,d.name AS dam_name FROM litters l LEFT JOIN dogs s ON s.id=l.sire_id LEFT JOIN dogs d ON d.id=l.dam_id`;

async function pedigree(d) {
  const [s, m] = await Promise.all([get(d.sire_id), get(d.dam_id)]);
  if (!s && !m) return '<p>Pedigree ainda não cadastrado.</p>';
  const [a, b, c, e] = await Promise.all([get(s?.sire_id), get(s?.dam_id), get(m?.sire_id), get(m?.dam_id)]);
  const col = (label, p, x, y) => `<div><small>${label}</small><b>${who(p)}</b><small>Pais</small><span>${who(x)} × ${who(y)}</span></div>`;
  return `<div class="ped">${col('Pai', s, a, b)}${col('Mãe', m, c, e)}</div>`;
}

exports.dog = async id => {
  const d = await db.one('SELECT * FROM dogs WHERE id=$1 AND published=1', [id]);
  if (!d) return null;
  const ped = await pedigree(d);
  const rows = [['Sexo', SEX[d.sex]], ['Nascimento', fmt(d.birth_date)], ['Pedigree', d.pedigree]].filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join('');
  return layout({ title: `${d.name} — Rottweiler | Canil Yannis do Oeste`, path: `/rottweilers/${d.id}`, image: d.photo,
    desc: (d.description || `Rottweiler ${d.name} do Canil Yannis do Oeste, Concórdia — SC.`).slice(0, 155),
    crumbs: [['Início', '/'], ['Rottweilers', '/rottweilers'], [d.name, `/rottweilers/${d.id}`]],
    cta: ['Tenho interesse neste cão', wa(`Olá! Tenho interesse no Rottweiler ${d.name}. Gostaria de receber mais informações.`)],
    body: `<div class="hero2"><div>${d.photo ? `<img src="${esc(d.photo)}" alt="Rottweiler ${esc(d.name)}" width="800" height="1000" fetchpriority="high">` : '<div class="ph"><div><b>Foto a cadastrar</b></div></div>'}</div>
<div><h1 class="big">${esc(d.name)}</h1>${rows ? `<dl class="facts">${rows}</dl>` : ''}${d.description ? `<p>${esc(d.description)}</p>` : ''}
<h2 style="font-size:2rem;margin:36px 0 16px">Pedigree</h2>${ped}${d.titles ? `<h2 style="font-size:2rem;margin:36px 0 16px">Títulos</h2><p>${esc(d.titles)}</p>` : ''}</div></div>` });
};

exports.dogs = async sexo => {
  const f = { macho: 'MACHO', femea: 'FEMEA' }[sexo];
  const rows = await db.rows(`SELECT * FROM dogs WHERE published=1 ${f ? 'AND sex=$1' : ''} ORDER BY id DESC`, f ? [f] : []);
  const chip = (k, t) => `<a class="chip" href="/rottweilers${k ? '?sexo=' + k : ''}" aria-pressed="${(sexo || '') === k}">${t}</a>`;
  return layout({ title: 'Nossos Rottweilers | Canil Yannis do Oeste', path: '/rottweilers', desc: 'Conheça os Rottweilers do Canil Yannis do Oeste, em Concórdia — SC.',
    crumbs: [['Início', '/'], ['Rottweilers', '/rottweilers']], cta: ['Falar com o canil', wa('Olá! Conheci o Canil Yannis do Oeste pelo site e gostaria de saber mais sobre os filhotes disponíveis.')],
    body: `<h1 class="big" style="font-size:clamp(2.8rem,7vw,5rem)">Nossos Rottweilers</h1><div class="filters" style="display:flex;gap:8px;flex-wrap:wrap;margin:24px 0 32px">${chip('', 'Todos')}${chip('macho', 'Machos')}${chip('femea', 'Fêmeas')}</div>
${rows.length ? `<div class="grid">${rows.map(dogCard).join('')}</div>` : '<p>Nenhum Rottweiler publicado nesta categoria ainda.</p>'}` });
};

exports.litters = async () => {
  const all = await db.rows(`${LQ} WHERE l.published=1 ORDER BY l.id DESC`);
  const sec = (t, st) => { const r = all.filter(l => st.includes(l.status)); return `<section class="sec"><h2>${t}</h2>${r.length ? `<div class="grid">${r.map(litterCard).join('')}</div>` : '<p>Nenhuma ninhada nesta categoria.</p>'}</section>`; };
  return layout({ title: 'Filhotes de Rottweiler | Canil Yannis do Oeste', path: '/filhotes', desc: 'Ninhadas disponíveis, próximas e encerradas do Canil Yannis do Oeste, em Concórdia — SC.',
    crumbs: [['Início', '/'], ['Filhotes', '/filhotes']], cta: ['Perguntar sobre filhotes', wa('Olá! Gostaria de saber mais sobre os filhotes disponíveis.')],
    body: `<h1 class="big" style="font-size:clamp(2.8rem,7vw,5rem)">Uma nova geração está chegando.</h1>${sec('Disponíveis', ['DISPONIVEL', 'RESERVADO'])}${sec('Próximas ninhadas', ['PROXIMA'])}${sec('Encerradas', ['ENCERRADO'])}` });
};

exports.litter = async id => {
  const l = await db.one(`${LQ} WHERE l.id=$1 AND l.published=1`, [id]);
  if (!l) return null;
  const [sire, dam] = await Promise.all([get(l.sire_id), get(l.dam_id)]);
  const s = ST[l.status] || ST.PROXIMA, link = (n, p) => (n ? (p?.published ? `<a class="ul" href="/rottweilers/${p.id}">${esc(n)}</a>` : esc(n)) : '');
  const rows = [['Pai', link(l.sire_name, sire)], ['Mãe', link(l.dam_name, dam)], ['Nascimento', esc(fmt(l.birth_date))]].filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
  return layout({ title: `Ninhada ${l.name} | Canil Yannis do Oeste`, path: `/ninhadas/${l.id}`, image: l.photo,
    desc: (l.notes || `Ninhada ${l.name} do Canil Yannis do Oeste, Concórdia — SC.`).slice(0, 155),
    crumbs: [['Início', '/'], ['Filhotes', '/filhotes'], [l.name, `/ninhadas/${l.id}`]], cta: ['Quero saber sobre esta ninhada', wa(`Olá! Gostaria de saber mais sobre a ninhada ${l.name}.`)],
    body: `<div class="hero2"><div>${l.photo ? `<img src="${esc(l.photo)}" alt="Ninhada ${esc(l.name)}" width="800" height="1000" fetchpriority="high">` : '<div class="ph"><div><b>Foto a cadastrar</b></div></div>'}</div>
<div><h1 class="big">${esc(l.name)}</h1><p style="margin-bottom:20px"><span class="status ${s[1]}">${s[0]}</span></p>${rows ? `<dl class="facts">${rows}</dl>` : ''}${l.notes ? `<p>${esc(l.notes)}</p>` : ''}</div></div>` });
};

exports.urls = async () => ['/', '/rottweilers', '/filhotes',
  ...(await db.rows('SELECT id FROM dogs WHERE published=1')).map(r => `/rottweilers/${r.id}`),
  ...(await db.rows('SELECT id FROM litters WHERE published=1')).map(r => `/ninhadas/${r.id}`)];
