// Logo gerada (fundo branco) → fundo transparente, recortada justa, WebP com 2x a altura exibida.
// Uso: node artes/tratar-logo.mjs   (lê artes/logo-mect.png, grava assets/img/logo-mect.webp e artes/logo-mect-transparente.png)
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path'; import { homedir } from 'node:os';
const require = createRequire(import.meta.url); const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
const ALTURA = 120; // exibida a ~56 px no cabeçalho
const src = 'data:image/png;base64,' + readFileSync('artes/logo-mect.png').toString('base64');
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
const r = await p.evaluate(async ({ src, ALTURA }) => {
  const i = new Image(); i.src = src; await i.decode();
  const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
  const g = c.getContext('2d'); g.drawImage(i, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let k = 0; k < px.length; k += 4) {
    // fundo branco vira transparência; a cor é "despremultiplicada" para a borda não ficar esbranquiçada
    const a = 255 - Math.min(px[k], px[k + 1], px[k + 2]);
    if (a < 12) { px[k + 3] = 0; continue; }
    for (let j = 0; j < 3; j++) px[k + j] = Math.max(0, Math.round((px[k + j] - 255 * (1 - a / 255)) / (a / 255)));
    px[k + 3] = a;
    const n = k / 4, x = n % c.width, y = (n / c.width) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  g.putImageData(d, 0, 0);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const cheia = document.createElement('canvas'); cheia.width = w; cheia.height = h;
  cheia.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
  const s = document.createElement('canvas'); s.height = ALTURA; s.width = Math.round(w * ALTURA / h);
  const gs = s.getContext('2d'); gs.imageSmoothingQuality = 'high'; gs.drawImage(cheia, 0, 0, s.width, s.height);
  return { png: cheia.toDataURL('image/png'), webp: s.toDataURL('image/webp', 0.92), w: s.width, h: s.height };
}, { src, ALTURA });
writeFileSync('artes/logo-mect-transparente.png', Buffer.from(r.png.split(',')[1], 'base64'));
writeFileSync('assets/img/logo-mect.webp', Buffer.from(r.webp.split(',')[1], 'base64'));
console.log('logo-mect.webp', r.w, 'x', r.h);
await b.close();
