// Testa a home num Chrome de verdade: erros de JS, arquivos que não carregam, âncoras, rolagem lateral, menu do celular
// e se os botões do hero recebem o clique. Uso: node scripts/testar-site.mjs   (sai com código 1 se algo falhar)
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path'; import { homedir } from 'node:os'; import { createServer } from 'node:http';
const require = createRequire(import.meta.url);
const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const srv = createServer((req, res) => {
  let f = join('.', decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': tipos[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0);
const url = `http://127.0.0.1:${srv.address().port}/`;
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const b = await chromium.launch({ channel: 'chrome' });
const PAGINAS = ['/', '/servicos/', '/produtos/', '/sobre/', '/contato/'];
for (const [tela, largura] of [['desktop', 1280], ['celular', 390]]) for (const caminho of PAGINAS) {
  const nome = `${tela} ${caminho}`;
  const p = await b.newPage({ viewport: { width: largura, height: 850 } });
  p.on('pageerror', (e) => falhas.push(`${nome}: erro de JS: ${e.message}`));
  p.on('response', (r) => r.status() >= 400 && r.url().startsWith(url) && falhas.push(`${nome}: ${r.status()} ${r.url()}`));
  // mede também durante as animações de entrada (a faixa do hero já criou rolagem só no primeiro meio segundo)
  await p.goto(url + caminho.slice(1), { waitUntil: 'commit' });
  await p.waitForFunction(() => document.body && getComputedStyle(document.body).margin === '0px'); // CSS aplicado (antes disso o navegador nem desenha)
  for (let t = 0; t < 12; t++) {
    const largo = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (largo) { falhas.push(`${nome}: rolagem lateral durante o carregamento (${t * 100} ms)`); break; }
    await p.waitForTimeout(100);
  }
  await p.waitForLoadState('networkidle');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${nome}: rolagem lateral`);
  const ancoras = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => !document.querySelector(h)));
  ok(!ancoras.length, `${nome}: âncoras sem destino: ${ancoras}`);
  ok((await p.getAttribute('#nav [aria-current="page"]', 'href')) === caminho, `${nome}: item do menu não marcado`);
  if (caminho === '/') for (const sel of ['.hero__bts .bt--azul', '.hero__bts .bt--linha']) {
    const recebe = await p.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); });
    ok(recebe, `${nome}: ${sel} não recebe o clique`);
  }
  // o último bloco revelável aparece depois de rolar até ele
  const ultimo = p.locator('.revela').last(); await ultimo.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  ok(await ultimo.evaluate((el) => getComputedStyle(el).opacity === '1'), `${nome}: conteúdo não aparece ao rolar`);
  if (tela === 'celular' && caminho === '/') {
    await p.evaluate(() => scrollTo(0, 0));
    ok(!(await p.isVisible('#nav')), 'celular: menu já aberto');
    await p.click('.menu-bt'); ok(await p.isVisible('#nav'), 'celular: menu não abre');
    ok((await p.getAttribute('.menu-bt', 'aria-expanded')) === 'true', 'celular: aria-expanded não muda');
    await p.keyboard.press('Escape'); ok(!(await p.isVisible('#nav')), 'celular: Esc não fecha o menu');
    await p.click('.menu-bt'); await p.click('#nav a[href="/contato/"]'); await p.waitForURL('**/contato/'); ok(!(await p.isVisible('#nav')), 'celular: clicar num link não fecha o menu');
  }
  await p.close();
}
// páginas fora do menu: só o básico
const OUTRAS = ['/links/', '/404.html', '/acessibilidade/', '/cardapio/', ...['cafe', 'vitrine', 'mesa', 'autoral', 'classico'].map((e) => `/cardapio/${e}/`)];
for (const [tela, largura] of [['desktop', 1280], ['celular', 390]]) for (const caminho of OUTRAS) {
  const nome = `${tela} ${caminho}`;
  const p = await b.newPage({ viewport: { width: largura, height: 850 } });
  p.on('pageerror', (e) => falhas.push(`${nome}: erro de JS: ${e.message}`));
  p.on('response', (r) => r.status() >= 400 && r.url().startsWith(url) && falhas.push(`${nome}: ${r.status()} ${r.url()}`));
  await p.goto(url + caminho.slice(1), { waitUntil: 'networkidle' });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${nome}: rolagem lateral`);
  await p.close();
}
// painel de acessibilidade (modelo da skill): ícone em toda página do menu e texto 150% sem rolagem lateral
for (const largura of [1280, 1001, 390]) for (const caminho of PAGINAS) {
  const nome = `texto 150% ${largura} ${caminho}`;
  const p = await b.newPage({ viewport: { width: largura, height: 850 } });
  p.on('pageerror', (e) => falhas.push(`${nome}: erro de JS: ${e.message}`));
  await p.addInitScript(() => localStorage.setItem('acessibilidade', '{"texto":3}'));
  await p.goto(url + caminho.slice(1), { waitUntil: 'networkidle' });
  ok(await p.locator('#a11y .abrir').isVisible(), `${nome}: sem ícone de acessibilidade`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${nome}: rolagem lateral`);
  await p.close();
}
await b.close(); srv.close();
console.log(falhas.length ? 'FALHAS:\n- ' + falhas.join('\n- ') : `tudo certo (${PAGINAS.length} páginas do menu + ${OUTRAS.length} outras, desktop e celular)`);
process.exit(falhas.length ? 1 : 0);
