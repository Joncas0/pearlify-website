// checkout.js — UPDATED VERSION WITH ORDER STATUS REDIRECT

document.addEventListener("DOMContentLoaded", () => {
  // ----- DOM Elements -----
  const orderItemsContainer = document.getElementById("order-items");
  const grandTotalEl = document.getElementById("grand-total");
  const placeOrderBtn = document.getElementById("place-order-btn");

  // Form fields
  const fullName = document.getElementById("fullName");
  const email = document.getElementById("email");
  const contact = document.getElementById("contact");
  const address = document.getElementById("address");
  const notes = document.getElementById("notes");
  const paymentRadios = document.getElementsByName("payment");

  // Cart array
  let cart = [];

  // ----- Load Cart from localStorage -----
  function loadCart() {
    const storedCart = localStorage.getItem("cart");
    cart = storedCart ? JSON.parse(storedCart) : [];

    if (cart.length === 0) {
      orderItemsContainer.innerHTML = '<div class="empty">Your cart is empty</div>';
      grandTotalEl.textContent = "₱0";
      return;
    }

    renderCart();
  }

  // ----- Render Cart Items to DOM -----
  function renderCart() {
    orderItemsContainer.innerHTML = "";

    cart.forEach((item, index) => {
      const quantity = item.qty || item.quantity || 1;
      const price = item.totalPrice || item.price || item.basePrice || 0;
      const itemTotal = price * quantity;

      const itemEl = document.createElement("div");
      itemEl.className = "order-item";

      itemEl.innerHTML = `
        <div class="item-left">
          <img src="${item.image}" alt="${item.name}">
          <div class="item-info">
            <h3>${item.name}</h3>
            <p>Size: ${item.size || "Regular"}</p>
            <p>Sweetness: ${item.sugar || "Standard"}</p>
            <p>Add-ons: ${item.addons?.length ? item.addons.join(", ") : "None"}</p>
          </div>
        </div>
        <div class="item-right">
          <span class="price">₱${price.toLocaleString()}</span>
          <span class="quantity">${quantity}</span>
          <span class="total">₱${itemTotal.toLocaleString()}</span>
        </div>
      `;

      orderItemsContainer.appendChild(itemEl);
    });

    updateGrandTotal();
  }

  // ----- Compute Grand Total -----
  function updateGrandTotal() {
    const total = cart.reduce((sum, item) => {
      const quantity = item.qty || item.quantity || 1;
      const price = item.totalPrice || item.price || item.basePrice || 0;
      return sum + (price * quantity);
    }, 0);
    
    grandTotalEl.textContent = `₱${total.toLocaleString()}`;
  }

  // ----- Place Order Functionality -----
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Basic form validation
      if (!fullName.value || !email.value || !contact.value || !address.value) {
        alert("Please fill in all required delivery information");
        return;
      }

      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      // Generate unique order ID
      const orderId = 'ORD-' + Date.now();

      // Create order object (matches order-status.js expected format)
      const order = {
        id: orderId, // Changed from orderId to id for consistency
        customer: { // Changed structure to match order-status.js
          name: fullName.value,
          contact: contact.value,
          address: address.value,
          email: email.value
        },
        items: cart.map(item => ({ // Changed structure to match order-status.js
          name: item.name,
          price: item.totalPrice || item.price || item.basePrice || 0,
          quantity: item.qty || item.quantity || 1,
          size: item.size || "Regular",
          sugar: item.sugar || "Standard",
          addons: item.addons || [],
          image: item.image
        })),
        status: "received", // Initial status
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        notes: notes.value,
        timestamps: {
          placed: new Date().toISOString(),
          received: new Date().toISOString() // Set received timestamp immediately
        },
        total: cart.reduce((sum, item) => {
          const quantity = item.qty || item.quantity || 1;
          const price = item.totalPrice || item.price || item.basePrice || 0;
          return sum + (price * quantity);
        }, 0)
      };

      // Save order to localStorage
      const orders = JSON.parse(localStorage.getItem("orders")) || [];
      orders.push(order);
      localStorage.setItem("orders", JSON.stringify(orders));

      // Store order ID for order-status page
      sessionStorage.setItem('lastOrderId', orderId);

      // Clear cart
      localStorage.removeItem("cart");

      // REDIRECT TO ORDER STATUS PAGE WITH ORDER ID
      window.location.href = `order-status.html?orderId=${orderId}`;
      
      // Remove the alert since we're redirecting immediately
      // alert(`Order placed successfully! Order ID: ${order.orderId}`);
    });
  }

  // ----- Back to Cart Button -----
  const backToCartBtn = document.querySelector('.back-to-cart-btn');
  if (backToCartBtn) {
    backToCartBtn.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  // ----- Initial Load -----
  loadCart();
});