/* Toy Haven uses one small JavaScript file for every page. */

var products = [];
var lastFocusedElement = null;

var STORAGE_KEYS = {
  cart: "toyHavenCart",
  wishlist: "toyHavenWishlist",
  promo: "toyHavenPromo",
  orders: "toyHavenOrders",
  subscribers: "toyHavenSubscribers",
  feedback: "toyHavenFeedback"
};

document.addEventListener("DOMContentLoaded", function () {
  addSharedHeaderAndFooter();
  connectSharedEvents();
  updateHeaderCounts();

  fetch("data/products.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("The product list could not be loaded.");
      }
      return response.json();
    })
    .then(function (data) {
      products = data;
      initialiseCurrentPage();
    })
    .catch(function () {
      showProductLoadError();
    });
});

function addSharedHeaderAndFooter() {
  var page = document.body.getAttribute("data-page") || "";
  var header = document.getElementById("site-header");
  var footer = document.getElementById("site-footer");

  if (header) {
    header.innerHTML =
      '<div class="announcement">Free islandwide delivery on orders over LKR 10,000</div>' +
      '<header class="site-header">' +
        '<div class="section-shell header-inner">' +
          '<a class="brand" href="index.html" aria-label="Toy Haven home">' +
            '<img src="content/favicon.png" alt="">' +
            '<span class="brand-name">Toy Haven</span>' +
          '</a>' +
          '<nav id="main-nav" class="main-nav" aria-label="Main navigation">' +
            navLink("index.html", "Home", page === "home") +
            navLink("products.html", "Products", page === "products") +
            navLink("feedback.html", "Contact & Feedback", page === "feedback") +
          '</nav>' +
          '<div class="header-actions">' +
            '<a class="icon-button" href="wishlist.html" aria-label="Wishlist">♡<span id="wishlist-count" class="count-badge">0</span></a>' +
            '<a class="icon-button" href="cart.html" aria-label="Shopping cart">🛒<span id="cart-count" class="count-badge">0</span></a>' +
            '<button id="menu-button" class="menu-button" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="main-nav">☰</button>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  if (footer) {
    footer.innerHTML =
      '<footer class="site-footer">' +
        '<div class="section-shell footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="brand" href="index.html"><img src="content/favicon.png" alt=""><span class="brand-name">Toy Haven</span></a>' +
            '<p>A colourful place for figures, games, plushies, building sets and gifts.</p>' +
          '</div>' +
          '<div class="footer-column"><h2>Shop</h2><a href="products.html">All toys</a><a href="wishlist.html">Wishlist</a><a href="cart.html">Cart</a></div>' +
          '<div class="footer-column"><h2>Help</h2><a href="feedback.html">Contact & feedback</a><span>+94 11 234 5678</span><span>hello@toyhaven.lk</span></div>' +
        '</div>' +
        '<div class="footer-bottom"><div class="section-shell"><p>&copy; ' + new Date().getFullYear() + ' Toy Haven. Created for an educational web assignment.</p></div></div>' +
      '</footer>';
  }

  var menuButton = document.getElementById("menu-button");
  if (menuButton) {
    menuButton.addEventListener("click", function () {
      var nav = document.getElementById("main-nav");
      var isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });
  }
}

function navLink(href, label, isActive) {
  return '<a class="nav-link' + (isActive ? " active" : "") + '" href="' + href + '"' + (isActive ? ' aria-current="page"' : "") + ">" + label + "</a>";
}

function connectSharedEvents() {
  document.addEventListener("click", function (event) {
    var addButton = event.target.closest("[data-add-cart]");
    var wishlistButton = event.target.closest("[data-toggle-wishlist]");
    var productButton = event.target.closest("[data-view-product]");
    var quantityButton = event.target.closest("[data-change-quantity]");
    var removeButton = event.target.closest("[data-remove-cart]");
    var closeModalButton = event.target.closest("[data-close-modal]");

    if (addButton) {
      addToCart(addButton.getAttribute("data-add-cart"));
    }

    if (wishlistButton) {
      toggleWishlist(wishlistButton.getAttribute("data-toggle-wishlist"));
    }

    if (productButton) {
      showProductDetails(productButton.getAttribute("data-view-product"));
    }

    if (quantityButton) {
      changeCartQuantity(
        quantityButton.getAttribute("data-change-quantity"),
        Number(quantityButton.getAttribute("data-amount"))
      );
    }

    if (removeButton) {
      removeFromCart(removeButton.getAttribute("data-remove-cart"));
    }

    if (closeModalButton) {
      closeProductModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeProductModal();
    }
  });
}

