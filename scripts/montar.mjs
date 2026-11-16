// Monta o site: partes/layout.html + cada paginas/*.html → arquivo pronto na raiz (index.html, servicos/index.html, …),
// que é o que o GitHub Pages publica. Uso: node scripts/montar.mjs   (rode depois de mexer em paginas/, partes/, CSS ou JS)
// Cabeçalho de cada página: comentário no topo com "url:", "titulo:" e "descricao:"; opcionais "arquivo:" (ex. 404.html)
// e "robots:" (ex. noindex). Também gera sitemap.xml com as páginas indexáveis.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

// o menu mora só aqui
const MENU = [['/', 'Início'], ['/servicos/', 'Serviços'], ['/produtos/', 'Produtos'], ['/sobre/', 'Sobre'], ['/contato/', 'Contato']];
const versao = (f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 8); // ?v= derruba o cache velho
const layout = readFileSync('partes/layout.html', 'utf8');
const urls = [];

for (const arq of readdirSync('paginas').filter((f) => f.endsWith('.html'))) {
  const fonte = readFileSync(join('paginas', arq), 'utf8');
  const cab = /^<!--([\s\S]*?)-->/.exec(fonte);
  if (!cab) throw new Error(`${arq}: falta o comentário de cabeçalho`);
  const meta = Object.fromEntries(cab[1].trim().split('\n').map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
  for (const k of ['url', 'titulo', 'descricao']) if (!meta[k]) throw new Error(`${arq}: falta "${k}:"`);
  const nav = MENU.map(([u, t]) => `      <a href="${u}"${u === meta.url ? ' aria-current="page"' : ''}>${t}</a>`).join('\n');
  const robots = meta.robots ? `<meta name="robots" content="${meta.robots}">\n` : '';
  const vals = { titulo: meta.titulo, descricao: meta.descricao, url: meta.url, nav, robots, v_css: versao('styles.css'), v_js: versao('main.js'), conteudo: fonte.slice(cab[0].length).trim() };
  // troca de uma vez só, para o conteúdo da página nunca ser lido como marcador
  const html = layout.replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in vals)) throw new Error(`${arq}: marcador desconhecido ${m}`); return vals[k]; });
  const destino = meta.arquivo ?? join('.', meta.url, 'index.html');
  if (!meta.arquivo) mkdirSync(join('.', meta.url), { recursive: true });
  if (!meta.robots) urls.push(meta.url);
  writeFileSync(destino, html);
  console.log(destino);
}

// sitemap: só páginas sem "robots:" (a 404 fica de fora)
const hoje = new Date().toISOString().slice(0, 10);
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.sort().map((u) => `  <url><loc>https://mect.com.br${u}</loc><lastmod>${hoje}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log('sitemap.xml', urls.length, 'páginas');

// página de links da bio (/links): dados/links.json → links/index.html, fora do sitemap (é noindex)
execFileSync(process.execPath, ['scripts/gerar-links.mjs', 'dados/links.json', 'links/index.html'], { stdio: 'inherit' });

// modelos de cardápio digital (/cardapio/<estilo>/, vitrine em paginas/cardapio.html): os exemplos da skill
// site-institucional, gerados pelo mesmo gerar-cardapio.mjs que vai para o cliente. Muda só o que é fictício e poderia
// cair em gente de verdade (WhatsApp, telefone, site) e o Google fica de fora.
const skill = join(homedir(), '.claude/skills/site-institucional');
const MODELOS = [['cafe', 'Café', 'exemplo.json'], ['vitrine', 'Vitrine', 'exemplo.json'], ['mesa', 'Mesa', 'exemplo-bar.json'],
  ['autoral', 'Autoral', 'exemplo-restaurante.json'], ['classico', 'Clássico', 'exemplo.json']];
const FAIXA_CSS = '.demo{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 14px;padding:8px 16px;background:#0b1033;color:#fff;font:600 13px/1.4 system-ui,sans-serif;text-align:center}.demo a{color:#9cc2ff}';
for (const [estilo, nome, arq] of MODELOS) {
  const { site, telefone, ...d } = JSON.parse(readFileSync(join(skill, 'modelos/cardapio', arq), 'utf8'));
  Object.assign(d, { estilo, robots: 'noindex', favicon: '/favicon.ico', whatsapp: '5562994050744',
    mensagem: `Olá! Vi o modelo ${nome} de cardápio digital no site MECT e quero um assim.`,
    titulo: `Modelo ${nome} · cardápio digital MECT`, credito: { texto: 'Desenvolvido por MECT', url: 'https://mect.com.br/cardapio/' } });
  const tmp = join(tmpdir(), `cardapio-${estilo}.json`), saida = join('cardapio', estilo, 'index.html');
  writeFileSync(tmp, JSON.stringify(d)); mkdirSync(dirname(saida), { recursive: true });
  execFileSync(process.execPath, [join(skill, 'scripts/gerar-cardapio.mjs'), tmp, saida], { stdio: 'inherit' });
  const html = readFileSync(saida, 'utf8');
  if (!html.includes('<body>')) throw new Error(`${saida}: sem <body> para a faixa de exemplo`);
  writeFileSync(saida, html.replace('</head>', `<style>${FAIXA_CSS}</style>\n</head>`).replace('<body>',
    `<body>\n<div class="demo"><span>Exemplo fictício · modelo ${nome}</span><a href="/cardapio/" target="_top">Ver os 5 modelos</a></div>`));
}
