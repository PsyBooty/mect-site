// Converte as artes geradas (PNG) em WebP nos tamanhos usados no site. Uso: node artes/converter.mjs
// hero: 1400 (desktop) + 800 (celular); produtos: 1000. Qualidade 0.8.
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path'; import { homedir } from 'node:os';
const require = createRequire(import.meta.url); const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
const SAIDAS = [['hero', 1400, 'hero'], ['hero', 800, 'hero-800'], ['produto-qualiguide', 1000, 'produto-qualiguide'], ['produto-watchdesk', 1000, 'produto-watchdesk']];
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
for (const [arte, largura, nome] of SAIDAS) {
  const src = 'data:image/png;base64,' + readFileSync(`artes/${arte}.png`).toString('base64');
  const r = await p.evaluate(async ({ src, largura }) => {
    const i = new Image(); i.src = src; await i.decode();
    const c = document.createElement('canvas'); c.width = largura; c.height = Math.round(i.naturalHeight * largura / i.naturalWidth);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(i, 0, 0, c.width, c.height);
    return { d: c.toDataURL('image/webp', 0.8), w: c.width, h: c.height };
  }, { src, largura });
  const buf = Buffer.from(r.d.split(',')[1], 'base64');
  writeFileSync(`assets/img/${nome}.webp`, buf);
  console.log(nome, r.w, 'x', r.h, Math.round(buf.length / 1024) + ' KB');
}
await b.close();
