// Recortes PROVISÓRIOS do mockup para a primeira versão da home (trocar por imagem real: _docs/pendencias-conteudo.md).
// Usa o Chrome do Playwright (canvas → WebP), porque a máquina não tem Python/sharp. Uso: node scripts/recortar-mockup.mjs
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path'; import { homedir } from 'node:os';
const require = createRequire(import.meta.url);
const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
const mockup = '_docs/mockup-home.png';
const src = 'data:image/png;base64,' + readFileSync(mockup).toString('base64');
// [nome, x, y, largura, altura] em proporção do mockup (0–1), para valer em qualquer resolução da imagem
const cortes = [
  ['hero', 0.5, 0.047, 0.5, 0.21],
  ['produto-qualiguide', 0.245, 0.515, 0.245, 0.12],
  ['produto-watchdesk', 0.722, 0.515, 0.255, 0.12],
];
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
const saida = await p.evaluate(async ({ src, cortes }) => {
  const img = new Image(); img.src = src; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  return { W, H, arqs: cortes.map(([n, x, y, w, h]) => {
    const c = document.createElement('canvas'); c.width = Math.round(w * W); c.height = Math.round(h * H);
    c.getContext('2d').drawImage(img, x * W, y * H, w * W, h * H, 0, 0, c.width, c.height);
    return [n, c.width, c.height, c.toDataURL('image/webp', 0.82)];
  }) };
}, { src, cortes });
console.log('mockup', saida.W, 'x', saida.H);
for (const [n, w, h, d] of saida.arqs) { writeFileSync(`assets/img/${n}.webp`, Buffer.from(d.split(',')[1], 'base64')); console.log(n, w, 'x', h); }
await b.close();
