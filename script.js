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
  const skuQS = p.sku ? `&sku=${encodeURIComponent(p.sku)}` : '';
  return `
    <article class="card" data-cat="${p.cat || ''}" ${p.sku ? `data-sku="${p.sku}"` : ''}>
      <img src="${p.img}" width="1200" height="900" loading="lazy" alt="${p.alt || p.title || 'Προϊόν'}" />
      <div class="p">
        <h3>${p.title || 'Προϊόν'}</h3>
        ${p.meta ? `<div class="meta">${p.meta}</div>` : ''}
        ${p.sku ? `<div class="sku muted">•${p.sku}</div>` : ''}
        <p class="price">${p.old ? `<s>${p.old}€</s>` : ''} <b>${p.price ? `${p.price}€` : ''}</b></p>
        <div class="buy">
          <a class="btn btn-primary"
             href="contact.html?intent=order&title=${encodeURIComponent(p.title||'')}${skuQS}">
            Παραγγελία
          </a>
        </div>
      </div>
    </article>`;
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

// Products page bootstrap (safe on pages without grid/chips)
// ————— Products page bootstrap (sort + pagination + URL params + SUBCATS) —————
(function () {
  const $  = (s,o=document)=>o.querySelector(s);
  const $$ = (s,o=document)=>[...o.querySelectorAll(s)];

  // DOM refs
  const grid        = $('#grid');
  const chipsWrap   = $('#chips');
  const searchInput = $('#search');
  const meta        = $('#meta');

  // === Labels (κύριες κατηγορίες) ===
  const CAT_LABELS = {
    av: 'Εικόνα & Ήχος',
    imaging: 'Φωτογραφία & Video',
    computing: 'Υπολογιστές',
    telephony: 'Τηλεφωνία',
    gaming: 'Gaming',
    climate: 'Κλιματισμός & Θέρμανση',
    appliances: 'Λευκές Συσκευές',
    home: 'Οικιακός Εξοπλισμός',
    personal: 'Προσωπική Φροντίδα'
  };

  // === Υποκατηγορίες ανά κατηγορία (slug, label) ===
  const SUB_MAP = {
    av:         [['tv','TV'], ['av-peripherals','Περιφερειακά']],
    imaging:    [['cameras','Φωτογραφικές μηχανές'], ['imaging-acc','Αξεσουάρ']],
    computing:  [['laptop','Laptops'], ['desktop','Desktop'], ['pc-peripherals','Περιφερειακά']],
    telephony:  [['mobile','Κινητή'], ['fixed','Σταθερή'], ['wearables','Wearables']],
    gaming:     [['pc','PC'], ['console','Console'], ['gaming-peripherals','Περιφερειακά']],
    climate:    [['ac','Air condition'], ['air-care','Ιονιστές/Υγραντήρες/Καθαριστές αέρα'], ['fans','Ανεμιστήρες'], ['dehumid','Αφυγραντήρες']],
    appliances: [['fridge','Ψυγεία'], ['wash-dry','Πλυντήρια/Στεγνωτήρια'], ['cooktops','Κουζινάκια'], ['microwave','Φουρνάκια μικροκυμάτων'], ['cookers','Κουζίνες']],
    home:       [['vacuum','Σκούπες'], ['ironing','Σιδερώματος'], ['beverages','Ροφημάτων'], ['sewing','Ραπτομηχανές']],
    personal:   [['women','Γυναικεία'], ['men','Ανδρική'], ['kids','Παιδική'], ['wellness','Υγεία & Ευεξία']]
  };

  // Στήσε container για υπο-chips ακριβώς κάτω από τα κύρια chips
  let subWrap = $('#subchips');
  if (!subWrap) {
    subWrap = document.createElement('div');
    subWrap.id = 'subchips';
    subWrap.className = 'chips subchips';
    subWrap.style.display = 'none';
    chipsWrap?.after(subWrap);
  }

  // Create / get SORT select
  let sortSel = $('#sort');
  (function ensureSortControl(){
    if (!sortSel) {
      const controls = searchInput?.closest('.controls') || chipsWrap?.parentElement || document.body;
      const wrap = document.createElement('div');
      wrap.className = 'control-inline';

      const label = document.createElement('label');
      label.className = 'sr-only';
      label.htmlFor = 'sort';
      label.textContent = 'Ταξινόμηση';

      sortSel = document.createElement('select');
      sortSel.id = 'sort';
      sortSel.setAttribute('aria-label','Ταξινόμηση');
      sortSel.innerHTML = `
        <option value="reco">Προτεινόμενα</option>
        <option value="price_asc">Τιμή ↑</option>
        <option value="price_desc">Τιμή ↓</option>
        <option value="alpha">Αλφαβητικά Α–Ω</option>
      `;

      if (chipsWrap && controls) { wrap.append(label, sortSel); controls.insertBefore(wrap, chipsWrap); }
      else { wrap.append(label, sortSel); controls.appendChild(wrap); }
    }
  })();

  // Create / get PAGER
  let pager = $('#pager');
  (function ensurePager(){
    if (!pager) {
      pager = document.createElement('nav');
      pager.id = 'pager';
      pager.className = 'pager';
      pager.setAttribute('aria-label','Πλοήγηση σελίδων');
      grid?.after(pager);
    }
  })();

  // State
  let ALL = [];
  let VIEW = [];
  let activeCat = 'all';
  let activeSub = 'all';
  let q = '';
  let page = 1;
  const PAGE_SIZE = 12; //TODO

  // Data
  async function fetchProducts(){
    if (typeof window.getProducts === 'function') { try { return await window.getProducts(); } catch(_) {} }
    try {
      const res = await fetch('products.json', { cache: 'no-cache' });
      if (!res.ok) throw 0;
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }

  // Utils
  const esc = s => String(s==null?'' : s)
    .replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const money = v => {
    if (v==null || v==='') return '';
    const n = Number(String(v).replace(/[^\d.,]/g,'').replace(/\./g,'').replace(',', '.'));
    if (!isFinite(n)) return esc(v);
    return new Intl.NumberFormat('el-GR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);
  };

  const num = v => {
    const n = Number(String(v ?? '').replace(/[^\d.,]/g,'').replace(/\./g,'').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  function sortList(list){
    if (!sortSel) return list;
    switch (sortSel.value) {
      case 'price_asc':  return list.sort((a,b)=> num(a.price) - num(b.price));
      case 'price_desc': return list.sort((a,b)=> num(b.price) - num(a.price));
      case 'alpha':      return list.sort((a,b)=> String(a.title||'').localeCompare(String(b.title||''), 'el'));
      default:           return list; // "reco"
    }
  }

  function fallbackCardTpl(p){
    const old = p.old ? `<span class="old">${money(p.old)}</span>` : '';
    const meta = p.meta ? `<p class="meta">${esc(p.meta)}</p>` : '';
    const imgAlt = esc(p.alt || p.title || 'Προϊόν');
    return `
      <article class="card" data-cat="${esc(p.cat||'')}" data-sub="${esc(p.sku||'')}">
        <img src="${esc(p.img||'images/placeholder.jpg')}" alt="${imgAlt}" loading="lazy" width="800" height="600" />
        <div class="card-body">
          <h3 class="card-title">${esc(p.title||'Χωρίς τίτλο')}</h3>
          ${meta}
          <div class="price-row">${old}<span class="price">${money(p.price)}</span></div>
          ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
        </div>
      </article>`;
  }

  function getCatLabel(code){ return CAT_LABELS[code] || code; }
  function getSubLabel(cat, sub){
    const pair = (SUB_MAP[cat] || []).find(([slug]) => slug === sub);
    return pair ? pair[1] : sub;
  }

  // ——— UI: κύριες κατηγορίες
  function buildChips(categories){
    if (!chipsWrap) return;
    chipsWrap.innerHTML = '';
    const cats = ['all', ...categories];
    for (const c of cats){
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.setAttribute('role','tab');
      btn.dataset.filter = c;
      btn.textContent = (c==='all' ? 'Όλα' : getCatLabel(c));
      btn.addEventListener('click', ()=>{
        $$('.chip', chipsWrap).forEach(x=>x.classList.toggle('active', x===btn));
        activeCat = c;
        activeSub = 'all';
        page = 1;
        buildSubchips(c);   // εμφανίζει/κρύβει υποκατηγορίες
        render();
        updateURL();
      });
      chipsWrap.appendChild(btn);
    }
    const toActivate = chipsWrap.querySelector(`.chip[data-filter="${CSS.escape(activeCat)}"]`) || chipsWrap.querySelector('.chip');
    toActivate?.click();
  }

  // ——— UI: υποκατηγορίες
  function buildSubchips(cat){
    if (!subWrap) return;
    subWrap.innerHTML = '';
    const sub = SUB_MAP[cat] || [];
    if (!sub.length || cat==='all'){
      subWrap.style.display = 'none';
      return;
    }
    // "Όλες"
    const allBtn = document.createElement('button');
    allBtn.className = 'chip';
    allBtn.dataset.sub = 'all';
    allBtn.textContent = 'Όλες';
    allBtn.addEventListener('click', ()=>{
      $$('.chip', subWrap).forEach(x=>x.classList.toggle('active', x===allBtn));
      activeSub = 'all'; page = 1; render(); updateURL();
    });
    subWrap.appendChild(allBtn);

    // οι υπόλοιπες
    sub.forEach(([slug,label])=>{
      const b = document.createElement('button');
      b.className = 'chip';
      b.dataset.sub = slug;
      b.textContent = label;
      b.addEventListener('click', ()=>{
        $$('.chip', subWrap).forEach(x=>x.classList.toggle('active', x===b));
        activeSub = slug; page = 1; render(); updateURL();
      });
      subWrap.appendChild(b);
    });

    // αρχική επιλογή
    [...subWrap.querySelectorAll('.chip')].forEach(x=>x.classList.remove('active'));
    const def = subWrap.querySelector(`.chip[data-sub="${CSS.escape(activeSub)}"]`) || allBtn;
    def.classList.add('active');

    subWrap.style.display = '';
  }

  function updateURL(){
    const params = new URLSearchParams(location.search);
    if (activeCat && activeCat!=='all') params.set('cat', activeCat); else params.delete('cat');
    if (activeSub && activeSub!=='all') params.set('sub', activeSub); else params.delete('sub');
    if (q) params.set('q', q); else params.delete('q');
    if (sortSel && sortSel.value && sortSel.value !== 'reco') params.set('sort', sortSel.value); else params.delete('sort');
    if (page && page > 1) params.set('page', String(page)); else params.delete('page');
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function render(){
    if (!grid) return;

    // Φίλτρο cat + sub (sku)
    let list = ALL.filter(p=>{
      const catOk = (activeCat==='all') || String(p.cat).toLowerCase() === activeCat.toLowerCase();
      if (!catOk) return false;
      const subOk = (activeSub==='all') || String(p.sku||'').toLowerCase() === activeSub.toLowerCase();
      if (!subOk) return false;
      if (!q) return true;
      const hay = [p.title, p.meta, p.cat, p.brand, p.sku].map(x=>String(x||'').toLowerCase()).join(' ');
      return hay.includes(q.toLowerCase());
    });

    list = sortList([...list]);

    // Σελιδοποίηση
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(Math.max(1, page), pages);
    const start = (page - 1) * PAGE_SIZE;
    const subset = list.slice(start, start + PAGE_SIZE);
    VIEW = subset;

    const tpl = (typeof window.cardTpl === 'function') ? window.cardTpl : fallbackCardTpl;
    grid.setAttribute('aria-busy','true');
    grid.innerHTML = subset.map(tpl).join('') || '<p class="muted">Δεν βρέθηκαν προϊόντα με αυτά τα φίλτρα.</p>';
    grid.removeAttribute('aria-busy');

    // meta
    if (meta) {
      const metaText = [];
      metaText.push(total === 1 ? '1 προϊόν' : `${total} προϊόντα`);
      if (activeCat && activeCat!=='all') metaText.push(`• Κατηγορία: ${getCatLabel(activeCat)}`);
      if (activeSub && activeSub!=='all') metaText.push(`• Υποκατηγορία: ${getSubLabel(activeCat, activeSub)}`);
      if (q) metaText.push(`• Αναζήτηση: “${q}”`);
      meta.textContent = metaText.join(' ');
    }

    renderPager(total, pages);
  }

  function renderPager(total, pages){
    if (!pager) return;
    pager.innerHTML = '';

    const prev = document.createElement('button');
    prev.textContent = '‹ Προηγούμενη';
    prev.disabled = page <= 1;
    prev.addEventListener('click', ()=>{ page = Math.max(1, page - 1); render(); updateURL(); });

    const info = document.createElement('span');
    info.className = 'pageinfo';
    info.textContent = `Σελίδα ${page} από ${pages}`;

    const next = document.createElement('button');
    next.textContent = 'Επόμενη ›';
    next.disabled = page >= pages;
    next.addEventListener('click', ()=>{ page = Math.min(pages, page + 1); render(); updateURL(); });

    pager.append(prev, info, next);
  }

  function initFromURL(){
    const params = new URLSearchParams(location.search);
    activeCat = params.get('cat') || 'all';
    activeSub = params.get('sub') || 'all';
    q = params.get('q') || '';
    if (q && searchInput) searchInput.value = q;
    const sort = params.get('sort');
    if (sort && sortSel) sortSel.value = sort;
    const p = parseInt(params.get('page')||'1', 10);
    page = Number.isFinite(p) && p > 0 ? p : 1;
  }

  // Start
  (async function(){
    initFromURL();
    ALL = await fetchProducts();

    // Κατηγορίες από τα δεδομένα (ώστε να εμφανίζονται μόνο όσες υπάρχουν)
    const cats = [...new Set(ALL.map(p => String(p.cat||'').trim()).filter(Boolean))];
    buildChips(cats);

    // Search
    searchInput?.addEventListener('input', (e)=>{
      q = e.target.value.trim();
      page = 1;
      render();
      updateURL();
    });

    // Sorting
    sortSel?.addEventListener('change', ()=>{
      page = 1;
      render();
      updateURL();
    });

    // First render
    render();
  })();
})();


// ================= Searchbar helper (clear + "/" focus + Esc) =================
(() => {
  const input = document.getElementById('search');
  if (!input) return;
  const clear = document.getElementById('clearSearch');
  const wrap  = input.closest('.searchbar');

  function sync(){ wrap?.classList.toggle('has-value', !!input.value.trim()); }
  input.addEventListener('input', sync);
  clear?.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.focus();
  });
  document.addEventListener('keydown', (e) => {
    const el = document.activeElement;
    const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    if (!typing && e.key === '/') { e.preventDefault(); input.focus(); }
    else if (typing && e.key === 'Escape' && el === input) {
      if (input.value) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles:true })); }
      else { input.blur(); }
    }
  });
  sync();
})();


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
