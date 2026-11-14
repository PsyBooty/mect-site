// Print de página inteira do site (raiz do repositório), servido num servidor local (os caminhos são absolutos).
// Uso: node scripts/print.mjs [largura] [saida.png] [caminho, ex. /corpo-clinico/]  (5º argumento "tela" = só a primeira tela)
// Origem: comparação com o mockup (2026-11-14); passou a servir dist/ quando as páginas internas chegaram.
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path'; import { homedir } from 'node:os'; import { createServer } from 'node:http';
const require = createRequire(import.meta.url);
const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const pw = readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync);
const { chromium } = require(pw);
const [w = '1280', out = 'print.png', caminho = '/'] = process.argv.slice(2);
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = createServer((req, res) => {
  let f = join('.', decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': tipos[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0);
const porta = srv.address().port;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: +w, height: 900 }, reducedMotion: 'reduce' }); // sem animação: o print sai com tudo visível
await p.goto(`http://127.0.0.1:${porta}${caminho}`, { waitUntil: 'networkidle' });
// rola até o fim para as imagens com loading="lazy" carregarem antes do print
for (let y = 0; y < await p.evaluate(() => document.body.scrollHeight); y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80); }
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: process.argv[5] !== 'tela' });
await b.close(); srv.close();
