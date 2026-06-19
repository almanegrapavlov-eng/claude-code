// Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = menuToggle.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
});

function closeMenu() {
  mobileMenu.classList.remove('open');
  menuToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}

// Newsletter
function handleSubscribe(e) {
  e.preventDefault();
  const toast = document.getElementById('toast');
  e.target.reset();
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ---- CHECKOUT MODAL ----
let qty = 1;

function openModal(card) {
  const name = card.dataset.name;
  const price = card.dataset.price;
  const category = card.dataset.category;
  const bg = card.dataset.bg;

  document.getElementById('modalName').textContent = name;
  document.getElementById('modalPrice').textContent = price;
  document.getElementById('modalCategory').textContent = category;
  document.getElementById('modalImg').style.background = bg;

  qty = 1;
  document.getElementById('qtyDisplay').textContent = qty;

  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById('qtyDisplay').textContent = qty;
}

// Wire up Buy Now buttons
document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = btn.closest('.product-card');
    if (card && card.dataset.name) openModal(card);
  });
});

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .collection-card, .stat').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
