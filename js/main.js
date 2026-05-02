/* ============================================================
   SCRIPTS
   ============================================================ */

/* WhatsApp */
const WA = 'https://wa.me/5561995539559?text=';
const DEFAULT_MSG = [
  'Oi! Quero garantir uma cesta antes que acabe.',
  'Tô entre algumas opções e preciso decidir hoje.',
  'Pode me ajudar rápido?'
].join('\n');
const waLink = (msg) => WA + encodeURIComponent(msg || DEFAULT_MSG);
const openWhatsApp = (msg) => window.open(waLink(msg), '_blank', 'noopener');

let escolha = null;
let produtoAtual = '';
let lastOrderTrigger = null;

document.querySelectorAll('.wa-link').forEach(a=>{
  a.href = waLink();
  a.target = '_blank';
  a.rel = 'noopener';
});

document.querySelectorAll('.choice').forEach(c=>{
  const openChoiceChat = ()=>{
    escolha = c.getAttribute('data-choice');
    const msg = c.getAttribute('data-wa-msg') || DEFAULT_MSG;
    openWhatsApp(msg);
  };
  c.addEventListener('click', openChoiceChat);
  c.addEventListener('keydown', e=>{
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      openChoiceChat();
    }
  });
});

const orderModal = document.getElementById('orderModal');
const orderForm = document.getElementById('orderForm');
const orderProduct = document.getElementById('orderProduct');
const orderName = document.getElementById('orderName');
const orderPhone = document.getElementById('orderPhone');
const orderAddress = document.getElementById('orderAddress');
const orderNote = document.getElementById('orderNote');

function openOrderMenu(product, trigger){
  if(!orderModal || !orderForm || !orderProduct){
    const msg = `Oi! Quero garantir a cesta "${product}" para o Dia das Mães. Ainda tem disponibilidade?`;
    openWhatsApp(msg);
    return;
  }

  produtoAtual = product;
  lastOrderTrigger = trigger || null;
  orderProduct.value = product;
  if(typeof populateAddons === 'function') populateAddons(product);
  orderModal.classList.add('is-open');
  orderModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('order-open');

  setTimeout(()=>orderName && orderName.focus(), 80);
}

function closeOrderMenu(){
  if(!orderModal) return;

  orderModal.classList.remove('is-open');
  orderModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('order-open');

  if(typeof resetAddons === 'function') resetAddons();
  if(lastOrderTrigger) lastOrderTrigger.focus();
}

document.querySelectorAll('.prod-cta').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const nome = btn.getAttribute('data-product') || 'Cesta Wine Cestas';
    openOrderMenu(nome, btn);
  });
});

document.querySelectorAll('.prod-info-toggle').forEach(btn=>{
  const details = btn.nextElementSibling;
  if(!details || !details.classList.contains('prod-details')) return;

  btn.addEventListener('click', ()=>{
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));

    if(isOpen){
      details.classList.remove('open');
      details.addEventListener('transitionend', function handler(){
        if(btn.getAttribute('aria-expanded') === 'false'){
          details.setAttribute('hidden', '');
        }
        details.removeEventListener('transitionend', handler);
      });
    } else {
      details.removeAttribute('hidden');
      requestAnimationFrame(()=> details.classList.add('open'));
    }
  });
});

document.querySelectorAll('[data-order-close]').forEach(btn=>{
  btn.addEventListener('click', closeOrderMenu);
});

document.addEventListener('keydown', e=>{
  if(e.key === 'Escape' && orderModal && orderModal.classList.contains('is-open')){
    closeOrderMenu();
  }
});

if(orderPhone){
  orderPhone.addEventListener('input', ()=>{
    orderPhone.value = orderPhone.value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
      .slice(0, 15);
  });
}

/* ADICIONAIS — específicos por cesta + complementos universais */
const CESTA_PRICES = {
  'Essencia Materna': 299.99,
  'Feliz dia mãe': 249.99,
  'Brunch Amor de mãe': 239.99,
  'Mãe o Café chegou': 450.00,
  'Um brinde a minha mãe': 489.00
};

const ADDONS_PER_CESTA = {
  'Essencia Materna': [
    { name: 'Arranjo de flores P', price: 49.99 },
    { name: 'Tabua de Frios M', price: 129.99 },
    { name: 'Vinho (confirmar preço) ', price: 0 },
    { name: 'Espumante (confirmar preço) ', price: 0 }
  ],
  'Feliz dia mãe': [
    { name: 'Tabua de Frios M', price: 129.99 },
    { name: 'Vinho (confirmar preço) ', price: 0 },
    { name: 'Espumante (confirmar preço) ', price: 0 }
  ],
  'Um brinde a minha mãe': [
    { name: 'Tabua de Frios M', price: 129.99 },
    { name: 'Vinho (confirmar preço) ', price: 0 },
    { name: 'Espumante (confirmar preço) ', price: 0 }
  ]
};

