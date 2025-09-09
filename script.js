// -------------------------- Footer year --------------------------
document.getElementById('y') && (document.getElementById('y').textContent = new Date().getFullYear());

// ========================== Mobile NAV (dropdown under bar) ==========================
(() => {
  const nav = document.querySelector('.nav');
  const hamb = document.querySelector('.hamb');          // ☰ button
  const menu = document.getElementById('menu');          // menu container
  if (!nav || !hamb || !menu) return;

  const body = document.body;
  const mql = window.matchMedia('(max-width: 768px)');
  const ICON_OPEN = '✕';
  const ICON_CLOSED = '☰';

  const isOpen = () => menu.classList.contains('open');

  // compute CSS var --navH so the dropdown starts exactly below the bar
  function setNavHeight() {
    const h = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--navH', h + 'px');
  }

  function setOpen(open) {
    menu.classList.toggle('open', open);
    body.classList.toggle('nav-open', open);             // lock scroll
    hamb.textContent = open ? ICON_OPEN : ICON_CLOSED;
    hamb.setAttribute('aria-label', open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού');
    hamb.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      const first = menu.querySelector('a,button,[tabindex]:not([tabindex="-1"])');
      setTimeout(() => first?.focus?.({ preventScroll: true }), 0);
    } else {
      hamb.focus?.({ preventScroll: true });
    }
  }

  // Toggle
  hamb.addEventListener('click', () => setOpen(!isOpen()));

  // Close on link tap
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  // Close on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (e.target.closest('#menu') || e.target.closest('.hamb')) return;
    setOpen(false);
  });

  // Reset when leaving mobile breakpoint
  const onBreakChange = (ev) => { if (!ev.matches) setOpen(false); setNavHeight(); };
  if (mql.addEventListener) mql.addEventListener('change', onBreakChange);
  else mql.addListener(onBreakChange);

  // initial
  setNavHeight();
  // fonts/layout might change height after load; recheck shortly & on resize
  window.addEventListener('resize', setNavHeight);
  setTimeout(setNavHeight, 300);
})();

// =================== Products / Cards / Empty / Filters ====================
async function getProducts(){
  try{
    const res = await fetch('products.json', { cache: 'no-cache' });
    if(!res.ok) throw 0;
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }catch(e){
    return [];
  }
}

function cardTpl(p){
  const skuStr = p.sku ? String(p.sku) : '';
  const skuQS  = p.sku ? `&sku=${encodeURIComponent(skuStr)}` : '';
  const priceNum = (typeof p.price === 'number') ? p.price : Number(String(p.price||'').replace(/[^\d.,]/g,'').replace(/\./g, '').replace(',', '.')) || '';
  const itemId = p.sku ? `sku-${skuStr.replace(/[^\w-]/g,'')}` : '';

  return `
    <article class="card"
             id="${itemId}"
             data-cat="${p.cat || ''}"
             ${p.sku ? `data-sku="${skuStr}"` : ''}
             itemscope itemtype="https://schema.org/Product">
      <link itemprop="url" href="https://pantazis-euronics.gr/products.html${p.sku ? `?sku=${encodeURIComponent(skuStr)}` : ''}">
      <meta itemprop="sku" content="${skuStr}">
      ${p.brand ? `<meta itemprop="brand" content="${p.brand}">` : ''}

      <img src="${p.img}" width="1200" height="900" loading="lazy"
           alt="${p.alt || p.title || 'Προϊόν'}" itemprop="image" />

      <div class="p">
        <h3 itemprop="name">${p.title || 'Προϊόν'}</h3>
        ${p.meta ? `<div class="meta" itemprop="description">${p.meta}</div>` : ''}
        ${p.sku ? `<div class="sku muted">•${skuStr}</div>` : ''}

        <div class="price-wrap" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
          ${p.old ? `<span class="old"><s>${p.old}€</s></span>` : ''}
          ${priceNum !== '' ? `<meta itemprop="price" content="${priceNum}">` : ''}
          <span class="price"><b>${p.price ? `${p.price}€` : ''}</b></span>
          <meta itemprop="priceCurrency" content="EUR" />
          <link itemprop="availability" href="https://schema.org/InStoreOnly" />
          <meta itemprop="itemCondition" content="https://schema.org/NewCondition" />
          <link itemprop="seller" href="https://pantazis-euronics.gr/#store" />
        </div>

        <div class="buy">
          <a class="btn btn-primary"
             itemprop="url"
             href="contact.html?intent=order&title=${encodeURIComponent(p.title||'')}${skuQS}">
            Παραγγελία
          </a>
        </div>
      </div>
    </article>
  `;
}



