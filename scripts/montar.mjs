// Monta o site: partes/layout.html + cada paginas/*.html → arquivo pronto na raiz (index.html, servicos/index.html, …),
// que é o que o GitHub Pages publica. Uso: node scripts/montar.mjs   (rode depois de mexer em paginas/, partes/, CSS ou JS)
// Cabeçalho de cada página: comentário no topo com "url:", "titulo:" e "descricao:"; opcionais "arquivo:" (ex. 404.html)
// e "robots:" (ex. noindex). Também gera sitemap.xml com as páginas indexáveis.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

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
