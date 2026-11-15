// Grava os quadros da entrada da página (CDP screencast) para revisão quadro a quadro do hero.
// Uso (na pasta do site, depois do build): node quadros.mjs <pasta-saida> [largura=1280] [caminho=/]
// Origem: site novo do IOG, 2026-11-14 — achou o hero mudando de altura na troca de fonte e a foto abrindo em retângulo.
// Depois: monte uma folha de contato e MEÇA (altura do hero e topo do título em todos os quadros), não só olhe.
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path'; import { homedir } from 'node:os'; import { createServer } from 'node:http';
const require = createRequire(import.meta.url);
const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
const [saida, w = '1280', caminho = '/'] = process.argv.slice(2);
mkdirSync(saida, { recursive: true });
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = createServer((req, res) => {
  let f = join('.', decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': tipos[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: +w, height: 700 } });
const cdp = await p.context().newCDPSession(p);
const quadros = [];
cdp.on('Page.screencastFrame', async (f) => { quadros.push(f); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
await p.goto(`http://127.0.0.1:${srv.address().port}${caminho}`);
await p.waitForTimeout(2600);
await cdp.send('Page.stopScreencast');
const t0 = quadros[0].metadata.timestamp;
for (const f of quadros) writeFileSync(join(saida, `q${w}-${String(Math.round((f.metadata.timestamp - t0) * 1000)).padStart(4, '0')}.png`), Buffer.from(f.data, 'base64'));
console.log(quadros.length, 'quadros em', saida);
await b.close(); srv.close();
