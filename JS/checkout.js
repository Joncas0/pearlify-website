<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Checkout | Pearlify</title>
  <link rel="stylesheet" href="../CSS/checkout.css">
</head>
<body>

  <div id="header"></div>

  <main class="checkout-page">
    <h1>Checkout</h1>

    <div class="checkout-container">
<!-- LEFT: ORDER SUMMARY -->
<div class="order-summary">
  <h2>Order Summary</h2>

  <!-- Column Labels -->
  <div class="order-header">
    <span class="col-drink">Drink</span>
    <span class="col-price">Price</span>
    <span class="col-qty">Quantity</span>
    <span class="col-total">Total</span>
  </div>

  <div id="order-items">
    <!-- Cart items will be loaded here by JavaScript -->
  </div>

  <!-- NEW: Separate Grand Total Container -->
  <div class="order-summary-footer">
    <div class="grand-total-container">
      <span class="grand-total-label">Grand Total:</span>
      <span class="grand-total-amount" id="grand-total">₱0</span>
    </div>
    <button class="back-to-cart-btn" onclick="window.location.href='cart.html'">
      ← Back to Cart
    </button>
  </div>
</div>
      <!-- RIGHT: CHECKOUT FORM -->
      <div class="checkout-form">
        <h2>Checkout Options</h2>

        <div class="option-group">
  <label>
    <input type="radio" name="orderType" value="delivery" checked>
    Delivery
  </label>
</div>

<!-- Delivery form -->
<div id="delivery-info">
  <h3 id="delivery-info-text">Delivery Information</h3>
  
  <label class="field full-name">
    Full Name
    <input type="text" id="fullName" placeholder="Enter your full name" required>
  </label>

  <label class="field email">
    Email
    <input type="email" id="email" placeholder="Enter your email address" required>
  </label>

  <label class="field contact">
    Contact Number
    <input type="text" id="contact" placeholder="09XXXXXXXXX" required>
  </label>

  <label class="field address">
    Address
    <input type="text" id="address" placeholder="Complete delivery address" required>
  </label>

  <label class="field notes">
    Notes (optional)
    <textarea id="notes" placeholder="Any additional instructions?"></textarea>
  </label>

</div>


<!-- Payment method -->
<div class="payment-method">
  <h3>Payment Method</h3>
  <label><input type="radio" name="payment" value="cod" checked> Cash on Delivery</label>
  <label><input type="radio" name="payment" value="gcash"> GCash</label>
</div>

<!-- CTA -->
<button id="place-order-btn">Place Order</button>

      </div>
    </div>
  </main>

  <div id="footer"></div>

  <script src="../JS/header-footer.js"></script>
  <script src="../JS/checkout.js"></script>
</body>
</html>
