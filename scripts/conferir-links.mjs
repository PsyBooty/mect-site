// Confere os links internos da raiz do site (sem build por enquanto): todo href/src "/..." precisa existir, e toda âncora "#id" precisa do id no destino.
// Origem: páginas internas do site novo (2026-11-14). Uso: node scripts/conferir-links.mjs.
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const arq = (d) => readdirSync(d).filter((f) => !f.startsWith('.')).flatMap((f) => (statSync(join(d, f)).isDirectory() ? arq(join(d, f)) : [join(d, f)]));
const destino = (u) => { const a = join('.', u); return existsSync(a) && statSync(a).isDirectory() ? join(a, 'index.html') : a; };
const quebrados = [];
for (const f of arq('.').filter((f) => f.endsWith('.html'))) {
  const h = readFileSync(f, 'utf8');
  for (const [, u, ancora] of h.matchAll(/(?:href|src)="(\/[^"#?]*)(?:\?[^"#]*)?(?:#([\w-]+))?"/g)) {
    const alvo = destino(u);
    if (!existsSync(alvo)) quebrados.push(`${u}  <- ${f}`);
    else if (ancora && !readFileSync(alvo, 'utf8').includes(`id="${ancora}"`)) quebrados.push(`${u}#${ancora} (âncora)  <- ${f}`);
  }
}
console.log(quebrados.length ? [...new Set(quebrados)].join('\n') : 'nenhum link interno quebrado');
process.exit(quebrados.length ? 1 : 0);
