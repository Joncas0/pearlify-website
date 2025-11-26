// cart.js

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});

const MAX_QUANTITY_PER_PRODUCT = 10;
const MAX_TOTAL_ITEMS = 20;

function loadCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItems = document.getElementById("cart-items");
  const emptyCart = document.getElementById("empty-cart");
  const cartTotal = document.getElementById("cart-total");

  if (!cartItems || !cartTotal) {
    console.error("Missing cart elements in HTML!");
    return;
  }

  if (cart.length === 0) {
    cartItems.innerHTML = "";
    emptyCart.style.display = "block";
    cartTotal.textContent = "₱0";
    return;
  }

  emptyCart.style.display = "none";
  cartItems.innerHTML = "";

  let total = 0;
  let totalItems = 0;

  cart.forEach((item, index) => {
    const quantity = item.qty || item.quantity || 1;
    const price = item.totalPrice || item.price || item.basePrice || 0;
    const itemTotal = price * quantity;
    total += itemTotal;
    totalItems += quantity;

    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");

    // Check if this product is at max quantity
    const isMaxQuantity = quantity >= MAX_QUANTITY_PER_PRODUCT;
    
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-info">
        <h3>${item.name}</h3>
        <p><strong>Size:</strong> ${item.size || "N/A"}</p>
        <p><strong>Sweetness:</strong> ${item.sugar || "N/A"}</p>
        <p><strong>Add-ons:</strong> ${item.addons?.length ? item.addons.join(", ") : "None"}</p>
        ${isMaxQuantity ? '<p class="quantity-warning">Maximum quantity (10) reached for this product</p>' : ''}
      </div>
      <div class="cart-actions">
        <p>₱${itemTotal.toLocaleString()}</p>
        <div class="quantity-controls">
          <button class="qty-btn" onclick="decreaseQuantity(${index})">-</button>
          <span class="quantity ${isMaxQuantity ? 'max-quantity' : ''}">${quantity}</span>
          <button class="qty-btn ${isMaxQuantity ? 'disabled-btn' : ''}" 
                  onclick="increaseQuantity(${index})" 
                  ${isMaxQuantity ? 'disabled' : ''}>+</button>
        </div>
        <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });

  cartTotal.textContent = `₱${total.toLocaleString()}`;
  updateCartCount();

  // Check total items limit and show warning
  const totalItemsWarning = document.getElementById('total-items-warning');
  if (totalItems > MAX_TOTAL_ITEMS) {
    if (!totalItemsWarning) {
      const warning = document.createElement('div');
      warning.id = 'total-items-warning';
      warning.className = 'total-warning';
      warning.innerHTML = `⚠️ Maximum order limit reached! You can only order ${MAX_TOTAL_ITEMS} items total. Please reduce your quantity.`;
      cartItems.parentNode.insertBefore(warning, cartItems);
    }
  } else if (totalItemsWarning) {
    totalItemsWarning.remove();
  }

  // Update checkout button state
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    if (totalItems > MAX_TOTAL_ITEMS) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.6';
      checkoutBtn.style.cursor = 'not-allowed';
    } else {
      checkoutBtn.disabled = false;
      checkoutBtn.style.opacity = '1';
      checkoutBtn.style.cursor = 'pointer';
    }
  }
}

function increaseQuantity(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index]) {
    const currentQuantity = cart[index].qty || 1;
    
    // Check individual product limit
    if (currentQuantity >= MAX_QUANTITY_PER_PRODUCT) {
      return; // Don't increase beyond limit
    }

    // Check total items limit
    const totalItems = cart.reduce((total, item) => total + (item.qty || 1), 0);
    if (totalItems >= MAX_TOTAL_ITEMS) {
      return; // Don't increase beyond total limit
    }

    cart[index].qty = currentQuantity + 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
  }
}

function decreaseQuantity(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index] && cart[index].qty > 1) {
    cart[index].qty = cart[index].qty - 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
  }
}

function removeItem(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = document.getElementById("cart-count");
  if (count) count.textContent = cart.length;
}

document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      // Check total items before checkout
      const totalItems = cart.reduce((total, item) => total + (item.qty || 1), 0);
      if (totalItems > MAX_TOTAL_ITEMS) {
        alert(`Order limit exceeded! You can only order ${MAX_TOTAL_ITEMS} items total. Please reduce your quantity.`);
        return;
      }

      window.location.href = "../HTML/checkout.html";
    });
  }
});