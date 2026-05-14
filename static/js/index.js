/* ══ STAR FIELD ══ */
const cvs = document.getElementById('bg'), ctx = cvs.getContext('2d');
function resize() { cvs.width = window.innerWidth; cvs.height = window.innerHeight } resize();
window.addEventListener('resize', resize);
const stars = Array.from({ length: 260 }, () => ({
  x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
  r: .3 + Math.random() * 1, a: Math.random(), s: .001 + Math.random() * .004,
  c: Math.random() > .7 ? 'rgba(167,139,250,' : 'rgba(251,113,133,'
}));
(function draw() {
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  stars.forEach(s => {
    s.a += s.s;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.c + (0.1 + .6 * Math.abs(Math.sin(s.a))) + ')'; ctx.fill();
  });
  requestAnimationFrame(draw);
})();

/* ══ PARTICLES ══ */
for (let i = 0; i < 25; i++) {
  const p = document.createElement('div'); p.className = 'pt';
  const side = Math.random() > .5;
  p.style.cssText = `
    left:${side ? Math.random() * 50 : 50 + Math.random() * 50}%;
    width:${1 + Math.random() * 2}px;height:${1 + Math.random() * 2}px;
    background:${side ? '#a78bfa' : '#fb7185'};
    animation-duration:${9 + Math.random() * 13}s;
    animation-delay:${Math.random() * 14}s;
    --dx:${(Math.random() - .5) * 60}px`;
  document.body.appendChild(p);
}