function initialiseCurrentPage() {
  var page = document.body.getAttribute("data-page");

  if (page === "home") {
    initialiseHomePage();
  } else if (page === "products") {
    initialiseProductsPage();
  } else if (page === "wishlist") {
    renderWishlistPage();
  } else if (page === "cart") {
    initialiseCartPage();
  } else if (page === "checkout") {
    initialiseCheckoutPage();
  } else if (page === "feedback") {
    initialiseFeedbackPage();
  }
}

function initialiseHomePage() {
  var featuredContainer = document.getElementById("featured-products");
  var featuredProducts = products.filter(function (product) {
    return product.featured;
  });

  if (featuredContainer) {
    featuredContainer.innerHTML = featuredProducts.map(createProductCard).join("");
  }

  var dayContainer = document.getElementById("product-of-day");
  if (dayContainer) {
    var dayIndex = new Date().getDate() % products.length;
    var product = products[dayIndex];
    dayContainer.innerHTML =
      '<div class="day-pick-image"><img src="' + product.image + '" alt="' + product.name + '"></div>' +
      '<div class="day-pick-content">' +
        '<span class="product-badge">' + product.badge + '</span>' +
        '<p class="eyebrow">' + product.category + ' · Ages ' + product.age + '</p>' +
        '<h3>' + product.name + '</h3>' +
        '<p>' + product.description + '</p>' +
        '<div class="price-large">' + formatPrice(product.price) + '</div>' +
        '<button class="button primary-button" type="button" data-add-cart="' + product.id + '">Add to cart</button>' +
      '</div>';
  }

  var newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", saveNewsletterSignup);
  }
}

function initialiseProductsPage() {
  var search = document.getElementById("search-products");
  var category = document.getElementById("category-filter");
  var price = document.getElementById("price-filter");
  var sort = document.getElementById("sort-products");
  var clear = document.getElementById("clear-filters");
  var parameters = new URLSearchParams(window.location.search);
  var categoryFromUrl = parameters.get("category");

  if (categoryFromUrl && category) {
    category.value = categoryFromUrl;
  }

  [search, category, price, sort].forEach(function (control) {
    if (control) {
      control.addEventListener("input", renderProductsPage);
      control.addEventListener("change", renderProductsPage);
    }
  });

  if (clear) {
    clear.addEventListener("click", function () {
      search.value = "";
      category.value = "all";
      price.value = "20000";
      sort.value = "featured";
      renderProductsPage();
    });
  }

  renderProductsPage();

  var viewProduct = parameters.get("view");
  if (viewProduct) {
    showProductDetails(viewProduct);
  }
}

function renderProductsPage() {
  var searchValue = document.getElementById("search-products").value.trim().toLowerCase();
  var categoryValue = document.getElementById("category-filter").value;
  var maximumPrice = Number(document.getElementById("price-filter").value);
  var sortValue = document.getElementById("sort-products").value;
  var visibleProducts = products.filter(function (product) {
    var matchesName = product.name.toLowerCase().indexOf(searchValue) !== -1;
    var matchesCategory = categoryValue === "all" || product.category === categoryValue;
    var matchesPrice = product.price <= maximumPrice;
    return matchesName && matchesCategory && matchesPrice;
  });

  if (sortValue === "price-low") {
    visibleProducts.sort(function (a, b) { return a.price - b.price; });
  } else if (sortValue === "price-high") {
    visibleProducts.sort(function (a, b) { return b.price - a.price; });
  } else if (sortValue === "rating") {
    visibleProducts.sort(function (a, b) { return b.rating - a.rating; });
  } else {
    visibleProducts.sort(function (a, b) { return Number(b.featured) - Number(a.featured); });
  }

  document.getElementById("price-value").textContent = formatPrice(maximumPrice);
  document.getElementById("product-count").textContent = visibleProducts.length + (visibleProducts.length === 1 ? " toy" : " toys");
  document.getElementById("all-products").innerHTML = visibleProducts.map(createProductCard).join("");
  document.getElementById("no-products").hidden = visibleProducts.length !== 0;
}

