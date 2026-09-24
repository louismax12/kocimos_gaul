/* ==========================================================================
   KOMSOS SMTB - INTERACTIVE FRONTEND APP LOGIC
   ========================================================================== */

const API_BASE = '/api/v1';

// State Management
const state = {
  cart: [],
  activePromo: null,
  activeTab: 'home'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadHomeContent();
  loadPortfolioContent();
  loadProducts();
  updateCartBadge();
});

// Navigation Handling
function setupNavigation() {
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-links a').forEach(l => {
    l.classList.remove('border-b-2', 'border-warm-gold', 'pb-1', 'font-semibold');
    l.classList.add('font-medium');
    if (l.getAttribute('data-tab') === tabId) {
      l.classList.add('border-b-2', 'border-warm-gold', 'pb-1', 'font-semibold');
      l.classList.remove('font-medium');
    }
  });

  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  const activeSection = document.getElementById(tabId);
  if (activeSection) activeSection.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fetch Portofolio & Katekese Content
async function loadPortfolioContent() {
  try {
    const res = await fetch(`${API_BASE}/contents`);
    const result = await res.json();
    
    if (result.success) {
      renderPortfolio(result.data);
      renderKatekese(result.data.filter(c => c.kategori === 'Artikel'));
    }
  } catch (err) {
    console.error('Failed to load portfolio:', err);
  }
}

// Fetch Products (Toko Rohani)
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const result = await res.json();

    if (result.success) {
      renderProducts(result.data);
    }
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

// Render Portfolio Cards
function renderPortfolio(items) {
  const container = document.getElementById('portfolio-grid');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <article class="group bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      <div class="p-5 flex flex-col justify-between flex-1">
        <div>
          <span class="inline-block px-2.5 py-1 bg-warm-gold/15 text-warm-gold text-xs font-bold rounded-md uppercase tracking-wider mb-2">${item.kategori}</span>
          <h3 class="text-lg font-bold text-slate-dark group-hover:text-warm-gold transition-colors">${item.judul}</h3>
          <p class="text-slate-primary text-sm mt-2 line-clamp-3">${item.deskripsi || ''}</p>
        </div>
        ${item.file_or_link_url ? `
          <div class="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between">
            <a href="${item.file_or_link_url}" target="_blank" class="inline-flex items-center gap-1 text-xs font-bold text-warm-gold hover:text-warm-gold-hover">
              <span>Buka Karya</span>
              <span class="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>
        ` : ''}
      </div>
    </article>
  `).join('');
}

// Render Katekese PDF Resources
function renderKatekese(items) {
  const container = document.getElementById('katekese-grid');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <article class="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm flex flex-col justify-between">
      <div>
        <span class="inline-block px-2.5 py-1 bg-status-success/10 text-status-success text-xs font-bold rounded-md uppercase tracking-wider mb-2">Modul PDF</span>
        <h3 class="text-lg font-bold text-slate-dark">${item.judul}</h3>
        <p class="text-slate-primary text-sm mt-2 line-clamp-3">${item.deskripsi || ''}</p>
      </div>
      <button onclick="downloadKatekeseResource('${item.judul}')" class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg h-10 bg-warm-gold hover:bg-warm-gold-hover text-on-primary text-xs font-bold transition-all shadow-sm">
        <span class="material-symbols-outlined text-sm">download</span>
        <span>Unduh Modul PDF</span>
      </button>
    </article>
  `).join('');
}

// Render E-Commerce Products
function renderProducts(products) {
  const container = document.getElementById('product-grid');
  if (!container) return;

  container.innerHTML = products.map(prod => `
    <article class="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm flex flex-col justify-between hover:border-warm-gold/40 transition-all">
      <div>
        <span class="inline-block px-2.5 py-1 ${prod.tipe_produk === 'Fisik' ? 'bg-warm-gold/15 text-warm-gold' : 'bg-sacred-blue-subtle text-secondary'} text-xs font-bold rounded-md uppercase tracking-wider mb-2">${prod.tipe_produk}</span>
        <h3 class="text-base font-bold text-slate-dark">${prod.nama_produk}</h3>
        <p class="text-slate-primary text-xs mt-1 line-clamp-2">${prod.deskripsi || ''}</p>
      </div>
      <div class="mt-4 pt-3 border-t border-border-subtle">
        <div class="text-lg font-black text-slate-dark mb-3">
          Rp ${parseFloat(prod.harga).toLocaleString('id-ID')}
        </div>
        <button onclick="addToCart(${prod.id}, '${prod.nama_produk}', ${prod.harga}, '${prod.tipe_produk}')" class="w-full inline-flex items-center justify-center gap-1.5 rounded-lg h-10 bg-slate-primary hover:bg-slate-dark text-on-primary text-xs font-semibold transition-all">
          <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
          <span>+ Keranjang</span>
        </button>
      </div>
    </article>
  `).join('');
}

