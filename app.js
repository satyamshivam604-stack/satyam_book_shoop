const PRODUCTS = [
  {
    id: "quiet-atlas",
    title: "The Quiet Atlas",
    author: "Mira Sol",
    category: "Travel",
    price: 499,
    rating: 4.8,
    badge: "New",
    image: "assets/quiet-atlas.png",
    description: "A quiet global travel journal for slow routes, small maps, and found places."
  },
  {
    id: "city-of-margins",
    title: "City of Margins",
    author: "Noel Vance",
    category: "Fiction",
    price: 399,
    rating: 4.6,
    badge: "Staff pick",
    image: "assets/city-of-margins.png",
    description: "A sharp city novel about loyalty, rent, and the corners people call home."
  },
  {
    id: "wildflower-physics",
    title: "Wildflower Physics",
    author: "June Etta",
    category: "Science",
    price: 649,
    rating: 4.9,
    badge: "Popular",
    image: "assets/wildflower-physics.png",
    description: "Readable field science that connects motion, weather, petals, and patience."
  },
  {
    id: "midnight-cartographer",
    title: "Midnight Cartographer",
    author: "Arlo Finch",
    category: "Mystery",
    price: 459,
    rating: 4.7,
    badge: "New",
    image: "assets/midnight-cartographer.png",
    description: "A mapmaker follows missing streets through a city that edits itself at night."
  },
  {
    id: "glass-orchard",
    title: "The Glass Orchard",
    author: "Selene Park",
    category: "Fantasy",
    price: 549,
    rating: 4.8,
    badge: "Staff pick",
    image: "assets/glass-orchard.png",
    description: "A bright, uneasy fantasy of inheritance, sealed rooms, and impossible fruit."
  },
  {
    id: "small-fires",
    title: "Small Fires Almanac",
    author: "Ivy Chen",
    category: "Essays",
    price: 299,
    rating: 4.5,
    badge: "Local",
    image: "assets/small-fires.png",
    description: "Brief essays on kitchens, weather, friendship, repair, and daily courage."
  },
  {
    id: "syntax-and-steam",
    title: "Syntax & Steam",
    author: "Eli Moreno",
    category: "Tech",
    price: 799,
    rating: 4.4,
    badge: "Guide",
    image: "assets/syntax-and-steam.png",
    description: "A hands-on guide to systems thinking, automation, and humane software craft."
  },
  {
    id: "harbor-table",
    title: "The Harbor Table",
    author: "Rae Collins",
    category: "Cooking",
    price: 699,
    rating: 4.6,
    badge: "Seasonal",
    image: "assets/harbor-table.png",
    description: "Sea air cooking with weeknight soups, citrus desserts, and market notes."
  }
];

const STORAGE = {
  cart: "leafLedgerCart",
  wishlist: "leafLedgerWishlist",
  profile: "leafLedgerProfile",
  session: "leafLedgerSession"
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const shopState = {
  query: "",
  category: "All",
  sort: "featured"
};

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function productById(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function getCart() {
  return readJson(STORAGE.cart, []);
}

function saveCart(cart) {
  writeJson(STORAGE.cart, cart);
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const total = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((element) => {
    element.textContent = String(total);
  });
}

function updateAuthLabels() {
  const session = readJson(STORAGE.session, null);
  document.querySelectorAll("[data-auth-label]").forEach((link) => {
    if (session && session.name) {
      link.textContent = session.name;
      link.href = "index.html";
      link.setAttribute("aria-label", `Signed in as ${session.name}`);
    } else {
      link.textContent = "Sign in";
      link.href = "login.html";
      link.removeAttribute("aria-label");
    }
  });
}

function setupShop() {
  const grid = document.querySelector("[data-products]");
  if (!grid) {
    return;
  }

  const searchInput = document.querySelector("[data-search]");
  const sortSelect = document.querySelector("[data-sort]");
  const resetButton = document.querySelector("[data-reset-filters]");

  renderCategoryButtons();
  renderProducts();

  searchInput.addEventListener("input", () => {
    shopState.query = searchInput.value.trim().toLowerCase();
    renderProducts();
  });

  sortSelect.addEventListener("change", () => {
    shopState.sort = sortSelect.value;
    renderProducts();
  });

  resetButton.addEventListener("click", () => {
    shopState.query = "";
    shopState.category = "All";
    shopState.sort = "featured";
    searchInput.value = "";
    sortSelect.value = "featured";
    renderCategoryButtons();
    renderProducts();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const id = button.dataset.id;
    if (button.dataset.action === "add") {
      addToCart(id);
      openCart();
    }

    if (button.dataset.action === "save") {
      toggleWishlist(id);
      renderProducts();
    }
  });
}

function renderCategoryButtons() {
  const holder = document.querySelector("[data-categories]");
  if (!holder) {
    return;
  }

  const categories = ["All", ...new Set(PRODUCTS.map((product) => product.category))];
  holder.innerHTML = categories.map((category) => {
    const active = category === shopState.category;
    return `
      <button type="button" class="${active ? "is-active" : ""}" role="tab" aria-selected="${active}" data-category="${category}">
        ${category}
      </button>
    `;
  }).join("");

  holder.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      shopState.category = button.dataset.category;
      renderCategoryButtons();
      renderProducts();
    });
  });
}