function createProductCard(product) {
  var wishlist = getStoredArray(STORAGE_KEYS.wishlist);
  var saved = wishlist.indexOf(product.id) !== -1;

  return '<article class="product-card">' +
    '<span class="product-badge">' + product.badge + '</span>' +
    '<button class="wishlist-button' + (saved ? " saved" : "") + '" type="button" data-toggle-wishlist="' + product.id + '" aria-label="' + (saved ? "Remove " : "Save ") + product.name + '">' + (saved ? "♥" : "♡") + '</button>' +
    '<button class="product-image-button" type="button" data-view-product="' + product.id + '" aria-label="View details for ' + product.name + '">' +
      '<img src="' + product.image + '" alt="' + product.name + '">' +
    '</button>' +
    '<div class="product-info">' +
      '<div class="product-meta"><span>' + product.category + '</span><span>★ ' + product.rating + '</span></div>' +
      '<h3><button class="product-name-button" type="button" data-view-product="' + product.id + '">' + product.name + '</button></h3>' +
      '<div class="product-price">' + formatPrice(product.price) + '</div>' +
      '<button class="add-cart-button" type="button" data-add-cart="' + product.id + '">Add to cart</button>' +
    '</div>' +
  '</article>';
}

function showProductDetails(productId) {
  var modal = document.getElementById("product-modal");
  var product = findProduct(productId);

  if (!product) {
    return;
  }

  if (!modal) {
    window.location.href = "products.html?view=" + encodeURIComponent(productId);
    return;
  }

  var wishlist = getStoredArray(STORAGE_KEYS.wishlist);
  var saved = wishlist.indexOf(product.id) !== -1;
  var content = document.getElementById("modal-content");
  content.innerHTML =
    '<div class="modal-product">' +
      '<div class="modal-product-image"><img src="' + product.image + '" alt="' + product.name + '"></div>' +
      '<div class="modal-product-info">' +
        '<p class="eyebrow">' + product.category + ' · Ages ' + product.age + '</p>' +
        '<h2 id="modal-title">' + product.name + '</h2>' +
        '<p>' + product.description + '</p>' +
        '<p><strong>Customer rating:</strong> ' + product.rating + ' out of 5</p>' +
        '<div class="price-large">' + formatPrice(product.price) + '</div>' +
        '<div class="modal-actions">' +
          '<button class="button primary-button" type="button" data-add-cart="' + product.id + '">Add to cart</button>' +
          '<button class="button secondary-button" type="button" data-toggle-wishlist="' + product.id + '">' + (saved ? "Remove from wishlist" : "Save to wishlist") + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-close").focus();
}

