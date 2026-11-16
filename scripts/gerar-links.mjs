// Página de links da bio (o "Linktree próprio"), dentro do site do cliente. Pedido do dono, 2026-11-15.
// Mobile first, HTML e CSS puros (o JS é só uma linha opcional para contar cliques no GA4), cores e fontes do cliente.
// Uso: node gerar-links.mjs <links.json> <saida.html>
// Formato do links.json e decisões: ../references/links.md
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [arq, saida] = process.argv.slice(2);
if (!arq || !saida) { console.error('uso: node gerar-links.mjs <links.json> <saida.html>'); process.exit(1); }
const d = JSON.parse(readFileSync(arq, 'utf8'));

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = { fundo: '#F6F4EF', texto: '#1F2433', suave: '#5B6070', primaria: '#232A45', sobrePrimaria: '#FFFFFF',
  destaque: '#5E9C8A', cartao: '#FFFFFF', borda: '#E4E0D8', raio: '14px',
  fonteTitulo: "Georgia, 'Times New Roman', serif", fonteTexto: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  ...(d.tema ?? {}) };

// Ícones de traço, 24×24, herdam a cor (currentColor).
const P = {
  whatsapp: '<path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>',
  mapa: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>',
  agenda: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  site: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
  email: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  telefone: '<path d="M6.5 3.5l3 .5 1.2 4-2 1.3a11 11 0 0 0 6 6l1.3-2 4 1.2.5 3a2 2 0 0 1-2 2.2A17 17 0 0 1 4.3 5.5a2 2 0 0 1 2.2-2z"/>',
  youtube: '<rect x="2.5" y="6" width="19" height="12" rx="3.5"/><path d="M10.5 9.5v5l4-2.5z"/>',
  linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5v6M8 7.5v.1M11.5 16.5v-6M11.5 13c0-1.5 1-2.5 2.3-2.5S16 11.5 16 13v3.5"/>',
  seta: '<path d="M9 6l6 6-6 6"/>',
};
const ico = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] ?? P.site}</svg>`;

// WhatsApp com mensagem pronta; links do próprio site ganham UTM para separar a origem no Analytics.
const href = (b) => {
  if (b.whatsapp) { const m = b.mensagem ?? d.mensagem; return `https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}` + (m ? `?text=${encodeURIComponent(m)}` : ''); } // botão sem mensagem própria usa a geral
  if (b.telefone) return `tel:+${String(b.telefone).replace(/\D/g, '')}`;
  if (b.email) return `mailto:${b.email}`;
  const u = b.url ?? '#';
  if (d.utm && d.site && u.startsWith(d.site)) { const [base, ancora] = u.split('#'); return base + (base.includes('?') ? '&' : '?') + d.utm + (ancora ? '#' + ancora : ''); } // UTM antes do #, senão vira parte da âncora
  return u;
};
const tipo = (b) => b.icone ?? (b.whatsapp ? 'whatsapp' : b.telefone ? 'telefone' : b.email ? 'email' : 'site');
const externo = (h) => /^https?:/.test(h) && !(d.site && h.startsWith(d.site));
const ev = (rotulo) => d.ga4 ? ` data-ev="${esc(rotulo)}"` : '';

const botao = (b) => {
  const h = href(b);
  return `<a class="btn${b.destaque ? ' btn-p' : ''}" href="${esc(h)}"${externo(h) ? ' target="_blank" rel="noopener"' : ''}${ev(b.rotulo)}>
      ${ico(tipo(b))}<span class="btn-txt"><b>${esc(b.rotulo)}</b>${b.detalhe ? `<small>${esc(b.detalhe)}</small>` : ''}</span>${ico('seta', 'ico seta')}
    </a>`;
};

const bloco = (s) => {
  if (s.tipo === 'botoes') return `<section class="grupo">${s.titulo ? `<h2>${esc(s.titulo)}</h2>` : ''}${s.itens.map(botao).join('\n    ')}</section>`;
  // "Como chegar": o link oficial do mapa, se houver; senão a busca do Google Maps pelo nome + endereço (pedido do dono, 2026-11-15).
  if (s.tipo === 'locais') s.itens.forEach((l) => { if (!l.mapa && l.endereco) l.mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.nome}, ${l.endereco}`)}`; });
  if (s.tipo === 'locais') return `<section class="grupo">${s.titulo ? `<h2>${esc(s.titulo)}</h2>` : ''}${s.itens.map((l) => `
    <article class="local">
      <h3>${esc(l.nome)}</h3>${l.cidade ? `<p class="cidade">${esc(l.cidade)}</p>` : ''}${l.endereco ? `<p>${esc(l.endereco)}</p>` : ''}${l.horario ? `<p>${esc(l.horario)}</p>` : ''}
      <div class="acoes">${l.whatsapp ? `<a class="mini mini-p" href="${esc(href({ whatsapp: l.whatsapp, mensagem: l.mensagem ?? d.mensagem }))}" target="_blank" rel="noopener"${ev('WhatsApp ' + l.nome)}>${ico('whatsapp')}Agendar</a>` : ''}${l.mapa ? `<a class="mini" href="${esc(l.mapa)}" target="_blank" rel="noopener"${ev('Mapa ' + l.nome)}>${ico('mapa')}Como chegar</a>` : ''}</div>
    </article>`).join('')}</section>`;
  if (s.tipo === 'texto') return `<section class="grupo texto"><p>${esc(s.texto)}</p></section>`;
  return '';
};

const redes = (d.redes ?? []).map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="${esc(r.rotulo ?? r.icone)}"${ev(r.rotulo ?? r.icone)}>${ico(r.icone)}</a>`).join('');
const avatar = d.foto ?? d.logo;

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="text-scale" content="scale">
<title>${esc(d.titulo ?? d.nome)}</title>
<meta name="description" content="${esc(d.descricao ?? '')}">
<meta name="robots" content="${esc(d.robots ?? 'noindex, follow')}">
${d.canonical ? `<link rel="canonical" href="${esc(d.canonical)}">` : ''}
<meta name="theme-color" content="${esc(t.fundo)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(d.titulo ?? d.nome)}">
<meta property="og:description" content="${esc(d.descricao ?? '')}">${d.ogImagem ? `<meta property="og:image" content="${esc(d.ogImagem)}">` : ''}
${d.favicon ? `<link rel="icon" href="${esc(d.favicon)}">` : ''}
${d.fontesCss ? `<link rel="stylesheet" href="${esc(d.fontesCss)}">` : ''}
<style>
:root{--fundo:${t.fundo};--texto:${t.texto};--suave:${t.suave};--p:${t.primaria};--sp:${t.sobrePrimaria};--dest:${t.destaque};--cartao:${t.cartao};--borda:${t.borda};--r:${t.raio};--ft:${t.fonteTitulo};--fx:${t.fonteTexto}}
*{box-sizing:border-box;margin:0}
body{background:var(--fundo);color:var(--texto);font:1rem/1.45 var(--fx);-webkit-font-smoothing:antialiased;min-height:100dvh;overflow-wrap:break-word}
main{max-width:480px;margin:0 auto;padding:calc(28px + env(safe-area-inset-top)) 16px calc(32px + env(safe-area-inset-bottom))}
header{text-align:center;margin-bottom:24px}
.avatar{width:96px;height:96px;border-radius:50%;object-fit:${d.foto ? 'cover' : 'contain'};background:var(--cartao);border:1px solid var(--borda);${d.foto ? '' : 'padding:14px;'}}
h1{font:400 1.45rem/1.15 var(--ft);letter-spacing:.06em;text-transform:${t.caixaAlta === false ? 'none' : 'uppercase'};margin-top:14px}
.sub{color:var(--suave);letter-spacing:.18em;text-transform:uppercase;font-size:.8rem;margin-top:6px}
.reg{color:var(--suave);font-size:.78rem;letter-spacing:.06em;margin-top:4px}
.bio{margin-top:12px;color:var(--texto)}
.grupo{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin-top:22px}
.grupo h2{font:600 .78rem/1 var(--fx);letter-spacing:.16em;text-transform:uppercase;color:var(--suave);margin:4px 2px 2px}
.btn{display:flex;align-items:center;gap:12px;min-height:58px;padding:10px 14px;border-radius:var(--r);background:var(--cartao);border:1px solid var(--borda);color:var(--texto);text-decoration:none;transition:transform .15s,box-shadow .15s}
.btn-p{background:var(--p);border-color:var(--p);color:var(--sp)}
.btn:active{transform:scale(.98)}
.btn-txt{flex:1;display:grid;min-width:0;overflow-wrap:anywhere}.btn-txt b{font-weight:600}.btn-txt small{opacity:.75;font-size:.82rem}
.ico{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.seta{width:18px;opacity:.5}
.local{background:var(--cartao);border:1px solid var(--borda);border-radius:var(--r);padding:14px}
.local h3{font:600 1rem/1.2 var(--fx)}.local p{color:var(--suave);font-size:.9rem;margin-top:3px}.local .cidade{color:var(--dest);font-weight:600;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}
.acoes{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.mini{flex:1;min-width:130px;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border-radius:calc(var(--r) - 4px);border:1px solid var(--borda);color:var(--texto);text-decoration:none;font-weight:600;font-size:.92rem}
.mini-p{background:var(--p);border-color:var(--p);color:var(--sp)}
.texto p{color:var(--suave);text-align:center;font-size:.9rem}
.redes{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:26px}
.redes a{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;border:1px solid var(--borda);color:var(--p);background:var(--cartao)}
footer{text-align:center;color:var(--suave);font-size:.75rem;margin-top:22px;line-height:1.6}
footer a{color:inherit}
a:focus-visible{outline:3px solid var(--dest);outline-offset:2px}
@media (hover:hover){.btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgb(0 0 0 / .08)}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<main>
  <header>
    ${avatar ? `<img class="avatar" src="${esc(avatar)}" alt="${esc(d.nome)}" width="96" height="96">` : ''}
    <h1>${esc(d.nome)}</h1>
    ${d.subtitulo ? `<p class="sub">${esc(d.subtitulo)}</p>` : ''}
    ${d.registro ? `<p class="reg">${esc(d.registro)}</p>` : ''}
    ${d.bio ? `<p class="bio">${esc(d.bio)}</p>` : ''}
  </header>
  ${(d.blocos ?? []).map(bloco).join('\n  ')}
  ${redes ? `<nav class="redes" aria-label="Redes">${redes}</nav>` : ''}
  <footer>${d.rodape ? esc(d.rodape) + '<br>' : ''}${d.site ? `<a href="${esc(d.site + (d.utm ? '?' + d.utm : ''))}">${esc(d.site.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : ''}</footer>
</main>
${d.ga4 ? `<script>document.addEventListener('click',e=>{const a=e.target.closest('[data-ev]');if(a&&window.gtag)gtag('event','clique_link',{rotulo:a.dataset.ev})})</script>` : ''}
</body>
</html>
`;
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, html);
console.log('salvo', saida, Math.round(html.length / 1024) + ' KB');
