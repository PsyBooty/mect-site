// Gera favicon (ico + png) e o ícone da tela inicial do celular (180).
// Uso: node artes/gerar-icones.mjs   (na raiz do site). Ícone: a logo quadrada do dono (artes/Logo MECT em azul cobalto-2.png).
import { createRequire } from 'node:module'; import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path'; import { homedir } from 'node:os';
const require = createRequire(import.meta.url); const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
const { chromium } = require(readdirSync(npx).map((d) => join(npx, d, 'node_modules/playwright-core')).find(existsSync));
// logo quadrada do dono (MECT branco no azul cobalto), aproximada: o quadrado de 1254 px tem a marca entre x 145 e 1110,
// então ampliamos 1254/1060 para a marca ocupar quase toda a largura e continuar legível em 32 px
const logoQuadrada = 'data:image/png;base64,' + readFileSync('artes/Logo MECT em azul cobalto-2.png').toString('base64');
const icone = (lado) => `<!doctype html><style>
html, body { margin: 0; background: transparent; }
#i { width: ${lado}px; height: ${lado}px; border-radius: ${lado * .2}px; background: #0a52e0 url(${logoQuadrada}) 47% 54% / ${(1254 / 1060) * 100}% no-repeat; }
</style><div id="i"></div>`;

const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ deviceScaleFactor: 1 });
const png = async (lado) => { await p.setContent(icone(lado)); await p.waitForTimeout(100); return p.locator('#i').screenshot({ omitBackground: true }); };
const p32 = await png(32), p48 = await png(48), p180 = await png(180), p512 = await png(512);
writeFileSync('favicon.png', p48);
writeFileSync('assets/img/icone-180.png', p180);
writeFileSync('artes/icone-512.png', p512);
// favicon.ico com um PNG de 32px dentro (formato aceito por todos os navegadores atuais)
const cab = Buffer.alloc(22); cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(1, 4);
cab.writeUInt8(32, 6); cab.writeUInt8(32, 7); cab.writeUInt16LE(1, 10); cab.writeUInt16LE(32, 12); cab.writeUInt32LE(p32.length, 14); cab.writeUInt32LE(22, 18);
writeFileSync('favicon.ico', Buffer.concat([cab, p32]));

// a prévia de compartilhamento (og.jpg) sai do artes/gerar-og.mjs
await b.close();
console.log('favicon.ico', 22 + p32.length, 'bytes; favicon.png 48; icone-180.png');