function closeProductModal() {
  var modal = document.getElementById("product-modal");
  if (!modal || modal.hidden) {
    return;
  }
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function toggleWishlist(productId) {
  var wishlist = getStoredArray(STORAGE_KEYS.wishlist);
  var index = wishlist.indexOf(productId);
  var product = findProduct(productId);

  if (index === -1) {
    wishlist.push(productId);
    showToast(product.name + " was saved to your wishlist.");
  } else {
    wishlist.splice(index, 1);
    showToast(product.name + " was removed from your wishlist.");
  }

  saveArray(STORAGE_KEYS.wishlist, wishlist);
  updateHeaderCounts();
  refreshProductDisplays();
}

function renderWishlistPage() {
  var wishlist = getStoredArray(STORAGE_KEYS.wishlist);
  var wishlistProducts = products.filter(function (product) {
    return wishlist.indexOf(product.id) !== -1;
  });
  var container = document.getElementById("wishlist-products");
  var empty = document.getElementById("wishlist-empty");

  container.innerHTML = wishlistProducts.map(createProductCard).join("");
  empty.hidden = wishlistProducts.length !== 0;
}

function addToCart(productId) {
  var cart = getStoredArray(STORAGE_KEYS.cart);
  var existingItem = null;
  var product = findProduct(productId);

  cart.forEach(function (item) {
    if (item.id === productId) {
      existingItem = item;
    }
  });

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveArray(STORAGE_KEYS.cart, cart);
  updateHeaderCounts();
  showToast(product.name + " was added to your cart.");

  if (document.body.getAttribute("data-page") === "cart") {
    renderCartPage();
  }
}

function initialiseCartPage() {
  renderCartPage();
  var promoForm = document.getElementById("promo-form");
  if (promoForm) {
    promoForm.addEventListener("submit", applyPromoCode);
  }
}

function renderCartPage() {
  var cart = getStoredArray(STORAGE_KEYS.cart);
  var container = document.getElementById("cart-items");
  var layout = document.getElementById("cart-layout");
  var empty = document.getElementById("cart-empty");

  if (cart.length === 0) {
    layout.hidden = true;
    empty.hidden = false;
    return;
  }

  layout.hidden = false;
  empty.hidden = true;
  container.innerHTML = cart.map(function (item) {
    var product = findProduct(item.id);
    if (!product) {
      return "";
    }
    return '<article class="cart-item">' +
      '<img src="' + product.image + '" alt="' + product.name + '">' +
      '<div class="cart-item-info"><h3>' + product.name + '</h3><p>' + product.category + '</p><strong>' + formatPrice(product.price) + '</strong></div>' +
      '<div class="cart-item-controls">' +
        '<div class="quantity-control" role="group" aria-label="Quantity for ' + product.name + '">' +
          '<button type="button" data-change-quantity="' + product.id + '" data-amount="-1" aria-label="Reduce quantity">−</button>' +
          '<span>' + item.quantity + '</span>' +
          '<button type="button" data-change-quantity="' + product.id + '" data-amount="1" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<button class="remove-button" type="button" data-remove-cart="' + product.id + '">Remove</button>' +
      '</div>' +
    '</article>';
  }).join("");

  displayTotals("cart");
}

function changeCartQuantity(productId, amount) {
  var cart = getStoredArray(STORAGE_KEYS.cart);
  cart.forEach(function (item) {
    if (item.id === productId) {
      item.quantity += amount;
    }
  });
  cart = cart.filter(function (item) { return item.quantity > 0; });
  saveArray(STORAGE_KEYS.cart, cart);
  updateHeaderCounts();
  renderCartPage();
}

function removeFromCart(productId) {
  var cart = getStoredArray(STORAGE_KEYS.cart).filter(function (item) {
    return item.id !== productId;
  });
  saveArray(STORAGE_KEYS.cart, cart);
  updateHeaderCounts();
  renderCartPage();
  showToast("The toy was removed from your cart.");
}

function applyPromoCode(event) {
  event.preventDefault();
  var input = document.getElementById("promo-code");
  var code = input.value.trim().toUpperCase();

  if (code === "PLAY10") {
    localStorage.setItem(STORAGE_KEYS.promo, code);
    showToast("PLAY10 applied. You saved 10%.");
    displayTotals("cart");
  } else {
    localStorage.removeItem(STORAGE_KEYS.promo);
    showToast("That promo code is not available.");
    displayTotals("cart");
  }
}

function calculateTotals() {
  var cart = getStoredArray(STORAGE_KEYS.cart);
  var subtotal = 0;

  cart.forEach(function (item) {
    var product = findProduct(item.id);
    if (product) {
      subtotal += product.price * item.quantity;
    }
  });

  var delivery = subtotal >= 10000 || subtotal === 0 ? 0 : 500;
  var promoActive = localStorage.getItem(STORAGE_KEYS.promo) === "PLAY10";
  var discount = promoActive ? Math.round(subtotal * 0.1) : 0;

  return {
    subtotal: subtotal,
    delivery: delivery,
    discount: discount,
    total: subtotal + delivery - discount
  };
}

function displayTotals(prefix) {
  var totals = calculateTotals();
  var discountRow = document.getElementById(prefix === "cart" ? "discount-row" : "checkout-discount-row");

  document.getElementById(prefix + "-subtotal").textContent = formatPrice(totals.subtotal);
  document.getElementById(prefix + "-delivery").textContent = totals.delivery === 0 ? "Free" : formatPrice(totals.delivery);
  document.getElementById(prefix + "-discount").textContent = "- " + formatPrice(totals.discount);
  document.getElementById(prefix + "-total").textContent = formatPrice(totals.total);
  discountRow.hidden = totals.discount === 0;
}

function initialiseCheckoutPage() {
  var cart = getStoredArray(STORAGE_KEYS.cart);
  var layout = document.getElementById("checkout-layout");
  var empty = document.getElementById("checkout-empty");

  if (cart.length === 0) {
    layout.hidden = true;
    empty.hidden = false;
    return;
  }

  layout.hidden = false;
  empty.hidden = true;
  document.getElementById("checkout-items").innerHTML = cart.map(function (item) {
    var product = findProduct(item.id);
    return '<div class="checkout-item">' +
      '<img src="' + product.image + '" alt="">' +
      '<div><strong>' + product.name + '</strong><br><span>Quantity: ' + item.quantity + '</span></div>' +
      '<strong>' + formatPrice(product.price * item.quantity) + '</strong>' +
    '</div>';
  }).join("");

  displayTotals("checkout");
  document.getElementById("checkout-form").addEventListener("submit", placeOrder);
}

function placeOrder(event) {
  event.preventDefault();
  var form = event.currentTarget;
  var formData = new FormData(form);
  var cart = getStoredArray(STORAGE_KEYS.cart);
  var totals = calculateTotals();
  var orderNumber = "TH" + String(Date.now()).slice(-7);
  var orders = getStoredArray(STORAGE_KEYS.orders);

  orders.push({
    orderNumber: orderNumber,
    customerName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address") + ", " + formData.get("city") + ", " + formData.get("province"),
    postalCode: formData.get("postalCode"),
    payment: formData.get("payment"),
    items: cart,
    total: totals.total,
    placedAt: new Date().toISOString()
  });

  saveArray(STORAGE_KEYS.orders, orders);
  localStorage.removeItem(STORAGE_KEYS.cart);
  localStorage.removeItem(STORAGE_KEYS.promo);
  updateHeaderCounts();

  document.getElementById("checkout-layout").hidden = true;
  document.getElementById("order-success").hidden = false;
  document.getElementById("order-success-text").textContent = "Thank you, " + formData.get("fullName") + ". Your order number is " + orderNumber + ".";
  document.getElementById("order-success").scrollIntoView({ behavior: "smooth" });
}

function initialiseFeedbackPage() {
  var feedbackForm = document.getElementById("feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", saveFeedback);
  }
}

