// checkout.js — UPDATED VERSION WITH ORDER STATUS REDIRECT// checkout.js — UPDATED VERSION WITH ORDER STATUS REDIRECT

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

        // Create order object (matches admin-orders.js expected format)
        const order = {
            id: orderId,
            customer: {
                name: fullName.value,
                phone: contact.value,  // Changed from contact to phone
                address: address.value,
                email: email.value
            },
            items: cart.map(item => ({
                name: item.name,
                price: item.totalPrice || item.price || item.basePrice || 0,
                quantity: item.qty || item.quantity || 1,
                size: item.size || "Regular",
                sugar: item.sugar || "Standard",
                addons: item.addons || [],
                image: item.image
            })),
            // FIXED: Changed from "received" to "order_received" to match admin
            status: "order_received",
            paymentMethod: document.querySelector('input[name="payment"]:checked').value,
            notes: notes.value,
            timestamps: {
                placed: new Date().toISOString(),
                // FIXED: Changed from "received" to "order_received" to match admin
                order_received: new Date().toISOString()
            },
            total: cart.reduce((sum, item) => {
                const quantity = item.qty || item.quantity || 1;
                const price = item.totalPrice || item.price || item.basePrice || 0;
                return sum + (price * quantity);
            }, 0)
        };

        // Save order to localStorage in ALL formats for compatibility
        try {
            // Save to 'orders' array (for order-status.js)
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Save to 'pearlifyOrders' array (for admin-orders.js)
            let pearlifyOrders = JSON.parse(localStorage.getItem('pearlifyOrders')) || [];
            pearlifyOrders.push(order);
            localStorage.setItem('pearlifyOrders', JSON.stringify(pearlifyOrders));
            
            // Save to 'customerOrders' array (for backup)
            let customerOrders = JSON.parse(localStorage.getItem('customerOrders')) || [];
            customerOrders.push(order);
            localStorage.setItem('customerOrders', JSON.stringify(customerOrders));
            
            console.log('Order saved to all localStorage locations');
        } catch (error) {
            console.error('Error saving order:', error);
        }

        // Store order ID for order-status page
        sessionStorage.setItem('lastOrderId', orderId);

        // Clear cart
        localStorage.removeItem("cart");

        // REDIRECT TO ORDER STATUS PAGE WITH ORDER ID
        window.location.href = `order-status.html?orderId=${orderId}`;
    });
}

  // ----- Back to Cart Button -----
  const backToCartBtn = document.querySelector('.back-to-cart-btn');
  if (backToCartBtn) {
    backToCartBtn.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  // In checkout.js - Add this to your existing code

document.getElementById('place-order-btn').addEventListener('click', function(e) {
    e.preventDefault();
    
    // Get form values
    const orderData = {
        fullName: document.getElementById('fullName').value,
        contact: document.getElementById('contact').value,
        address: document.getElementById('address').value,
        email: document.getElementById('email').value,
        items: cartItems, // Your cart items array from checkout.js
        total: cartTotal, // Your cart total from checkout.js
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        notes: document.getElementById('notes').value
    };
    
    // Validate form
    if (!validateOrderForm(orderData)) {
        return;
    }
    
    // Create new order using order-status.js function
    const orderId = createNewOrder(orderData);
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Redirect to order status page
    window.location.href = `order-status.html?orderId=${orderId}`;
});

function validateOrderForm(data) {
    if (!data.fullName || data.fullName.trim().length < 2) {
        alert('Please enter your full name');
        return false;
    }
    
    if (!data.contact || !/^09\d{9}$/.test(data.contact)) {
        alert('Please enter a valid Philippine mobile number (09XXXXXXXXX)');
        return false;
    }
    
    if (!data.address || data.address.trim().length < 10) {
        alert('Please enter your complete delivery address');
        return false;
    }
    
    if (!data.items || data.items.length === 0) {
        alert('Your cart is empty');
        return false;
    }
    
    return true;
} 

  // ----- Initial Load -----
  loadCart();
});
