'use strict';
const TOTAL_FRAMES = 576;
const PAGE_COUNT = 7;
const LERP = 0.08;
const CONCURRENCY = 48;

let scrollPos = 0, targetScroll = 0, currentFrame = 0;
let images = new Array(TOTAL_FRAMES), loadedCount = 0, failCount = 0;
const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;

const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const loaderPct = document.getElementById('loaderPct');
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; drawFrame(); }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function framePath(i) {
  const dir = isMobile ? 'frames-mobile' : 'frames-webp';
  return `${dir}/frame_${String(i).padStart(6,'0')}.webp`;
}

function preloadFrames() {
  let idx = 0, active = 0;
  const fallback = setTimeout(() => { if (loadedCount === 0 || failCount >= CONCURRENCY) finishLoading(); }, 3000);
  function next() {
    while (active < CONCURRENCY && idx < TOTAL_FRAMES) {
      const i = idx++; active++;
      const img = new Image();
      img.onload = () => { images[i] = img; active--; loadedCount++; progress(); next(); };
      img.onerror = () => { active--; failCount++; loadedCount++; progress(); next(); };
      img.src = framePath(i + 1);
    }
  }
  function progress() {
    const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
    loaderFill.style.width = pct + '%';
    loaderPct.textContent = pct + '%';
    if (loadedCount >= TOTAL_FRAMES) { clearTimeout(fallback); finishLoading(); }
  }
  next();
}

function finishLoading() {
  loader.classList.add('hidden');
  pages[0].classList.add('active');
  revealElements(0);
  drawFrame();
}

function drawFrame() {
  const idx = Math.min(Math.max(Math.round(currentFrame), 0), TOTAL_FRAMES - 1);
  const img = images[idx];
  if (!img) return;
  const cw = canvas.width, ch = canvas.height;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

const MAX_SCROLL = (PAGE_COUNT - 1) * 1000;
window.addEventListener('wheel', e => { e.preventDefault(); targetScroll = Math.max(0, Math.min(targetScroll + e.deltaY * 1.2, MAX_SCROLL)); }, { passive: false });
let touchY = 0;
window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchmove', e => { const dy = touchY - e.touches[0].clientY; touchY = e.touches[0].clientY; targetScroll = Math.max(0, Math.min(targetScroll + dy * 3, MAX_SCROLL)); }, { passive: true });

function animate() {
  scrollPos += (targetScroll - scrollPos) * LERP;
  currentFrame = (scrollPos / MAX_SCROLL) * (TOTAL_FRAMES - 1);
  drawFrame();
  const pageIdx = Math.round(scrollPos / 1000);
  pages.forEach((p, i) => { if (i === pageIdx) { p.classList.add('active'); revealElements(i); } else p.classList.remove('active'); });
  navLinks.forEach(l => l.classList.toggle('active', parseInt(l.dataset.section) === pageIdx));
  requestAnimationFrame(animate);
}

const revealed = new Set();
function revealElements(idx) {
  if (revealed.has(idx)) return;
  revealed.add(idx);
  pages[idx].querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('visible'), i * 110));
}

navLinks.forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  targetScroll = parseInt(l.dataset.section) * 1000;
  mobileNav.classList.remove('open'); burger.classList.remove('open');
}));

document.querySelectorAll('[data-section]').forEach(el => {
  if (el.classList.contains('nav-link')) return;
  el.addEventListener('click', e => { e.preventDefault(); targetScroll = parseInt(el.dataset.section) * 1000; });
});

burger.addEventListener('click', () => { burger.classList.toggle('open'); mobileNav.classList.toggle('open'); });

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); targetScroll = Math.min(targetScroll + 1000, MAX_SCROLL); }
  if (e.key === 'ArrowUp') { e.preventDefault(); targetScroll = Math.max(targetScroll - 1000, 0); }
});

preloadFrames();
requestAnimationFrame(animate);

const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const name = document.getElementById('inputName').value;
    const phone = document.getElementById('inputPhone').value;
    const niche = document.getElementById('inputNiche').value;
    /* Telegram notification placeholder — replace BOT_TOKEN and CHAT_ID */
    const msg = `🔔 Новая заявка Глобал Плюс\n👤 ${name}\n📞 ${phone}\n🏷️ Ниша: ${niche}`;
    fetch(`https://api.telegram.org/bot__BOT_TOKEN__/sendMessage`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: '__CHAT_ID__', text: msg })
    }).catch(() => {});
    btn.textContent = '✓ Заявка отправлена! Ответим в течение 2 часов.';
    btn.style.background = '#4FC3F7'; btn.style.color = '#000';
    setTimeout(() => { btn.textContent = 'Получить бесплатный аудит ниши'; btn.style.background = ''; btn.style.color = ''; }, 4000);
  });
}
