// Nav scroll effect
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
  const spans = menuToggle.querySelectorAll('span');
  spans[0].style.transform = '';
  spans[1].style.opacity = '';
  spans[2].style.transform = '';
}

// Newsletter toast
function handleSubscribe(e) {
  e.preventDefault();
  const toast = document.getElementById('toast');
  e.target.reset();
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Quick Add buttons
document.querySelectorAll('.product-card__overlay .btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const count = document.querySelector('.nav__cart-count');
    const current = parseInt(count.textContent);
    count.textContent = current + 1;
    count.style.transform = 'scale(1.5)';
    setTimeout(() => count.style.transform = '', 300);
  });
});

// Entrance animations on scroll
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
