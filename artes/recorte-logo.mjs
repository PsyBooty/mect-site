// Recorta a logo do mockup ampliada 4x (referência para o ChatGPT). Uso: node artes/recorte-logo.mjs
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path'; import { homedir } from 'node:os';
const require = createRequire(import.meta.url); const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
const src = 'data:image/png;base64,' + readFileSync('_docs/mockup-home.png').toString('base64');
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
const d = await p.evaluate(async (src) => { const i = new Image(); i.src = src; await i.decode();
  const [x, y, w, h] = [44, 6, 146, 62]; const c = document.createElement('canvas'); c.width = w * 4; c.height = h * 4;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(i, x, y, w, h, 0, 0, c.width, c.height); return c.toDataURL('image/png'); }, src);
writeFileSync('artes/ref-logo-mockup.png', Buffer.from(d.split(',')[1], 'base64')); await b.close(); console.log('ok');