function emptyTpl(){
  return `
    <article class="empty" aria-live="polite" style="text-align:center;padding:22px">
      <div class="empty-illustration" aria-hidden="true" style="max-width:240px;margin:0 auto 10px">
        <svg viewBox="0 0 120 120" role="img" xmlns="http://www.w3.org/2000/svg">
          <title>Καμία προσφορά διαθέσιμη</title>
          <circle cx="60" cy="60" r="56" fill="#F2F7FF" stroke="#BFD6FF" stroke-width="2"/>
          <g transform="translate(36,34)">
            <rect x="0" y="12" width="48" height="34" rx="6" fill="#E8F2FF" stroke="#9EC2FF"/>
            <path d="M6,12 C6,5 12,0 18,0 C24,0 28,5 30,9 C32,5 36,0 42,0 C48,0 54,5 54,12"
                  transform="translate(-6,0)" fill="none" stroke="#9EC2FF" stroke-width="2"/>
            <path d="M12,32 C14,36 20,38 24,38 C28,38 34,36 36,32" fill="none" stroke="#7FB2FF" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="26" r="2" fill="#7FB2FF"/>
            <circle cx="30" cy="26" r="2" fill="#7FB2FF"/>
          </g>
        </svg>
      </div>
      <h3>Δεν εντοπίστηκαν προσφορές</h3>
      <p>Δες ξανά αργότερα ή κάλεσέ μας στο <a href="tel:+302665409100">2665 409100</a>.</p>
    </article>
  `;
}

// διαθέσιμα και στο products.html (inline)
window.getProducts = getProducts;
window.cardTpl = cardTpl;
window.emptyTpl = emptyTpl;

// ====================== Homepage teaser (first 3) =======================
(async function homepageTeaser(){
  const wrap = document.getElementById('teaser');
  if(!wrap) return;
  try{
    const hpItems = await getProducts();
    if(!hpItems.length){ wrap.innerHTML = '<p class="muted">Σύντομα νέες προσφορές!</p>'; return; }
    wrap.innerHTML = hpItems.slice(0,3).map(cardTpl).join('');
  }catch(e){
    wrap.innerHTML = '<p class="muted">Σφάλμα φόρτωσης προσφορών.</p>';
  }
})();


// Sticky Call FAB toggle + a11y
(function(){
  const root = document.getElementById('sc');
  if(!root) return;
  const btn  = document.getElementById('sc-fab');
  const menu = document.getElementById('sc-menu');

  const setOpen = (open) => {
    root.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!root.classList.contains('open'));
  });

  // κλείσιμο με click έξω
  document.addEventListener('click', (e) => {
    if(root.classList.contains('open') && !root.contains(e.target)){ setOpen(false); }
  });

  // κλείσιμο με Esc
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ setOpen(false); }
  });
})();


// Hide Sticky Call when footer is visible
(function(){
  const fabWrap = document.getElementById('sc');      // <div id="sc" class="sticky-call">
  const footer  = document.querySelector('footer');
  if(!fabWrap || !footer || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries)=>{
    const footerOnScreen = entries[0]?.isIntersecting;
    fabWrap.classList.toggle('is-hidden', !!footerOnScreen);
    // αν θες να κλείνει και το μενού όταν κρύβεται:
    if (footerOnScreen) {
      fabWrap.classList.remove('open');
      const btn  = document.getElementById('sc-fab');
      const menu = document.getElementById('sc-menu');
      btn?.setAttribute('aria-expanded','false');
      menu?.setAttribute('aria-hidden','true');
    }
  }, { threshold: 0.05 }); // 5% ορατότητα footer αρκεί για να το κρύψει

  io.observe(footer);
})();



//billboard auto-slider
(function(){
  const bb = document.querySelector('.billboard');
  if(!bb) return;

  const slides = Array.from(bb.querySelectorAll('.slide'));
  if(slides.length < 2) return; // αν έχεις μόνο μία εικόνα, δεν κάνουμε κάτι

  const prevBtn = bb.querySelector('.bb-prev');
  const nextBtn = bb.querySelector('.bb-next');

  let i = 0, timer = null, intervalMs = 4500;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(n){
    i = (n + slides.length) % slides.length;
    slides.forEach((el, idx) => el.classList.toggle('active', idx === i));
  }

  function next(){ show(i + 1); }
  function prev(){ show(i - 1); }

  function start(){
    if (prefersReduced) return; // σεβόμαστε reduced motion
    stop();
    timer = setInterval(next, intervalMs);
  }
  function stop(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  // Auto-play
  start();

  // Παύση στο hover/focus για καλύτερη UX
  bb.addEventListener('mouseenter', stop);
  bb.addEventListener('mouseleave', start);
  bb.addEventListener('focusin', stop);
  bb.addEventListener('focusout', start);

  // Κουμπιά (αν υπάρχουν)
  if(prevBtn) prevBtn.addEventListener('click', () => { prev(); start(); });
  if(nextBtn) nextBtn.addEventListener('click', () => { next(); start(); });

  // Swipe σε κινητά (προαιρετικό, μίνι υλοποίηση)
  let touchX = null;
  bb.addEventListener('touchstart', (e)=>{ touchX = e.touches[0].clientX; }, {passive:true});
  bb.addEventListener('touchend',   (e)=>{
    if(touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if(Math.abs(dx) > 40) { dx > 0 ? prev() : next(); start(); }
    touchX = null;
  });
})();


//Copy paste
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;

  const id = btn.getAttribute('data-target');
  const el = document.getElementById(id);
  if (!el) return;

  const text = el.textContent.replace(/\s+/g, ' ').trim(); // καθαρό IBAN
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.innerHTML;
    // check icon
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
    btn.setAttribute('aria-label','Αντιγράφηκε');
    setTimeout(() => {
      btn.innerHTML = prev;
      btn.setAttribute('aria-label','Αντιγραφή IBAN');
    }, 1400);
  });
});

