const topo = document.querySelector('.topo');
addEventListener('scroll', () => topo.classList.toggle('rolou', scrollY > 8), { passive: true });

// menu do celular
const bt = document.querySelector('.menu-bt'), nav = document.getElementById('nav');
const fecha = () => { nav.classList.remove('aberto'); bt.setAttribute('aria-expanded', 'false'); bt.firstElementChild.textContent = 'Menu'; };
bt.addEventListener('click', () => {
  const abre = !nav.classList.contains('aberto');
  if (!abre) return fecha();
  nav.classList.add('aberto'); bt.setAttribute('aria-expanded', 'true'); bt.firstElementChild.textContent = 'Fechar';
});
nav.addEventListener('click', (e) => e.target.closest('a') && fecha());
addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('aberto')) { fecha(); bt.focus(); } });

// revelação ao rolar
const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.revela').forEach((el) => obs.observe(el));

const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

// palco do hero: inclina um pouco na direção do mouse (só com mouse de verdade e sem movimento reduzido)
const giro = document.querySelector('.palco__giro');
if (giro && !calmo && matchMedia('(pointer: fine)').matches) {
  const hero = giro.closest('section');
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    giro.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 8}deg`);
    giro.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - .5) * -6}deg`);
  });
  hero.addEventListener('pointerleave', () => { giro.style.removeProperty('--rx'); giro.style.removeProperty('--ry'); });
}

// números que sobem até o valor (o HTML já traz o valor final: sem JS ou com movimento reduzido, nada muda)
if (!calmo) {
  const conta = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    conta.unobserve(e.target);
    const el = e.target, alvo = +el.dataset.conta, suf = el.dataset.sufixo ?? '', t0 = performance.now();
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(alvo * (1 - (1 - p) ** 3)) + suf;
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }), { threshold: .5 });
  document.querySelectorAll('[data-conta]').forEach((el) => conta.observe(el));
}