const UNIVERSAL_COMPLEMENTOS = [
  { name: 'Maço de astromélias', price: 49.99 },
  { name: 'Trio de polaroids', price: 49.99 },
  { name: 'Croissant amanteigado', price: 14.99 },
  { name: 'Suco Integral (300ml)', price: 16.99 }
];

function formatBRL(value){
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

function getCestaPrice(){
  if(!produtoAtual) return 0;
  return CESTA_PRICES[produtoAtual] || 0;
}

const addonsCestaList = document.getElementById('orderAddonsCestaList');
const addonsCestaGroup = document.getElementById('orderAddonsCestaGroup');
const complementosList = document.getElementById('orderComplementosList');
const summaryCesta = document.getElementById('summaryCesta');
const summaryExtrasRow = document.getElementById('summaryExtrasRow');
const summaryExtrasCount = document.getElementById('summaryExtrasCount');
const summaryExtrasValue = document.getElementById('summaryExtrasValue');
const summaryTotal = document.getElementById('summaryTotal');

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function renderAddonOption(addon, group){
  const safe = escapeHTML(addon.name);
  return `<label class="addon-option">
      <input type="checkbox" name="addons" value="${safe}" data-price="${addon.price}" data-group="${group}"/>
      <span class="addon-check" aria-hidden="true"></span>
      <span class="addon-row">
        <strong>${safe}</strong>
        <span class="addon-pill">+ R$ ${addon.price}</span>
      </span>
    </label>`;
}

function populateAddons(productName){
  const cestaItems = ADDONS_PER_CESTA[productName] || [];

  if(addonsCestaList){
    addonsCestaList.innerHTML = cestaItems.map(a => renderAddonOption(a, 'cesta')).join('');
  }
  if(addonsCestaGroup){
    if(cestaItems.length){
      addonsCestaGroup.removeAttribute('hidden');
    } else {
      addonsCestaGroup.setAttribute('hidden', '');
    }
  }
  if(complementosList){
    complementosList.innerHTML = UNIVERSAL_COMPLEMENTOS.map(a => renderAddonOption(a, 'complemento')).join('');
  }
  updateAddonsTotal();
}

function getSelectedAddons(){
  if(!orderForm) return [];
  return Array.from(orderForm.querySelectorAll('input[name="addons"]:checked'))
    .map(input => ({
      name: input.value,
      price: parseFloat(input.getAttribute('data-price')) || 0,
      group: input.getAttribute('data-group') || 'extra'
    }));
}

function updateAddonsTotal(){
  const selected = getSelectedAddons();
  const extrasTotal = selected.reduce((sum, a) => sum + a.price, 0);
  const cestaPrice = getCestaPrice();
  const grandTotal = cestaPrice + extrasTotal;

  if(summaryCesta) summaryCesta.textContent = formatBRL(cestaPrice);
  if(summaryTotal) summaryTotal.textContent = formatBRL(grandTotal);

  if(summaryExtrasRow){
    if(selected.length){
      summaryExtrasRow.removeAttribute('hidden');
      if(summaryExtrasCount) summaryExtrasCount.textContent = String(selected.length);
      if(summaryExtrasValue) summaryExtrasValue.textContent = '+ ' + formatBRL(extrasTotal);
    } else {
      summaryExtrasRow.setAttribute('hidden', '');
    }
  }
}

function resetAddons(){
  if(!orderForm) return;
  orderForm.querySelectorAll('input[name="addons"]').forEach(input => {
    input.checked = false;
  });
  updateAddonsTotal();
}

[addonsCestaList, complementosList].forEach(list => {
  if(list) list.addEventListener('change', updateAddonsTotal);
});

if(orderForm){
  orderForm.addEventListener('submit', e=>{
    e.preventDefault();

    const observacao = orderNote.value.trim() || 'Sem observação';
    const selected = getSelectedAddons();
    const cestaAddons = selected.filter(a => a.group === 'cesta');
    const compAddons = selected.filter(a => a.group === 'complemento');
    const extrasTotal = selected.reduce((s, a) => s + a.price, 0);
    const cestaPrice = getCestaPrice();
    const grandTotal = cestaPrice + extrasTotal;

    let extrasBlock = '';
    if(cestaAddons.length){
      extrasBlock += `\nAdicionais da cesta:\n` +
        cestaAddons.map(a => `  • ${a.name} — +${formatBRL(a.price)}`).join('\n');
    }
    if(compAddons.length){
      extrasBlock += `\nComplementos extras:\n` +
        compAddons.map(a => `  • ${a.name} — +${formatBRL(a.price)}`).join('\n');
    }
    if(extrasTotal > 0){
      extrasBlock += `\nSubtotal extras: +${formatBRL(extrasTotal)}`;
    }

    const cestaName = produtoAtual || orderProduct.value.trim();
    const cestaLine = cestaPrice > 0
      ? `Cesta desejada: ${cestaName} — ${formatBRL(cestaPrice)}`
      : `Cesta desejada: ${cestaName}`;

    const msg = [
      'Oi! Quero finalizar meu pedido pelo site.\n',
      `Nome: ${orderName.value.trim()}`,
      `Telefone: ${orderPhone.value.trim()}`,
      `Local para entrega: ${orderAddress.value.trim()}`,
      cestaLine,
      extrasBlock,
      `\n*Total do pedido: ${formatBRL(grandTotal)}*`,
      `\nObservação: ${observacao}`,
      escolha ? `Presente para: ${escolha}` : '',
      '\nPode confirmar disponibilidade e próximos passos?'
    ].filter(Boolean).join('\n');

    openWhatsApp(msg);
    closeOrderMenu();
  });
}

/* CURSOR */
/* CURSOR custom — apenas em devices com mouse fino (desktop sem touch) */
const cursor = document.getElementById('cursor');
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const hasFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches && !isTouch;
if(cursor && hasFinePointer){
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove', e=>{mx=e.clientX;my=e.clientY});
  (function loop(){
    cx += (mx-cx)*.22; cy += (my-cy)*.22;
    cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('[data-hover], a, button').forEach(el=>{
    el.addEventListener('mouseenter', ()=>cursor.classList.add('hover'));
    el.addEventListener('mouseleave', ()=>cursor.classList.remove('hover'));
  });
  document.addEventListener('mousedown', ()=>cursor.classList.add('click'));
  document.addEventListener('mouseup', ()=>cursor.classList.remove('click'));
} else if(cursor){
  // Em touch devices, remove o elemento totalmente do DOM
  cursor.remove();
}

/* TOPBAR scrolled */
window.addEventListener('scroll', ()=>{
  document.getElementById('topbar').classList.toggle('scrolled', window.scrollY>80);
});

/* TOPBAR mobile drawer */
const topbarMenu = document.querySelector('.topbar-menu');
const topbarDrawer = document.getElementById('topbarDrawer');
if(topbarMenu && topbarDrawer){
  const setDrawerOpen = (open) => {
    topbarMenu.setAttribute('aria-expanded', String(open));
    topbarDrawer.setAttribute('aria-hidden', String(!open));
    topbarDrawer.classList.toggle('is-open', open);
    document.body.classList.toggle('drawer-open', open);
  };
  topbarMenu.addEventListener('click', ()=>{
    const isOpen = topbarMenu.getAttribute('aria-expanded') === 'true';
    setDrawerOpen(!isOpen);
  });
  topbarDrawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', ()=> setDrawerOpen(false));
  });
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape' && topbarMenu.getAttribute('aria-expanded') === 'true'){
      setDrawerOpen(false);
    }
  });
}

