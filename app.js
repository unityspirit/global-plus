/* ─── Глобал Плюс — ScrollCanvas Engine (Native Scroll-Snap) ─── */
'use strict';

const TOTAL_FRAMES = 672;
const LERP = 0.08;
const CONCURRENCY = 48;

const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) || innerWidth < 768;
const FRAME_DIR = isMobile ? 'frames-mobile' : 'frames-webp';

/* ── DOM refs ── */
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const loaderPct = document.getElementById('loaderPct');
const pages = Array.from(document.querySelectorAll('.page'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');

/* ── State ── */
let targetFrame = 0, currentFrame = 0, isReady = false;
const frames = new Array(TOTAL_FRAMES);

/* ── Canvas sizing ── */
function resize(){
  const dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawFrame(Math.round(currentFrame));
}
addEventListener('resize', resize);

/* ── Frame loader ── */
function padNum(n){return String(n).padStart(6,'0')}

function loadFrame(index){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=>{
      if(img.decode) img.decode().then(()=>{frames[index]=img;resolve()}).catch(()=>{frames[index]=img;resolve()});
      else {frames[index]=img;resolve()}
    };
    img.onerror = ()=>resolve();
    img.src = `${FRAME_DIR}/frame_${padNum(index+1)}.webp`;
  });
}

async function loadAllFrames(){
  let loaded = 0;
  const queue = Array.from({length:TOTAL_FRAMES},(_,i)=>i);
  async function worker(){
    while(queue.length>0){
      const idx=queue.shift();
      if(idx===undefined)return;
      await loadFrame(idx);
      loaded++;
      const pct=Math.floor((loaded/TOTAL_FRAMES)*100);
      loaderFill.style.width=pct+'%';
      loaderPct.textContent=pct+'%';
    }
  }
  await Promise.all(Array.from({length:CONCURRENCY},()=>worker()));
}

/* ── Draw frame (cover fit) ── */
function drawFrame(idx){
  idx=Math.max(0,Math.min(TOTAL_FRAMES-1,idx));
  const img=frames[idx]; if(!img) return;
  const cw=innerWidth,ch=innerHeight;
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
  const scale=Math.max(cw/iw,ch/ih);
  const sw=iw*scale,sh=ih*scale;
  ctx.clearRect(0,0,cw,ch);
  ctx.drawImage(img,(cw-sw)/2,(ch-sh)/2,sw,sh);
}

/* ── NATIVE SCROLL → frame mapping ── */
addEventListener('scroll',()=>{
  if(!isReady) return;
  const maxScroll=document.documentElement.scrollHeight-innerHeight;
  const progress=maxScroll>0?scrollY/maxScroll:0;
  targetFrame=progress*(TOTAL_FRAMES-1);
},{passive:true});

function scrollToPage(i){
  const p=pages[i];
  if(p) scrollTo({top:p.offsetTop,behavior:'smooth'});
}

/* ── Navigation ── */
navLinks.forEach(l=>l.addEventListener('click',e=>{
  e.preventDefault();
  scrollToPage(parseInt(l.dataset.section));
  mobileNav.classList.remove('open');
  burger.classList.remove('open');
}));
document.querySelectorAll('[data-section]').forEach(el=>{
  if(el.classList.contains('nav-link'))return;
  el.addEventListener('click',e=>{e.preventDefault();scrollToPage(parseInt(el.dataset.section))});
});
burger.addEventListener('click',()=>{burger.classList.toggle('open');mobileNav.classList.toggle('open')});

addEventListener('keydown',e=>{
  const cur=pages.findIndex(p=>p.classList.contains('is-active'));
  if(e.key==='ArrowDown'||e.key===' '){e.preventDefault();if(cur<pages.length-1)scrollToPage(cur+1)}
  if(e.key==='ArrowUp'){e.preventDefault();if(cur>0)scrollToPage(cur-1)}
});

/* ── IntersectionObserver for active page ── */
let lastIdx=-1;
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const idx=pages.indexOf(entry.target);
      if(idx!==-1 && idx!==lastIdx){
        lastIdx=idx;
        pages.forEach((p,i)=>p.classList.toggle('is-active',i===idx));
        navLinks.forEach(l=>l.classList.toggle('active',parseInt(l.dataset.section)===idx));
      }
    }
  });
},{root:null,rootMargin:'-40% 0px -40% 0px'});
pages.forEach(p=>observer.observe(p));

/* ── Render loop ── */
function animate(){
  requestAnimationFrame(animate);
  currentFrame+=(targetFrame-currentFrame)*LERP;
  if(isReady) drawFrame(Math.round(currentFrame));
}
animate();

/* ── Init ── */
(async function init(){
  resize();
  await loadAllFrames();
  isReady=true;
  drawFrame(0);
  setTimeout(()=>{
    loader.classList.add('hidden');
    pages[0].classList.add('is-active');
  },400);
})();

/* ── Contact Form ── */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const name = document.getElementById('inputName').value;
    const phone = document.getElementById('inputPhone').value;
    const niche = document.getElementById('inputNiche').value;
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
