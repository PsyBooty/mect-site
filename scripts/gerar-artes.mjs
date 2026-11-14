// Gera arte do site MECT no ChatGPT do dono, pelo Chrome com CDP (porta 9333), numa aba própria.
// Origem: pedido do dono 2026-11-14 ("usa o mesmo sistema do gerar post pro instagram"). Cópia do pedir() de
// qualiguide-reels/.claude/skills/posts-instagram-qualiguide/scripts/gerar-artes.mjs, sem o estilo QualiGuide.
// Uso: node scripts/gerar-artes.mjs artes/artes.json artes [id ...]
//   artes.json = { "artes": [{ "id": "hero", "formato": "paisagem|retrato", "prompt": "...", "anexos": ["assets/img/logo-iog-header.png"] }] }
// Pré-requisito: chrome.exe --user-data-dir="%LOCALAPPDATA%\qualiguide-chatgpt" --remote-debugging-port=9333 https://chatgpt.com/
// Nunca dois lotes ao mesmo tempo.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';

const require = createRequire(import.meta.url);
function playwright() {
  try { return require('playwright-core'); } catch {}
  const npx = join(homedir(), 'AppData/Local/npm-cache/_npx');
  for (const d of existsSync(npx) ? readdirSync(npx) : []) {
    const p = join(npx, d, 'node_modules/playwright-core');
    if (existsSync(p)) return require(p);
  }
  throw new Error('playwright-core não encontrado: rode uma vez `npx playwright-core --version`.');
}
const { chromium } = playwright();
import { join } from 'node:path';

const [arquivo, saida, ...so] = process.argv.slice(2);
if (!arquivo || !saida) { console.error('uso: node gerar-artes.mjs <artes.json> <pasta> [id ...]'); process.exit(1); }
mkdirSync(saida, { recursive: true });
const { artes } = JSON.parse(readFileSync(arquivo, 'utf8'));
const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0];
const page = await ctx.newPage(); // aba própria: não mexe numa conversa que outra sessão esteja usando

/** Manda um texto (numa conversa nova, com anexos, ou seguindo a atual) e devolve a imagem nova em PNG. */
async function pedir(texto, { nova, anexos = [] }) {
  if (nova) await page.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded' });
  const caixa = page.locator('div.ProseMirror[contenteditable="true"]');
  await caixa.waitFor({ timeout: 30000 });
  for (const anexo of anexos) {
    await page.locator('input[type="file"]:not([capture])').first().setInputFiles(anexo); // um por vez: o input não é multiple
    await page.waitForTimeout(6000);
  }
  // Só a galeria da RESPOSTA conta: o anexo ("Anexo do usuário") e a imagem da lâmina anterior, que ainda troca de
  // src enquanto termina de carregar, entravam como "imagem nova" e deslocavam o carrossel (visto no teste de 2026-11-12).
  const ultimaGaleria = () => page.evaluate(() => {
    const gs = document.querySelectorAll('[data-testid="generated-image-gallery"]');
    const g = gs[gs.length - 1];
    return g?.closest('[data-chatgpt-search-message-ids]')?.getAttribute('data-chatgpt-search-message-ids') ?? '';
  });
  const antes = await ultimaGaleria();
  await caixa.click();
  await page.keyboard.insertText(texto);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(8000);
  // pronta = a imagem da galeria nova fica com o mesmo src por 20 s (teto de 6 min)
  let ultimo = '', desde = Date.now(); const t0 = Date.now();
  while (Date.now() - t0 < 6 * 60000) {
    await page.waitForTimeout(3000);
    const src = await page.evaluate((antes) => {
      const gs = document.querySelectorAll('[data-testid="generated-image-gallery"]');
      const g = gs[gs.length - 1];
      if (!g || (g.closest('[data-chatgpt-search-message-ids]')?.getAttribute('data-chatgpt-search-message-ids') ?? '') === antes) return '';
      const imgs = [...g.querySelectorAll('[data-testid="generated-image-preview"] img')].filter((i) => i.naturalWidth >= 800);
      return imgs[0]?.src ?? '';
    }, antes);
    if (src && src === ultimo) { if (Date.now() - desde > 20000) break; } else { ultimo = src; desde = Date.now(); }
  }
  if (!ultimo) return null;
  const b64 = await page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: 'include' });
    const buf = new Uint8Array(await r.arrayBuffer()); let s = '';
    for (const x of buf) s += String.fromCharCode(x);
    return btoa(s);
  }, ultimo);
  return Buffer.from(b64, 'base64');
}

for (const a of artes) {
  if (so.length && !so.includes(a.id)) continue;
  const out = join(saida, `${a.id}.png`);
  if (!so.length && existsSync(out)) { console.log('pula', a.id); continue; }
  console.log('enviado', a.id);
  const fmt = a.formato === 'retrato' ? 'Portrait format (1024x1536).' : 'Landscape format (1536x1024).';
  const buf = await pedir(`Gere uma imagem. ${fmt}\n\n${a.prompt}`, { nova: true, anexos: a.anexos ?? [] });
  if (buf) { writeFileSync(out, buf); console.log('salvo', out); } else console.log('SEM IMAGEM', a.id);
}
await page.close(); process.exit(0); // fecha só a aba própria, não o Chrome do dono
