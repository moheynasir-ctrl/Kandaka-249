// Storefront configuration. Replace these sample products and contact details before publishing.
// A public WhatsApp number can be written with country code and digits only (example: 201XXXXXXXXX).
const STORE_CONFIG = {
  whatsappNumber: '', // Set the shop's WhatsApp number, e.g. '201012345678'
  currency: 'ج.م',
};

// Illustrative catalog and prices for the first visual prototype; replace with the shop's real inventory.
const PRODUCTS = [
  { id: 'thobe-nile', name: 'ثوب نسمة النيل', category: 'ثياب', price: 1850, color: 'عنابي · مقاس موحّد', image: 'assets/thobe-wine.svg', tag: 'اختيارنا' },
  { id: 'thobe-sand', name: 'ثوب خيوط النخيل', category: 'ثياب', price: 2100, color: 'رملي · مقاس موحّد', image: 'assets/thobe-sand.svg', tag: 'جديد' },
  { id: 'jellabiya-olive', name: 'جلابية يوم هادي', category: 'جلابيات', price: 1650, color: 'زيتي · S–XL', image: 'assets/jellabiya-olive.svg', tag: '' },
  { id: 'scarf-blue', name: 'طرحة لمسة نيلية', category: 'إكسسوارات', price: 480, color: 'أزرق نيلي · خفيفة', image: 'assets/scarf-blue.svg', tag: '' },
];

const $ = (selector) => document.querySelector(selector);
const grid = $('#product-grid');
const cart = loadCart();
let categoryFilter = 'الكل';
let toastTimer;

function loadCart() {
  try { return JSON.parse(localStorage.getItem('tawazun-cart') || '{}'); }
  catch { return {}; }
}
function saveCart() { localStorage.setItem('tawazun-cart', JSON.stringify(cart)); updateCart(); }
function formatPrice(value) { return `${new Intl.NumberFormat('ar-EG').format(value)} ${STORE_CONFIG.currency}`; }
function productById(id) { return PRODUCTS.find((product) => product.id === id); }

