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
  // barra fixa "WhatsApp | Ligar" só no celular, com o ícone do painel de acessibilidade acima dela (teste do iog-novo-site)
  ok((await p.isVisible('.barra-acao')) === (tela === 'celular'), `${nome}: barra WhatsApp | Ligar ${tela === 'celular' ? 'não aparece' : 'aparece no desktop'}`);
  if (tela === 'celular') ok(await p.evaluate(() => document.querySelector('#a11y .abrir, #a11y') && document.querySelector('#a11y').getBoundingClientRect().bottom <= document.querySelector('.barra-acao').getBoundingClientRect().top), `${nome}: ícone de acessibilidade acima da barra WhatsApp | Ligar`);
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
const OUTRAS = ['/links/', '/404.html', '/diagnostico/', '/acessibilidade/', '/cardapio/', ...['cafe', 'vitrine', 'mesa', 'autoral', 'classico'].map((e) => `/cardapio/${e}/`)];
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
// VLibras (vem da rede, do governo): o botão de Libras aparece e o "alto contraste" do painel não o apaga
{
  const p = await b.newPage({ viewport: { width: 1280, height: 850 } });
  await p.addInitScript(() => localStorage.setItem('acessibilidade', '{"contraste":true,"imagens":true}'));
  await p.goto(url, { waitUntil: 'networkidle' });
  // v7: o botão mora num shadow DOM aberto em #vlibras-access-wrapper (o Playwright atravessa)
  const visivel = await p.locator('#vlibras-button img').waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false);
  ok(visivel && (await p.locator('#vlibras-button img').evaluate((i) => getComputedStyle(i).opacity)) === '1', 'VLibras: botão de Libras não aparece (ou o painel o escondeu)');
  await p.close();
}
// diagnóstico grátis (/diagnostico/): o scan com o RDAP e o PageSpeed simulados, sem depender da rede nem da chave
{
  const p = await b.newPage({ viewport: { width: 390, height: 850 } });
  p.on('pageerror', (e) => falhas.push(`diagnóstico: erro de JS: ${e.message}`));
  const vence = new Date(Date.now() + 20 * 864e5).toISOString();
  await p.route('https://rdap.org/**', (r) => r.fulfill({ json: { events: [{ eventAction: 'registration', eventDate: '2019-03-01T00:00:00Z' },
    { eventAction: 'expiration', eventDate: vence }], nameservers: [{ ldhName: 'NS1.WIXDNS.NET' }] } }));
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  await p.route('https://www.googleapis.com/pagespeedonline/**', (r) => r.fulfill({ json: { lighthouseResult: {
    finalDisplayedUrl: 'https://exemplo.com.br/', categories: { performance: { score: 0.42 } },
    audits: { 'final-screenshot': { details: { data: png } }, 'largest-contentful-paint': { displayValue: '4,2 s' },
      'document-title': { score: 1 }, 'meta-description': { score: 0 }, 'is-crawlable': { score: 1 } } } } }));
  await p.goto(url + 'diagnostico/', { waitUntil: 'networkidle' });
  await p.fill('#scan-site', 'abc'); await p.click('#scan-form button');
  ok((await p.textContent('#scan-erro')).includes('Digite'), 'diagnóstico: endereço inválido não avisa');
  await p.fill('#scan-site', 'https://www.Exemplo.com.br/contato'); await p.click('#scan-form button');
  await p.waitForFunction(() => document.querySelector('#scan-titulo').textContent === 'Resultado de', null, { timeout: 15000 }).catch(() => {});
  const passos = await p.$$eval('[data-p]', (ls) => Object.fromEntries(ls.map((l) => [l.dataset.p, `${l.dataset.estado} ${l.querySelector('small').textContent}`])));
  const espera = { registro: /^aviso vence em 2\d dias/, dns: /^ok DNS em Wix$/, print: /^ok/, velocidade: /^aviso 42 de 100 · abre em 4,2 s · lento$/,
    https: /^ok/, google: /^aviso falta a descrição$/, indexa: /^ok/ };
  for (const [k, re] of Object.entries(espera)) ok(re.test(passos[k]), `diagnóstico: passo ${k} = "${passos[k]}"`);
  ok(await p.isVisible('#scan-print'), 'diagnóstico: print não aparece');
  ok((await p.textContent('#scan-alvo')) === 'www.exemplo.com.br', 'diagnóstico: endereço não foi limpo');
  await p.fill('#scan-cidade', 'Goiânia');
  const wa = await p.$eval('#scan-whats', (a) => { a.addEventListener('click', (e) => e.preventDefault()); a.click(); return decodeURIComponent(a.href); });
  ok(wa.includes('Site: www.exemplo.com.br') && wa.includes('Cidade: Goiânia') && !wa.includes('Ramo:') && wa.includes('- Velocidade no celular: 42 de 100'),
    `diagnóstico: mensagem do WhatsApp sem o resultado: ${wa}`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'diagnóstico: rolagem lateral com o resultado');
  await p.close();
}
await b.close(); srv.close();
console.log(falhas.length ? 'FALHAS:\n- ' + falhas.join('\n- ') : `tudo certo (${PAGINAS.length} páginas do menu + ${OUTRAS.length} outras, desktop e celular)`);
process.exit(falhas.length ? 1 : 0);
