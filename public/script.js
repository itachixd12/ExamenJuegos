const API = 'https://www.cheapshark.com/api/1.0';
const pageSize = 15;
let page = 0;
let currentQuery = '';
let currentStore = '';
let currentSort = '';
let totalPages = 0;

const gamesGrid = document.getElementById('gamesGrid');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const storeSelect = document.getElementById('storeSelect');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbers = document.getElementById('pageNumbers');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');

async function fetchStores() {
  try {
    const res = await fetch(`${API}/stores`);
    const stores = await res.json();
    stores.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.storeID;
      opt.textContent = s.storeName;
      storeSelect.appendChild(opt);
    });
  } catch (err) {
    console.warn('No se pudieron cargar las tiendas', err);
  }
}

function showLoading(show = true) {
  loadingEl.classList.toggle('hidden', !show);
}

function showError(show = true, msg = 'Error al cargar los datos.') {
  errorEl.textContent = msg;
  errorEl.classList.toggle('hidden', !show);
}

function clearGrid() {
  gamesGrid.innerHTML = '';
}

function createGameCard(deal) {
  const card = document.createElement('article');
  card.className = 'game-card';
  
  const discount = Math.round(parseFloat(deal.savings) || 0);
  
  card.innerHTML = `
    <div class="game-img-wrapper">
      <img src="${deal.thumb || ''}" alt="${deal.title}" class="game-img" />
      ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
    </div>
    <div class="game-info">
      <h3 class="game-title">${deal.title}</h3>
      <div class="game-prices">
        <div class="game-price-row">
          <span class="price-label">Precio normal:</span>
          <span class="price-normal">$${parseFloat(deal.normalPrice).toFixed(2)}</span>
        </div>
        <div class="game-price-row">
          <span class="price-label">Oferta:</span>
          <span class="price-sale">$${parseFloat(deal.salePrice).toFixed(2)}</span>
        </div>
      </div>
      <button class="view-detail-btn">Ver detalle</button>
    </div>
  `;
  
  card.querySelector('.view-detail-btn').addEventListener('click', () => openModal(deal));
  return card;
}

function appendDeals(deals) {
  deals.forEach(d => {
    const card = createGameCard(d);
    gamesGrid.appendChild(card);
  });
}

async function fetchDeals({ reset = false } = {}) {
  if (reset) {
    page = 0;
    clearGrid();
  }
  showError(false);
  showLoading(true);
  
  try {
    const params = new URLSearchParams();
    params.set('pageSize', pageSize);
    params.set('pageNumber', page);
    if (currentStore) params.set('storeID', currentStore);
    
    const res = await fetch(`${API}/deals?${params.toString()}`);
    const deals = await res.json();
    
    let filtered = deals;
    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      filtered = deals.filter(d => d.title && d.title.toLowerCase().includes(q));
    }
    
    if (currentSort) {
      const desc = currentSort.startsWith('-');
      const key = desc ? currentSort.slice(1) : currentSort;
      filtered.sort((a, b) => {
        const av = parseFloat(a[key]) || 0;
        const bv = parseFloat(b[key]) || 0;
        return desc ? bv - av : av - bv;
      });
    }
    
    appendDeals(filtered);
    showLoading(false);
    page += 1;
  } catch (err) {
    showLoading(false);
    showError(true, 'La API no respondió. Intenta de nuevo.');
    console.error(err);
  }
}

function openModal(deal) {
  const discount = Math.round(parseFloat(deal.savings) || 0);
  
  modalContent.innerHTML = `
    <img src="${deal.thumb || ''}" alt="${deal.title}" class="modal-image" />
    <h2 class="modal-title">${deal.title}</h2>
    <div class="modal-prices">
      <div class="modal-price-item">
        <div class="modal-price-label">Precio Normal</div>
        <div class="modal-price-value">$${parseFloat(deal.normalPrice).toFixed(2)}</div>
      </div>
      <div class="modal-price-item">
        <div class="modal-price-label">Precio Oferta</div>
        <div class="modal-price-value">$${parseFloat(deal.salePrice).toFixed(2)}</div>
      </div>
    </div>
    ${discount > 0 ? `<div class="modal-discount">Descuento: -${discount}%</div>` : ''}
    <a target="_blank" rel="noopener" href="https://www.cheapshark.com/redirect?dealID=${deal.dealID}" class="modal-store-link">
      Ir a la tienda
    </a>
  `;
  modal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

searchBtn.addEventListener('click', () => {
  currentQuery = searchInput.value.trim();
  fetchDeals({ reset: true });
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    currentQuery = searchInput.value.trim();
    fetchDeals({ reset: true });
  }
});

storeSelect.addEventListener('change', (e) => {
  currentStore = e.target.value;
  fetchDeals({ reset: true });
});

sortSelect.addEventListener('change', (e) => {
  currentSort = e.target.value;
  fetchDeals({ reset: true });
});

loadMoreBtn.addEventListener('click', () => {
  fetchDeals({ reset: false });
});

(async function init() {
  await fetchStores();
  await fetchDeals({ reset: true });
})();
