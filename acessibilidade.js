// Painel de acessibilidade dos nossos sites estáticos: ícone fixo no canto, painel com 10 ferramentas de leitura e a
// escolha lembrada no navegador da pessoa (localStorage), valendo em todas as páginas.
// Origem: pedido do dono 2026-11-16, inspirado no Ally da Elementor (aevoimobiliaria.com.br), que só roda em WordPress
// e pesa ~162 KB; este faz o essencial em um arquivo, sem dependência. Detalhes: references/acessibilidade.md.
// Uso: copie para a raiz do site e ponha no <head>, SEM defer (aplica contraste/cinza antes de pintar a página):
//   <script src="/acessibilidade.js?v=<hash>" data-declaracao="/acessibilidade/"></script>
// Cor do botão: --a11y-cor no :root do site (padrão azul). Sobe sozinho acima da .barra-acao do celular.
// Não substitui a acessibilidade do próprio site (contraste, alt, foco, títulos): só adapta a leitura a quem precisa.
(() => {
  const CHAVE = 'acessibilidade';
  const declaracao = document.currentScript?.dataset.declaracao;
  const NIVEIS = [1, 1.15, 1.3, 1.5]; // texto maior: cada clique sobe um nível e volta ao normal depois do último
  const FERRAMENTAS = [
    ['texto', 'Texto maior', '<path d="M4 7V5h11v2M9.5 5v14M7 19h5M14 12v-1.5h7V12M17.5 10.5V19M16 19h3"/>'],
    ['espaco', 'Espaçar o texto', '<path d="M4 6h16M4 12h16M4 18h16M2 9l2-3 2 3M2 15l2 3 2-3"/>'],
    ['fonte', 'Fonte legível', '<path d="M4 19l5-14 5 14M6 14h6M16 19v-6a2.5 2.5 0 015 0v6M16 16h5"/>'],
    ['contraste', 'Alto contraste', '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 000-18z" fill="currentColor"/>'],
    ['cinza', 'Tons de cinza', '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>'],
    ['imagens', 'Esconder imagens', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6M3 3l18 18"/>'],
    ['animacoes', 'Pausar animações', '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'],
    ['links', 'Destacar links', '<path d="M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1"/>'],
    ['mascara', 'Máscara de leitura', '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 14h18"/>'],
    ['foco', 'Destacar foco', '<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M2 4h4M18 4h4M2 20h4M18 20h4"/>'],
  ];
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } };
  let estado = ler();
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch {} };

  // efeitos na página: classes no <html>, aplicadas já no <head> para não piscar a página normal antes
  // os efeitos não tocam no painel nem no VLibras (v7: #vlibras-access-wrapper e #vlibras-app-root): o contraste
  // pintaria a janela do avatar e "esconder imagens" sumiria com as imagens dela
  const fora = ':not(#a11y):not([id^="vlibras"]):not([id^="vlibras"] *)';
  const css = document.createElement('style');
  css.textContent = `
html.a11y-espaco body *${fora}{line-height:1.6!important;letter-spacing:.12em!important;word-spacing:.16em!important}
html.a11y-fonte body *${fora}:not(svg):not(svg *){font-family:Verdana,Tahoma,Arial,sans-serif!important}
html.a11y-contraste body,html.a11y-contraste body *${fora}{background:#fff!important;color:#000!important;border-color:#000!important;text-shadow:none!important;box-shadow:none!important}
html.a11y-contraste a${fora},html.a11y-contraste a *${fora}{color:#0000c8!important;text-decoration:underline!important}
html.a11y-cinza{filter:grayscale(1)}
html.a11y-imagens img${fora},html.a11y-imagens video${fora},html.a11y-imagens picture${fora}{opacity:0!important}
html.a11y-imagens body *${fora}{background-image:none!important}
html.a11y-animacoes *,html.a11y-animacoes *::before,html.a11y-animacoes *::after{animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001s!important;transition-delay:0s!important;scroll-behavior:auto!important}
html.a11y-links a{text-decoration:underline!important;text-underline-offset:3px!important;outline:2px solid #e8a400!important;outline-offset:2px!important}
html.a11y-foco :focus{outline:4px solid #e8a400!important;outline-offset:3px!important;box-shadow:0 0 0 7px #000!important}`;
  document.head.append(css);
  const aplicarClasses = () => {
    // a11y-texto não tem CSS aqui: é o gancho para o site adaptar o que é frágil com texto maior (ex.: rodapé do IOG)
    for (const [id] of FERRAMENTAS) document.documentElement.classList.toggle(`a11y-${id}`, id === 'texto' ? estado.texto > 0 : !!estado[id]);
  };
  aplicarClasses();

  // texto maior: multiplica o tamanho calculado de cada elemento que tem texto próprio (o CSS dos sites usa px, então
  // mudar o font-size do <html> não adiantaria). Só o <header> fica de fora, para não quebrar a linha do topo (para
  // ele a pessoa ainda tem o zoom do navegador). <nav> fora do header cresce: rodapé, caminho, barra do celular.
  const originais = new Map();
  const escalar = () => {
    for (const [el, v] of originais) el.style.fontSize = v;
    originais.clear();
    const f = NIVEIS[estado.texto || 0] || 1;
    if (f === 1) return;
    const alvos = [...document.body.querySelectorAll('*')].filter((el) => !el.closest('header,#a11y,[id^="vlibras"],script,style,svg')
      && (el.matches('input,select,textarea') || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())));
    const tamanhos = alvos.map((el) => parseFloat(getComputedStyle(el).fontSize)); // lê tudo antes de escrever: não acumula
    alvos.forEach((el, i) => { originais.set(el, el.style.fontSize); el.style.fontSize = `${tamanhos[i] * f}px`; });
  };

  const montar = () => {
    const host = document.createElement('div');
    host.id = 'a11y';
    host.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147483000';
    const raiz = host.attachShadow({ mode: 'open' });
    const icone = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
    raiz.innerHTML = `<style>
:host{all:initial}
*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.abrir{width:52px;height:52px;border-radius:50%;border:2px solid #fff;background:var(--a11y-cor,#1849d6);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.28)}
.abrir svg{width:30px;height:30px;stroke-width:1.6}
.abrir:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #e8a400;outline-offset:2px}
.painel{position:absolute;left:0;bottom:64px;width:min(360px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 110px));overflow:auto;background:#fff;color:#111;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);padding:16px}
.painel[hidden]{display:none}
.topo{display:flex;align-items:center;gap:10px;margin-bottom:12px}
h2{flex:1;margin:0;font-size:18px;font-weight:700}
.fechar{border:0;background:#eef1f5;color:#111;width:36px;height:36px;border-radius:50%;cursor:pointer;display:grid;place-items:center}
.grade{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ferr{display:flex;align-items:center;gap:10px;min-height:56px;padding:10px 12px;border:2px solid #e2e6ec;border-radius:12px;background:#f6f8fa;color:#111;font-size:14.5px;line-height:1.25;text-align:left;cursor:pointer}
.ferr:hover{border-color:#b9c2cf}
.ferr[aria-pressed=true]{border-color:var(--a11y-cor,#1849d6);background:#eaf0ff}
.ferr[aria-pressed=true]::after{content:"✓";margin-left:auto;font-weight:700;font-size:16px;color:var(--a11y-cor,#1849d6)}
@media (forced-colors:active){.ferr[aria-pressed=true]{border:3px solid Highlight}.ferr[aria-pressed=true]::after{color:Highlight}}
.ferr small{display:block;font-size:12.5px;color:#4a5361}
.rodape{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;font-size:14px}
.redefinir{border:0;background:none;color:#111;text-decoration:underline;font-size:14px;cursor:pointer;padding:6px 0}
a{color:#0b3fb3}
.mascara{position:fixed;left:0;right:0;background:rgba(0,0,0,.62);pointer-events:none}
.mascara[hidden]{display:none}
</style>
<div class="mascara" hidden></div><div class="mascara" hidden></div>
<div class="painel" id="painel" role="dialog" aria-labelledby="titulo" hidden>
  <div class="topo"><h2 id="titulo">Acessibilidade</h2><button class="fechar" type="button" aria-label="Fechar">${icone('<path d="M6 6l12 12M18 6L6 18"/>')}</button></div>
  <div class="grade">${FERRAMENTAS.map(([id, nome, d]) => `<button class="ferr" type="button" data-id="${id}" aria-pressed="false">${icone(d)}<span>${nome}<small></small></span></button>`).join('')}</div>
  <div class="rodape"><button class="redefinir" type="button">Redefinir tudo</button>${declaracao ? `<a href="${declaracao}">Declaração de acessibilidade</a>` : ''}</div>
</div>
<button class="abrir" type="button" aria-label="Acessibilidade" aria-expanded="false" aria-controls="painel">${icone('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="6.6" r="1.4" fill="currentColor"/><path d="M6.5 9.4l5.5 1.2 5.5-1.2M12 10.6v3.6l-2.6 5M12 14.2l2.6 5"/>')}</button>`;
    document.body.append(host);

    const painel = raiz.querySelector('.painel'), abrir = raiz.querySelector('.abrir');
    // no celular o botão fica acima da barra fixa "WhatsApp | Ligar"
    const barra = document.querySelector('.barra-acao');
    const posicionar = () => { host.style.bottom = `${16 + (barra && getComputedStyle(barra).display !== 'none' ? barra.offsetHeight : 0)}px`; };
    const [mCima, mBaixo] = raiz.querySelectorAll('.mascara');
    const mover = (y) => { mCima.style.cssText = `top:0;height:${Math.max(0, y - 60)}px`; mBaixo.style.cssText = `top:${y + 60}px;bottom:0`; };
    const alternar = (aberto) => { painel.hidden = !aberto; abrir.setAttribute('aria-expanded', String(aberto)); if (aberto) raiz.querySelector('.ferr').focus(); };
    const mostrar = () => {
      for (const b of raiz.querySelectorAll('.ferr')) {
        const id = b.dataset.id, nivel = estado.texto || 0;
        b.setAttribute('aria-pressed', String(id === 'texto' ? nivel > 0 : !!estado[id]));
        if (id === 'texto') b.querySelector('small').textContent = nivel ? `${Math.round(NIVEIS[nivel] * 100)}%` : '';
      }
      mCima.hidden = mBaixo.hidden = !estado.mascara;
      if (estado.mascara && !mCima.style.top) mover(innerHeight / 2); // começa no meio até o ponteiro mexer
      if (estado.animacoes) for (const v of document.querySelectorAll('video')) v.pause();
    };
    // o botão marca na hora e o "texto maior" (pesado: ~180–350 ms no corpo clínico do IOG com CPU 4x mais lenta) roda
    // depois do próximo quadro, senão o toque demora a responder (INP)
    const depoisDePintar = (f) => requestAnimationFrame(() => setTimeout(f));
    const mudar = (id) => {
      if (id === 'texto') estado.texto = ((estado.texto || 0) + 1) % NIVEIS.length;
      else estado[id] = !estado[id];
      salvar(); aplicarClasses(); mostrar();
      if (id === 'texto') depoisDePintar(() => { escalar(); posicionar(); });
    };
    abrir.onclick = () => alternar(painel.hidden);
    raiz.querySelector('.fechar').onclick = () => { alternar(false); abrir.focus(); };
    raiz.querySelector('.grade').onclick = (e) => { const b = e.target.closest('.ferr'); if (b) mudar(b.dataset.id); };
    raiz.querySelector('.redefinir').onclick = () => { estado = {}; salvar(); aplicarClasses(); mostrar(); depoisDePintar(() => { escalar(); posicionar(); }); };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden) { alternar(false); abrir.focus(); } });
    document.addEventListener('click', (e) => { if (!painel.hidden && !e.composedPath().includes(host)) alternar(false); });
    // máscara de leitura: faixa clara de 120 px que segue o ponteiro (mouse ou dedo), o resto escurece
    document.addEventListener('pointermove', (e) => { if (estado.mascara) mover(e.clientY); }, { passive: true });
    addEventListener('resize', posicionar);
    escalar(); posicionar(); mostrar(); // escala antes de posicionar: com texto maior a barra do celular fica mais alta
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