function filteredProducts() {
  const query = shopState.query;
  let products = [...PRODUCTS];

  if (shopState.category !== "All") {
    products = products.filter((product) => product.category === shopState.category);
  }

  if (query) {
    products = products.filter((product) => {
      const haystack = `${product.title} ${product.author} ${product.category}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  if (shopState.sort === "price-low") {
    products.sort((a, b) => a.price - b.price);
  }

  if (shopState.sort === "price-high") {
    products.sort((a, b) => b.price - a.price);
  }

  if (shopState.sort === "rating") {
    products.sort((a, b) => b.rating - a.rating);
  }

  return products;
}

function renderProducts() {
  const grid = document.querySelector("[data-products]");
  const resultCount = document.querySelector("[data-result-count]");
  const wishlist = new Set(readJson(STORAGE.wishlist, []));
  const products = filteredProducts();

  if (resultCount) {
    resultCount.textContent = `${products.length} ${products.length === 1 ? "book" : "books"}`;
  }

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No books found</h3>
        <p>Try a different title, author, or category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((product) => {
    const saved = wishlist.has(product.id);
    return `
      <article class="product-card" id="book-${product.id}">
        <div class="cover-frame">
          <img src="${product.image}" alt="${product.title} book cover" loading="lazy">
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span class="badge">${product.badge}</span>
            <span class="rating">Rating ${product.rating.toFixed(1)}/5</span>
          </div>
          <h3>${product.title}</h3>
          <p class="book-author">${product.author}</p>
          <p class="product-description">${product.description}</p>
        </div>
        <div class="product-footer">
          <strong class="book-price">${money.format(product.price)}</strong>
          <div class="product-actions">
            <button class="secondary-action ${saved ? "is-active" : ""}" type="button" data-action="save" data-id="${product.id}">
              ${saved ? "Saved" : "Save"}
            </button>
            <button class="primary-action" type="button" data-action="add" data-id="${product.id}">
              Add
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function addToCart(id) {
  const product = productById(id);
  if (!product) {
    return;
  }

  const cart = getCart();
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart(cart);
}

function toggleWishlist(id) {
  const wishlist = new Set(readJson(STORAGE.wishlist, []));
  if (wishlist.has(id)) {
    wishlist.delete(id);
  } else {
    wishlist.add(id);
  }
  writeJson(STORAGE.wishlist, [...wishlist]);
}

function setupCartDrawer() {
  const drawer = document.querySelector("#cartDrawer");
  const overlay = document.querySelector("[data-cart-overlay]");
  if (!drawer || !overlay) {
    return;
  }

  document.querySelectorAll("[data-open-cart]").forEach((button) => {
    button.addEventListener("click", openCart);
  });

  document.querySelectorAll("[data-close-cart], [data-cart-overlay]").forEach((element) => {
    element.addEventListener("click", closeCart);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
    }
  });

  drawer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-cart-action]");
    if (!button) {
      return;
    }
    updateCartItem(button.dataset.id, button.dataset.cartAction);
  });

  document.querySelectorAll(".checkout-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (!getCart().length) {
        renderCart("Your cart is empty.");
        return;
      }

      const session = readJson(STORAGE.session, null);
      if (!session) {
        window.location.href = "login.html";
        return;
      }

      renderCart(`Checkout is ready for ${session.name}.`);
    });
  });
}

function openCart() {
  const drawer = document.querySelector("#cartDrawer");
  const overlay = document.querySelector("[data-cart-overlay]");
  if (!drawer || !overlay) {
    return;
  }

  renderCart();
  overlay.hidden = false;
  document.body.classList.add("is-drawer-open");
  requestAnimationFrame(() => {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  });
}

