// Footer year
document.getElementById('y') && (document.getElementById('y').textContent = new Date().getFullYear());

// Mobile menu
const hamb = document.querySelector('.hamb');
const menu = document.getElementById('menu');
hamb?.addEventListener('click', () => {
  const opened = menu.classList.toggle('open');
  hamb.setAttribute('aria-expanded', opened ? 'true' : 'false');
});

// --- Fetch products with graceful empty fallback ---
async function getProducts(){
  try{
    const res = await fetch('products.json', { cache: 'no-cache' });
    if(!res.ok) throw new Error('no file');
    const data = await res.json();
    // Ensure array
    return Array.isArray(data) ? data : [];
  }catch(e){
    // No products available (by choice or by error)
    return [];
  }
}

function cardTpl(p){
  return `
    <article class="card" data-cat="${p.cat}">
      <img src="${p.img}" width="1200" height="900" loading="lazy" alt="${p.alt || p.title}" />
      <div class="p">
        <h3>${p.title}</h3>
        ${p.meta ? `<div class="meta">${p.meta}</div>` : ''}
        <p class="price">${p.old ? `<s>${p.old}€</s>` : ''} <b>${p.price}€</b></p>
        <div class="buy">
          <a class="btn btn-ghost" href="#contact">Ρώτησε διαθεσιμότητα</a>
          <a class="btn btn-primary" href="tel:+302662025000">Τηλεφωνική παραγγελία</a>
        </div>
      </div>
    </article>`;
}

function emptyTpl(){
  // Cheerful inline SVG, no external asset needed
  return `
    <article class="empty" aria-live="polite">
      <div class="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 120 120" role="img" xmlns="http://www.w3.org/2000/svg">
          <title>Καμία προσφορά διαθέσιμη</title>
          <circle cx="60" cy="60" r="56" fill="#F2F7FF" stroke="#BFD6FF" stroke-width="2"/>
          <g transform="translate(36,34)">
            <rect x="0" y="12" width="48" height="34" rx="6" fill="#E8F2FF" stroke="#9EC2FF"/>
            <path d="M6,12 C6,5 12,0 18,0 C24,0 28,5 30,9 C32,5 36,0 42,0 C48,0 54,5 54,12" 
                  transform="translate(-6,0)" fill="none" stroke="#9EC2FF" stroke-width="2"/>
            <!-- smile -->
            <path d="M12,32 C14,36 20,38 24,38 C28,38 34,36 36,32" fill="none" stroke="#7FB2FF" stroke-width="2" stroke-linecap="round"/>
            <!-- eyes -->
            <circle cx="18" cy="26" r="2" fill="#7FB2FF"/>
            <circle cx="30" cy="26" r="2" fill="#7FB2FF"/>
          </g>
        </svg>
      </div>
      <h3>Δεν εντοπίστηκαν προσφορές</h3>
      <p>Ρίξε μια ματιά αργότερα ή κάλεσέ μας στο <a href="tel:+302662025000">26620 25000</a>.</p>
    </article>
  `;
}

const grid = document.getElementById('grid');
const chips = document.querySelectorAll('.chip');
let items = [];

async function render(){
  const data = await getProducts();
  if(!data || data.length === 0){
    grid.innerHTML = emptyTpl();
    items = [];
    return;
  }
  grid.innerHTML = data.map(cardTpl).join('');
  items = [...grid.querySelectorAll('.card')];
}

render();

// Filtering (no-op when empty state is shown)
chips.forEach(ch => ch.addEventListener('click', () => {
  chips.forEach(c => c.classList.remove('active'));
  ch.classList.add('active');
  const f = ch.dataset.filter;
  if(items.length === 0) return;
  items.forEach(it => {
    it.style.display = (f === 'all' || it.dataset.cat === f) ? '' : 'none';
  });
}));
