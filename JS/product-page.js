// JS/product-page.js
// Dynamic product page (UI A) - S1 size rule (+₱25 Large), A1 universal addon prices
// Expects: products (global array) loaded before this script

(() => {
  /* ---------- Configuration ---------- */
  const SIZE_UPCHARGE = 25; // Large adds +₱25

  // Universal add-on prices (A1)
  const ADDON_PRICES = {
    "Skip": 0,
    "Pearl": 15,
    "Coconut Jelly": 20,
    "Fruity Jelly": 20,
    "Pudding": 25
  };

  const MAX_ADDONS = 2;

  // Standard sweetness options with qualitative labels (0,30,50,70,100)
  const STANDARD_SWEETNESS = [
    { value: "0%", label: "0%", qual: "No sugar" },
    { value: "30%", label: "30%", qual: "Little" },
    { value: "50%", label: "50%", qual: "Half" },
    { value: "70%", label: "70%", qual: "Normal" },
    { value: "100%", label: "100%", qual: "Sweet" }
  ];

  /* ---------- DOM references ---------- */
  const imgEl = document.getElementById("product-image");
  const nameEl = document.getElementById("product-name");
  const descEl = document.getElementById("product-desc");
  const sizeButtonsContainer = document.getElementById("size-buttons");
  const sweetButtonsContainer = document.getElementById("sweet-buttons");
  const addonButtonsContainer = document.getElementById("addon-buttons");
  const addBasketBtn = document.getElementById("add-basket-btn");
  const currentPriceEl = document.getElementById("current-price");

  /* ---------- URL / product lookup ---------- */
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    nameEl.textContent = "Product not found";
    currentPriceEl.textContent = "₱0";
    addBasketBtn.disabled = true;
    console.warn("No product id in query string.");
    return;
  }

  const product = (typeof products !== "undefined") ? products.find(p => p.id === productId) : null;

  if (!product) {
    nameEl.textContent = "Product not found";
    currentPriceEl.textContent = "₱0";
    addBasketBtn.disabled = true;
    console.warn("Product id not found in products array:", productId);
    return;
  }

  /* ---------- State ---------- */
  const state = {
    size: (product.sizes && product.sizes[0]) ? product.sizes[0] : "Regular",
    sugar: "100%",
    addons: []
  };

  /* ---------- Helpers ---------- */
  function formatPeso(n) {
    return "₱" + Number(n).toLocaleString();
  }

  function addonPriceByName(name) {
    return ADDON_PRICES.hasOwnProperty(name) ? ADDON_PRICES[name] : 0;
  }

  function calcTotal() {
    let total = Number(product.price) || 0;
    if (state.size === "Large") total += SIZE_UPCHARGE;
    for (const a of state.addons) {
      total += addonPriceByName(a);
    }
    return total;
  }

  function updatePriceUI() {
    const total = calcTotal();
    currentPriceEl.textContent = formatPeso(total);
    addBasketBtn.textContent = `Add to basket - ${formatPeso(total)}`;
  }

  /* ---------- Render product basic info ---------- */
  imgEl.src = product.image || "";
  imgEl.alt = product.name || "product image";
  nameEl.textContent = product.name || "Unnamed product";
  descEl.textContent = product.description || "";

  /* ---------- Render size buttons (Regular ₱0, Large +₱25) ---------- */
  sizeButtonsContainer.innerHTML = "";
  (product.sizes || ["Regular", "Large"]).forEach(size => {
    const subPriceText = (size === "Large") ? `+${formatPeso(SIZE_UPCHARGE)}` : `${formatPeso(0)}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-btn";
    btn.dataset.size = size;
    btn.innerHTML = `<span class="main">${size}</span><span class="sub">${subPriceText}</span>`;
    if (size === state.size) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      state.size = size;
      [...sizeButtonsContainer.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      updatePriceUI();
    });
    sizeButtonsContainer.appendChild(btn);
  });

  /* ---------- Render sweetness buttons (standard set) ---------- */
  sweetButtonsContainer.innerHTML = "";
  STANDARD_SWEETNESS.forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sweet-btn";
    btn.dataset.sugar = item.value;
    btn.innerHTML = `<span class="main">${item.label}</span><span class="sub">${item.qual}</span>`;
    if (item.value === state.sugar) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      state.sugar = item.value;
      [...sweetButtonsContainer.children].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    sweetButtonsContainer.appendChild(btn);
  });

  /* ---------- Render add-on buttons (normalize names -> use ADDON_PRICES) ---------- */
  addonButtonsContainer.innerHTML = "";
  // Build list: use product.addons but ensure Skip present
  const rawAddons = product.addons ? Array.from(product.addons) : [];
  if (!rawAddons.includes("Skip")) rawAddons.unshift("Skip");

  function normalizeName(n) {
    if (!n) return n;
    if (/pearl/i.test(n)) return "Pearl";
    if (/coconut/i.test(n)) return "Coconut Jelly";
    if (/fruity/i.test(n)) return "Fruity Jelly";
    if (/skip/i.test(n)) return "Skip";
    return n;
  }

  rawAddons.forEach(raw => {
    const name = normalizeName(raw);
    const price = ADDON_PRICES.hasOwnProperty(name) ? ADDON_PRICES[name] : 0;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "addon-btn";
    btn.dataset.addon = name;
    btn.innerHTML = `<span class="main">${name}</span><span class="sub">${formatPeso(price)}</span>`;
    if (state.addons.includes(name)) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      if (name === "Skip") {
        state.addons = [];
        [...addonButtonsContainer.children].forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        updatePriceUI();
        return;
      }

      // deselect skip button if present
      const skipBtn = [...addonButtonsContainer.children].find(b => b.dataset.addon === "Skip");
      if (skipBtn) skipBtn.classList.remove("selected");

      const idx = state.addons.indexOf(name);
      if (idx === -1) {
        // selecting
        if (state.addons.length >= MAX_ADDONS) {
          // flash feedback
          btn.classList.add("disabled-flash");
          setTimeout(() => btn.classList.remove("disabled-flash"), 360);
          return;
        }
        state.addons.push(name);
        btn.classList.add("selected");
      } else {
        // deselect
        state.addons.splice(idx, 1);
        btn.classList.remove("selected");
      }

      if (state.addons.length === 0 && skipBtn) skipBtn.classList.add("selected");
      updatePriceUI();
    });

    addonButtonsContainer.appendChild(btn);
  });

  // ensure skip selected if nothing chosen
  if (state.addons.length === 0) {
    const skipBtn = [...addonButtonsContainer.children].find(b => b.dataset.addon === "Skip");
    if (skipBtn) skipBtn.classList.add("selected");
  }

  /* ---------- Cart handling (localStorage) ---------- */
  function loadCart() {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  addBasketBtn.addEventListener("click", () => {
    const total = calcTotal();
    const cartItem = {
      id: product.id,
      name: product.name,
      image: product.image,
      basePrice: Number(product.price),
      size: state.size,
      sugar: state.sugar,
      addons: state.addons.slice(),
      totalPrice: total,
      qty: 1,
      addedAt: new Date().toISOString()
    };

    const cart = loadCart();
    const existingIndex = cart.findIndex(item =>
      item.id === cartItem.id &&
      item.size === cartItem.size &&
      item.sugar === cartItem.sugar &&
      JSON.stringify(item.addons) === JSON.stringify(cartItem.addons)
    );
    if (existingIndex > -1) {
      cart[existingIndex].qty += 1;
      cart[existingIndex].totalPrice = cart[existingIndex].totalPrice + cartItem.totalPrice;
    } else {
      cart.push(cartItem);
    }
    saveCart(cart);
    updateCartCount();

    // quick feedback
    addBasketBtn.textContent = "Added ✓";
    addBasketBtn.disabled = true;
    setTimeout(() => {
      updatePriceUI();
      addBasketBtn.disabled = false;
    }, 900);
  });

  // initial price render
  updatePriceUI();

})();