function closeCart() {
  const drawer = document.querySelector("#cartDrawer");
  const overlay = document.querySelector("[data-cart-overlay]");
  if (!drawer || !overlay) {
    return;
  }

  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-drawer-open");
  window.setTimeout(() => {
    if (!drawer.classList.contains("is-open")) {
      overlay.hidden = true;
    }
  }, 190);
}

function updateCartItem(id, action) {
  let cart = getCart();
  const item = cart.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  if (action === "increase") {
    item.quantity += 1;
  }

  if (action === "decrease") {
    item.quantity -= 1;
  }

  if (action === "remove" || item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== id);
  }

  saveCart(cart);
}

function renderCart(message = "") {
  const lines = document.querySelector("[data-cart-lines]");
  const subtotal = document.querySelector("[data-cart-subtotal]");
  if (!lines || !subtotal) {
    return;
  }

  const cart = getCart();
  const detailedCart = cart
    .map((item) => ({ ...item, product: productById(item.id) }))
    .filter((item) => item.product);
  const total = detailedCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  subtotal.textContent = money.format(total);

  if (!detailedCart.length) {
    lines.innerHTML = `
      <div class="cart-empty">
        <strong>${message || "Your cart is empty."}</strong>
        <span>Fresh books are waiting on the shelves.</span>
      </div>
    `;
    return;
  }

  lines.innerHTML = `
    ${message ? `<p class="form-message is-success">${message}</p>` : ""}
    <ul class="cart-list">
      ${detailedCart.map((item) => `
        <li class="cart-line">
          <img src="${item.product.image}" alt="${item.product.title} book cover">
          <div>
            <h3>${item.product.title}</h3>
            <p>${item.product.author} - ${money.format(item.product.price)} - Rating ${item.product.rating.toFixed(1)}/5</p>
            <div class="quantity-row">
              <button class="quantity-button" type="button" data-cart-action="decrease" data-id="${item.id}" aria-label="Decrease ${item.product.title} quantity">-</button>
              <span class="quantity-value">${item.quantity}</span>
              <button class="quantity-button" type="button" data-cart-action="increase" data-id="${item.id}" aria-label="Increase ${item.product.title} quantity">+</button>
              <button class="remove-button" type="button" data-cart-action="remove" data-id="${item.id}">Remove</button>
            </div>
          </div>
        </li>
      `).join("")}
    </ul>
  `;
}

function setupAuthForms() {
  const loginForm = document.querySelector("#loginForm");
  const signupForm = document.querySelector("#signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = loginForm.email.value.trim().toLowerCase();
      const password = loginForm.password.value;
      const message = loginForm.querySelector("[data-auth-message]");

      if (!isValidEmail(email)) {
        showAuthMessage(message, "Enter a valid email address.", true);
        return;
      }

      if (password.length < 6) {
        showAuthMessage(message, "Password must be at least 6 characters.", true);
        return;
      }

      const profile = readJson(STORAGE.profile, null);
      const name = profile && profile.email === email ? profile.name : email.split("@")[0];
      writeJson(STORAGE.session, { name, email });
      showAuthMessage(message, "Signed in. Opening the shop.", false);
      updateAuthLabels();
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = signupForm.name.value.trim();
      const email = signupForm.email.value.trim().toLowerCase();
      const password = signupForm.password.value;
      const confirm = signupForm.confirm.value;
      const agree = signupForm.agree.checked;
      const message = signupForm.querySelector("[data-auth-message]");

      if (name.length < 2) {
        showAuthMessage(message, "Enter your name.", true);
        return;
      }

      if (!isValidEmail(email)) {
        showAuthMessage(message, "Enter a valid email address.", true);
        return;
      }

      if (password.length < 6) {
        showAuthMessage(message, "Password must be at least 6 characters.", true);
        return;
      }

      if (password !== confirm) {
        showAuthMessage(message, "Passwords do not match.", true);
        return;
      }

      if (!agree) {
        showAuthMessage(message, "Select the email preference checkbox.", true);
        return;
      }

      writeJson(STORAGE.profile, { name, email });
      writeJson(STORAGE.session, { name, email });
      showAuthMessage(message, "Account created. Opening the shop.", false);
      updateAuthLabels();
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAuthMessage(element, text, isError) {
  element.textContent = text;
  element.classList.toggle("is-error", isError);
  element.classList.toggle("is-success", !isError);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateAuthLabels();
  setupCartDrawer();
  renderCart();

  if (document.body.dataset.page === "shop") {
    setupShop();
  }

  setupAuthForms();
});