function renderProducts() {
  const search = $('#search').value.trim().toLocaleLowerCase('ar');
  const shown = PRODUCTS.filter((product) => (categoryFilter === 'الكل' || product.category === categoryFilter) && `${product.name} ${product.category} ${product.color}`.toLocaleLowerCase('ar').includes(search));
  grid.innerHTML = shown.length ? shown.map((product) => `
    <article class="product-card">
      <div class="product-image">
        ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <button class="quick-add" type="button" data-add="${product.id}" aria-label="أضيفي ${product.name} إلى السلة">أضيفي للسلة ＋</button>
      </div>
      <div class="product-info"><h3 class="product-name">${product.name}</h3><div class="product-meta"><span>${product.color}</span><strong class="product-price">${formatPrice(product.price)}</strong></div></div>
    </article>`).join('') : '<p class="empty-results">ما لقينا قطعة بهذا الاسم. جربي كلمة تانية.</p>';
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  showToast('أضفنا القطعة لسلتك');
}
function updateCart() {
  const entries = Object.entries(cart).filter(([id, quantity]) => productById(id) && quantity > 0);
  const count = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const total = entries.reduce((sum, [id, quantity]) => sum + productById(id).price * quantity, 0);
  $('#cart-count').textContent = count;
  $('#cart-total').textContent = formatPrice(total);
  $('#cart-items').innerHTML = entries.map(([id, quantity]) => {
    const product = productById(id);
    return `<article class="cart-line"><img src="${product.image}" alt=""><div><h3>${product.name}</h3><p>${formatPrice(product.price)}</p><div class="qty-controls"><button type="button" data-qty="-1" data-id="${id}" aria-label="تقليل الكمية">−</button><span>${quantity}</span><button type="button" data-qty="1" data-id="${id}" aria-label="زيادة الكمية">＋</button></div></div><button class="remove-item" type="button" data-remove="${id}">حذف</button></article>`;
  }).join('');
  $('#cart-empty').hidden = entries.length > 0;
  $('#cart-bottom').hidden = entries.length === 0;
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function openCart() {
  $('#overlay').hidden = false;
  $('#cart-panel').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#close-cart').focus();
}
function closeCart() {
  $('#overlay').hidden = true;
  $('#cart-panel').hidden = true;
  document.body.style.overflow = '';
}

$('#year').textContent = new Date().getFullYear();
renderProducts();
updateCart();
$('#search').addEventListener('input', renderProducts);
$('.filter-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  categoryFilter = button.dataset.category;
  document.querySelectorAll('.filter').forEach((filter) => filter.classList.toggle('active', filter === button));
  renderProducts();
});
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (button) addToCart(button.dataset.add);
});
$('#cart-items').addEventListener('click', (event) => {
  const qtyButton = event.target.closest('[data-qty]');
  const removeButton = event.target.closest('[data-remove]');
  if (qtyButton) {
    const id = qtyButton.dataset.id;
    cart[id] = (cart[id] || 0) + Number(qtyButton.dataset.qty);
    if (cart[id] <= 0) delete cart[id];
    saveCart();
  }
  if (removeButton) { delete cart[removeButton.dataset.remove]; saveCart(); }
});
$('#open-cart').addEventListener('click', openCart);
$('#close-cart').addEventListener('click', closeCart);
$('#overlay').addEventListener('click', closeCart);
$('#continue-shopping').addEventListener('click', () => { closeCart(); $('#collection').scrollIntoView({ behavior: 'smooth' }); });
$('#checkout-button').addEventListener('click', () => {
  closeCart();
  $('#checkout-dialog').showModal();
});
$('#close-checkout').addEventListener('click', () => $('#checkout-dialog').close());
$('#checkout-dialog').addEventListener('click', (event) => { if (event.target === $('#checkout-dialog')) $('#checkout-dialog').close(); });
$('#checkout-form').elements.payment.addEventListener('change', (event) => {
  $('#checkout-hint').textContent = event.target.value === 'online'
    ? 'الدفع الإلكتروني غير مفعّل بعد. نحتاج إعداد حساب بوابة دفع للمحل وربطه بخادم آمن قبل استقبال مدفوعات حقيقية.'
    : 'سيُرسل طلبك إلى واتساب لتأكيد التوفر ورسوم التوصيل. لا يتم خصم أي مبلغ الآن.';
  $('#place-order').innerHTML = event.target.value === 'online' ? 'متابعة للدفع <span>←</span>' : 'تأكيد الطلب <span>←</span>';
});
$('#checkout-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (form.get('payment') === 'online') {
    showToast('الدفع الإلكتروني يحتاج ربط بوابة دفع آمنة أولًا');
    return;
  }
  if (!STORE_CONFIG.whatsappNumber) {
    showToast('أضيفي رقم واتساب المحل في إعدادات التطبيق لتفعيل الطلب');
    return;
  }
  const lines = Object.entries(cart).filter(([id, quantity]) => productById(id) && quantity > 0);
  if (!lines.length) {
    $('#checkout-dialog').close(); showToast('السلة فارغة'); return;
  }
  const items = lines.map(([id, quantity]) => {
    const product = productById(id);
    return `• ${product.name} × ${quantity} — ${formatPrice(product.price * quantity)}`;
  }).join('\n');
  const total = lines.reduce((sum, [id, quantity]) => sum + productById(id).price * quantity, 0);
  const message = `مرحبًا توازن، أريد تأكيد هذا الطلب:\n\n${items}\n\nالمجموع التقديري: ${formatPrice(total)} (قبل التوصيل)\n\nالاسم: ${form.get('name')}\nرقم الهاتف: ${form.get('phone')}\nالعنوان: ${form.get('address')}\nطريقة الدفع: عند الاستلام`;
  window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});