function saveFeedback(event) {
  event.preventDefault();
  var form = event.currentTarget;
  var formData = new FormData(form);
  var feedback = getStoredArray(STORAGE_KEYS.feedback);

  feedback.push({
    name: formData.get("name"),
    email: formData.get("email"),
    rating: Number(formData.get("rating")),
    message: formData.get("message"),
    sentAt: new Date().toISOString()
  });

  saveArray(STORAGE_KEYS.feedback, feedback);
  form.reset();
  showToast("Thank you. Your feedback has been saved.");
}

function saveNewsletterSignup(event) {
  event.preventDefault();
  var form = event.currentTarget;
  var email = form.elements.email.value.trim();
  var subscribers = getStoredArray(STORAGE_KEYS.subscribers);

  if (subscribers.indexOf(email) === -1) {
    subscribers.push(email);
    saveArray(STORAGE_KEYS.subscribers, subscribers);
  }

  form.reset();
  showToast("You are on the Toy Haven list!");
}

function refreshProductDisplays() {
  var page = document.body.getAttribute("data-page");
  if (page === "home") {
    var featuredContainer = document.getElementById("featured-products");
    var featuredProducts = products.filter(function (product) {
      return product.featured;
    });
    featuredContainer.innerHTML = featuredProducts.map(createProductCard).join("");
  } else if (page === "products") {
    renderProductsPage();
    var modal = document.getElementById("product-modal");
    if (modal && !modal.hidden) {
      closeProductModal();
    }
  } else if (page === "wishlist") {
    renderWishlistPage();
  }
}

function updateHeaderCounts() {
  var cartCount = getStoredArray(STORAGE_KEYS.cart).reduce(function (total, item) {
    return total + item.quantity;
  }, 0);
  var wishlistCount = getStoredArray(STORAGE_KEYS.wishlist).length;
  var cartBadge = document.getElementById("cart-count");
  var wishlistBadge = document.getElementById("wishlist-count");

  if (cartBadge) {
    cartBadge.textContent = cartCount;
  }
  if (wishlistBadge) {
    wishlistBadge.textContent = wishlistCount;
  }
}

function findProduct(productId) {
  var matchingProduct = null;
  products.forEach(function (product) {
    if (product.id === productId) {
      matchingProduct = product;
    }
  });
  return matchingProduct;
}

function getStoredArray(key) {
  try {
    var value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatPrice(price) {
  return "LKR " + Number(price).toLocaleString("en-LK");
}

function showToast(message) {
  var toast = document.getElementById("toast");
  if (!toast) {
    return;
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(function () {
    toast.classList.remove("show");
  }, 2600);
}

function showProductLoadError() {
  ["featured-products", "all-products", "wishlist-products", "product-of-day", "cart-items", "checkout-items"].forEach(function (id) {
    var element = document.getElementById(id);
    if (element) {
      element.innerHTML = '<div class="empty-state"><span>!</span><h2>Products could not load</h2><p>Please open the website through a local server or GitHub Pages.</p></div>';
    }
  });
}
