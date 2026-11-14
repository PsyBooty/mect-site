document.documentElement.classList.add('js');

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