/* COUNTDOWN — Dia das Mães (segundo domingo de maio) */
function mothersDay(year){
  const d = new Date(year,4,1);
  const offset = (7 - d.getDay()) % 7;
  return new Date(year, 4, 1 + offset + 7, 23, 59, 59);
}
function nextMothersDay(){
  const now = new Date();
  let t = mothersDay(now.getFullYear());
  if(t < now) t = mothersDay(now.getFullYear()+1);
  return t;
}
const target = nextMothersDay();
function tick(){
  const now = new Date();
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff/86400000); diff -= d*86400000;
  const h = Math.floor(diff/3600000); diff -= h*3600000;
  const m = Math.floor(diff/60000); diff -= m*60000;
  const s = Math.floor(diff/1000);
  document.getElementById('d').textContent = String(d).padStart(2,'0');
  document.getElementById('h').textContent = String(h).padStart(2,'0');
  document.getElementById('m').textContent = String(m).padStart(2,'0');
  document.getElementById('s').textContent = String(s).padStart(2,'0');
}
tick(); setInterval(tick,1000);

/* REVEAL on scroll */
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, {threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* Capacity bar anim */
const capFill = document.getElementById('capFill');
const capIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      if(capFill){
        capFill.style.width = '87%';
      }
      capIO.disconnect();
    }
  });
}, {threshold:.5});
const capacityElement = document.querySelector('.capacity');
if(capacityElement){
  capIO.observe(capacityElement);
}

/* Parallax suave no hero-bg — desativado em mobile pra performance */
const heroBg = document.querySelector('.hero-bg');
const isCoarsePointer = window.matchMedia('(pointer:coarse)').matches;
const isSmallScreen = window.matchMedia('(max-width:768px)').matches;
if(heroBg && !isCoarsePointer && !isSmallScreen){
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    if(y < 900){
      heroBg.style.transform = `scale(1.08) translateY(${y*.25}px)`;
    }
  }, {passive:true});
}
