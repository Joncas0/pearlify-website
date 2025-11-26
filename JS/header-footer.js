// header-footer.js

// Load header
fetch('header.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('header').innerHTML = data;

    // Highlight active nav link
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll('.main-nav a').forEach(link => {
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
      }
    });

    // Update cart count after header loads
    updateCartCount();
  });

// Load footer
fetch('footer.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer').innerHTML = data;
  });

// Update cart count function
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

// Ensure cart count updates on page load
document.addEventListener("DOMContentLoaded", updateCartCount);