// Cart Functionality
function addToCart(id, name, price, type) {
  const existing = state.cart.find(i => i.product_id === id);
  if (existing) {
    existing.kuantitas += 1;
  } else {
    state.cart.push({ product_id: id, nama_produk: name, harga: price, tipe_produk: type, kuantitas: 1 });
  }
  updateCartBadge();
  alert(`"${name}" telah ditambahkan ke keranjang belanja!`);
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.kuantitas, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.innerText = count;
}

// Open Checkout Modal
function openCartModal() {
  if (state.cart.length === 0) {
    alert('Keranjang belanja Anda masih kosong!');
    return;
  }
  renderCartModalItems();
  const modal = document.getElementById('cart-modal');
  modal.classList.remove('opacity-0', 'pointer-events-none');
}

function closeCartModal() {
  const modal = document.getElementById('cart-modal');
  modal.classList.add('opacity-0', 'pointer-events-none');
}

function renderCartModalItems() {
  const container = document.getElementById('cart-modal-items');
  let subtotal = 0;

  container.innerHTML = state.cart.map(item => {
    const itemTotal = item.harga * item.kuantitas;
    subtotal += itemTotal;
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div>
          <strong style="color: #fff;">${item.nama_produk}</strong>
          <div style="font-size: 0.85rem; color: #94a3b8;">${item.kuantitas} x Rp ${parseFloat(item.harga).toLocaleString('id-ID')}</div>
        </div>
        <div style="color: #38bdf8; font-weight: 600;">Rp ${itemTotal.toLocaleString('id-ID')}</div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
  calculateTotal();
}

// Check Promo Code
async function applyPromo() {
  const codeInput = document.getElementById('promo-code-input').value.trim();
  if (!codeInput) return alert('Masukkan kode promo terlebih dahulu.');

  const subtotal = state.cart.reduce((sum, i) => sum + (i.harga * i.kuantitas), 0);

  try {
    const res = await fetch(`${API_BASE}/cart/check-promo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kode_promo: codeInput, subtotal: subtotal })
    });
    const result = await res.json();

    if (result.success) {
      state.activePromo = result.data;
      document.getElementById('promo-message').innerHTML = `<span style="color: #34d399;">✓ ${result.message} Potongan: Rp ${result.data.total_potongan.toLocaleString('id-ID')}</span>`;
      calculateTotal();
    } else {
      state.activePromo = null;
      document.getElementById('promo-message').innerHTML = `<span style="color: #f87171;">✕ ${result.message}</span>`;
      calculateTotal();
    }
  } catch (err) {
    console.error('Error applying promo:', err);
  }
}

function calculateTotal() {
  const subtotal = state.cart.reduce((sum, i) => sum + (i.harga * i.kuantitas), 0);
  const discount = state.activePromo ? state.activePromo.total_potongan : 0;
  const grandTotal = Math.max(0, subtotal - discount);

  document.getElementById('cart-discount').innerText = `- Rp ${discount.toLocaleString('id-ID')}`;
  document.getElementById('cart-grandtotal').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
}

// Submit Checkout Order
async function submitCheckout(e) {
  e.preventDefault();

  const nama = document.getElementById('buyer-name').value;
  const wa = document.getElementById('buyer-wa').value;
  const alamat = document.getElementById('buyer-address').value;

  const payload = {
    nama_pembeli: nama,
    whatsapp_pembeli: wa,
    alamat_pengiriman: alamat,
    items: state.cart.map(i => ({ product_id: i.product_id, kuantitas: i.kuantitas })),
    promo_id: state.activePromo ? state.activePromo.promo_id : null
  };

  try {
    const res = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      alert(`Pesanan Berhasil Dibuat!\nInvoice: ${result.data.invoice_number}\nTotal: Rp ${result.data.total_bayar.toLocaleString('id-ID')}\nSnap Token: ${result.data.snap_token}`);
      
      // Auto trigger Payment Webhook for simulation demo
      await fetch(`${API_BASE}/payment/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_number: result.data.invoice_number, status_pembayaran: 'Paid' })
      });

      alert('Simulasi Pembayaran SUKSES (Paid)! Cek konsol backend untuk simulasi notifikasi WA & token download digital.');
      
      // Reset State
      state.cart = [];
      state.activePromo = null;
      updateCartBadge();
      closeCartModal();
    } else {
      alert(`Checkout Gagal: ${result.message}`);
    }
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Terjadi kesalahan saat memproses checkout.');
  }
}

function downloadKatekeseResource(title) {
  alert(`Mengunduh modul katekese: "${title}"... (Simulasi unduhan PDF gratis selesai)`);
}

function loadHomeContent() {}
