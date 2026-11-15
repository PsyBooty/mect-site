// Imagem de prévia de compartilhamento (1200x630) no estilo do banner do dono
// (artes/Banner corporativo azul da MECT Tecnologia-1.png): fundo azul-marinho, ondas azuis, logo branca e a frase do hero,
// reorganizados para o formato 1,91:1 com tudo no centro (o WhatsApp pode cortar a prévia num quadrado central).
// Uso: node artes/gerar-og.mjs   (na raiz do site) → assets/img/og.jpg
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path'; import { homedir } from 'node:os';
const require = createRequire(import.meta.url); const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
const url = (f) => 'data:font/woff2;base64,' + readFileSync(f).toString('base64'); // setContent não lê arquivo local: a fonte vai embutida
const logo = 'data:image/png;base64,' + readFileSync('artes/logo-mect-transparente.png').toString('base64');
const html = `<!doctype html><style>
@font-face { font-family: S; src: url(${url('assets/fontes/satoshi-900.woff2')}); font-weight: 900; }
@font-face { font-family: S; src: url(${url('assets/fontes/satoshi-700.woff2')}); font-weight: 700; }
@font-face { font-family: S; src: url(${url('assets/fontes/satoshi-500.woff2')}); font-weight: 500; }
html, body { margin: 0; }
#c { width: 1200px; height: 630px; position: relative; overflow: hidden; font-family: S;
  background: radial-gradient(ellipse 70% 80% at 80% 30%, #0b2fa8 0%, transparent 60%), linear-gradient(115deg, #020b33 0%, #031250 45%, #0a2a9e 100%); }
#c svg { position: absolute; inset: 0; width: 100%; height: 100%; }
#t { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-bottom: 20px; }
#t img { width: 330px; filter: brightness(0) invert(1); }
#t h1 { margin: 34px 0 0; color: #fff; font-weight: 900; font-size: 52px; line-height: 1.1; letter-spacing: -.02em; max-width: 620px; }
#t p { margin: 16px 0 0; color: #8fc4ff; font-weight: 500; font-size: 27px; }
</style><div id="c">
<svg viewBox="0 0 1200 630" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="o1" x1="0" x2="1"><stop offset="0" stop-color="#1d6bff" stop-opacity="0"/><stop offset=".5" stop-color="#1d6bff" stop-opacity=".75"/><stop offset="1" stop-color="#3b8bff"/></linearGradient>
    <linearGradient id="o2" x1="0" x2="1"><stop offset="0" stop-color="#0d4fe0" stop-opacity="0"/><stop offset="1" stop-color="#1660ff" stop-opacity=".85"/></linearGradient>
  </defs>
  <path d="M380 630 C640 560 860 470 1200 330 L1200 420 C900 520 700 590 560 630 Z" fill="url(#o1)"/>
  <path d="M700 630 C900 560 1040 470 1200 400 L1200 470 C1080 530 960 590 880 630 Z" fill="url(#o2)"/>
  <path d="M880 0 C1000 60 1100 120 1200 150 L1200 70 C1120 50 1040 20 990 0 Z" fill="url(#o2)" opacity=".5"/>
</svg>
<div id="t"><img src="${logo}" alt=""><h1>Tecnologia para modernizar sua operação</h1><p>Sites, sistemas sob medida e consultoria em TI.</p></div>
</div>`;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
writeFileSync('assets/img/og.jpg', await p.locator('#c').screenshot({ type: 'jpeg', quality: 86 }));
await b.close();
console.log('assets/img/og.jpg', Math.round(readFileSync('assets/img/og.jpg').length / 1024) + ' KB');
