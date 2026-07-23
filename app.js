// ================================
// Public site logic
// Reads: products (status == 'active')
// Writes: requests (new inquiry docs)
// ================================

const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const filterRow = document.getElementById("filterRow");
const productSearchInput = document.getElementById("productSearch");

const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalPieceName = document.getElementById("modalPieceName");
const requestForm = document.getElementById("requestForm");
const productIdField = document.getElementById("productId");
const formStatus = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");
const requestViewTitle = document.getElementById("requestViewTitle");
const requestViewTitleCustom = document.getElementById("requestViewTitleCustom");
const customDesignFieldWrap = document.getElementById("customDesignFieldWrap");
const customDesignDescriptionField = document.getElementById("customDesignDescription");
const customDesignBtn = document.getElementById("customDesignBtn");

// If a price was typed as bare digits (no currency letters), assume EGP so it's
// never shown as an unexplained bare number like "800".
function formatPrice(value) {
  if (!value) return value;
  return /^[\d,.\s–-]+$/.test(value) ? `${value} EGP` : value;
}

// Best-effort % off for the sale badge — falls back to a plain "Sale" label
// when either price isn't a clean number (e.g. a typed range like "1,800–2,600").
function calcDiscountPercent(original, sale) {
  const o = parseFloat(String(original || "").replace(/[^\d.]/g, ""));
  const s = parseFloat(String(sale || "").replace(/[^\d.]/g, ""));
  if (!o || !s || s >= o) return null;
  return Math.round((1 - s / o) * 100);
}

const detailView = document.getElementById("detailView");
const requestView = document.getElementById("requestView");
const detailCarouselImage = document.getElementById("detailCarouselImage");
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");
const carouselDots = document.getElementById("carouselDots");
const detailCategory = document.getElementById("detailCategory");
const detailName = document.getElementById("detailName");
const detailPrice = document.getElementById("detailPrice");
const detailDescription = document.getElementById("detailDescription");
const detailRequestBtn = document.getElementById("detailRequestBtn");
const backToDetailBtn = document.getElementById("backToDetailBtn");
const zoomHint = document.querySelector(".zoom-hint");

const imageLightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let allProducts = [];
let allCollections = [];
const LIKED_STORAGE_KEY = "hm_liked_products";
let likedProducts = new Set(JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) || "[]"));

function toggleLike(productId, btn) {
  if (likedProducts.has(productId)) {
    likedProducts.delete(productId);
    btn.classList.remove("liked");
  } else {
    likedProducts.add(productId);
    btn.classList.add("liked");
  }
  localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...likedProducts]));
  // Viewing "Favorites only"? Un-liking a piece should drop it from view immediately.
  if (favOnly) renderGallery();
}

// ---------- Cart ----------
// Local-only (like Favorites) — a staging area for multiple pieces that get
// submitted together as one combined inquiry (still no payment, matching the
// site's existing single-item request flow).

const CART_STORAGE_KEY = "hm_cart";
let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
const cartBtn = document.getElementById("cartBtn");
const cartBadge = document.getElementById("cartBadge");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartClose = document.getElementById("cartClose");
const cartListView = document.getElementById("cartListView");
const cartCheckoutView = document.getElementById("cartCheckoutView");
const cartItemsList = document.getElementById("cartItemsList");
const cartEmpty = document.getElementById("cartEmpty");
const cartSummary = document.getElementById("cartSummary");
const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
const cartClearBtn = document.getElementById("cartClearBtn");
const backToCartBtn = document.getElementById("backToCartBtn");
const cartCheckoutForm = document.getElementById("cartCheckoutForm");
const cartSubmitBtn = document.getElementById("cartSubmitBtn");
const cartFormStatus = document.getElementById("cartFormStatus");
const cartCheckoutSummary = document.getElementById("cartCheckoutSummary");

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  if (!cartBadge) return;
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartBadge.textContent = String(count);
  cartBadge.style.display = count > 0 ? "flex" : "none";
}

// Caps a cart line's quantity at the real stock for its exact size/color
// (made-to-order items, which have no size/color, are left uncapped here).
function clampCartItemToStock(item) {
  if (!item.selectedSize && !item.selectedColor) return;
  const product = allProducts.find(p => p.id === item.productId);
  if (!product || product.availability !== "ready_stock") return;
  const maxStock = getVariantStock(product, item.selectedSize || null, item.selectedColor || null);
  if (item.quantity > maxStock) item.quantity = Math.max(1, maxStock);
}

// Adding the same product+variant twice used to create two separate cart
// lines, each individually capped at stock — so two lines of "2" could add
// up to 4 units of something only 2 are in stock of. Merging into one line
// (and re-clamping the combined total) makes that impossible.
function addToCart(item) {
  const existing = cart.find(c =>
    c.productId === item.productId &&
    (c.selectedSize || null) === (item.selectedSize || null) &&
    (c.selectedColor || null) === (item.selectedColor || null) &&
    (c.material || null) === (item.material || null)
  );
  if (existing) {
    existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    clampCartItemToStock(existing);
  } else {
    cart.push(item);
    clampCartItemToStock(item);
  }
  saveCart();
}

// Quick-add straight from the gallery card, no need to open the product first.
// Custom (made-to-order) pieces need no choices, so they add right away; a
// ready-stock piece adds its first in-stock size/color combo as a sensible
// default — the shopper can still remove/adjust size/color from the cart, or
// open the piece normally to pick a specific one before ordering. The
// quantity itself comes from the stepper right on the card.
function quickAddToCart(product, quantity, size, color) {
  const qty = Math.max(1, quantity || 1);
  if (product.availability === "ready_stock") {
    const variant = (size || color)
      ? (product.variants || []).find(v => (v.size || null) === (size || null) && (v.color || null) === (color || null))
      : firstAddableVariant(product);
    if (!variant) return;
    const available = getAvailableToAdd(product, variant.size || null, variant.color || null);
    if (available <= 0) return;
    addToCart({
      productId: product.id,
      orderType: "ready_stock",
      selectedSize: variant.size || null,
      selectedColor: variant.color || null,
      quantity: Math.min(qty, available)
    });
  } else {
    addToCart({ productId: product.id, material: "unspecified", quantity: qty });
  }
  showToastPublic(t("cart_added_toast"));
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCartList();
}

function changeCartQty(index, delta) {
  const item = cart[index];
  if (!item) return;
  item.quantity = Math.max(1, (item.quantity || 1) + delta);
  clampCartItemToStock(item);
  saveCart();
  renderCartList();
}

function cartItemVariantLabel(item, product) {
  const parts = [];
  if (item.selectedSize) parts.push(item.selectedSize);
  if (item.selectedColor) parts.push(item.selectedColor);
  if (!item.selectedSize && !item.selectedColor && item.material && item.material !== "unspecified") {
    parts.push(t(`material_${item.material}`));
  }
  return parts.join(" · ");
}

// Merges any duplicate lines already sitting in someone's cart from before
// addToCart started merging on its own (e.g. two "M · Black" lines of 2 each
// on a piece with only 2 in stock), then re-clamps the merged total.
function normalizeCart() {
  const merged = [];
  cart.forEach((item) => {
    const existing = merged.find(m =>
      m.productId === item.productId &&
      (m.selectedSize || null) === (item.selectedSize || null) &&
      (m.selectedColor || null) === (item.selectedColor || null) &&
      (m.material || null) === (item.material || null)
    );
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      merged.push(item);
    }
  });
  merged.forEach(clampCartItemToStock);
  if (merged.length !== cart.length) {
    cart = merged;
    saveCart();
  } else {
    cart = merged;
  }
}

function renderCartList() {
  if (!cartItemsList) return;
  normalizeCart();
  cartItemsList.innerHTML = "";

  if (cart.length === 0) {
    cartEmpty.style.display = "block";
    cartSummary.style.display = "none";
    return;
  }
  cartEmpty.style.display = "none";
  cartSummary.style.display = "block";

  cart.forEach((item, index) => {
    const product = allProducts.find(p => p.id === item.productId);
    const thumbSrc = product && product.images && product.images[0] ? product.images[0] : "";
    const thumbFocus = product && product.imageFocus ? product.imageFocus : "top";
    const thumbHtml = thumbSrc
      ? `<img class="cart-item-thumb" src="${escapeHtml(thumbSrc)}" alt="" style="object-position: center ${escapeHtml(thumbFocus)};" loading="lazy" />`
      : `<div class="cart-item-thumb cart-item-thumb-empty"></div>`;
    const priceText = product
      ? formatPrice(product.salePrice || product.priceRange) || ""
      : "";
    const variantLabel = cartItemVariantLabel(item, product);

    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      ${thumbHtml}
      <div class="cart-item-body">
        <p class="cart-item-name">${escapeHtml(product ? product.name : t("piece_category_fallback"))}</p>
        ${variantLabel ? `<p class="cart-item-variant">${escapeHtml(variantLabel)}</p>` : ""}
        ${priceText ? `<p class="cart-item-price">${escapeHtml(priceText)}</p>` : ""}
        <div class="cart-item-recipient">
          <label class="cart-item-recipient-toggle">
            <input type="checkbox" data-recipient-toggle="${index}" ${item.shipToOther ? "checked" : ""} />
            <span>${escapeHtml(t("ship_to_other_toggle"))}</span>
          </label>
          <div class="cart-item-recipient-fields" style="display:${item.shipToOther ? "flex" : "none"};">
            <input type="text" data-recipient-name="${index}" value="${escapeHtml(item.recipientName || "")}" placeholder="${escapeHtml(t("recipient_name_label"))}" />
            <input type="tel" data-recipient-phone="${index}" value="${escapeHtml(item.recipientPhone || "")}" placeholder="${escapeHtml(t("recipient_phone_label"))}" />
            <input type="text" data-recipient-address="${index}" value="${escapeHtml(item.recipientAddress || "")}" placeholder="${escapeHtml(t("recipient_address_label"))}" />
          </div>
        </div>
      </div>
      <div class="cart-item-actions">
        <div class="cart-qty-stepper">
          <button type="button" class="cart-qty-btn" data-qty-down="${index}" aria-label="-">−</button>
          <span class="cart-qty-value">${item.quantity || 1}</span>
          <button type="button" class="cart-qty-btn" data-qty-up="${index}" aria-label="+">+</button>
        </div>
        <button type="button" class="btn-link cart-remove-btn" data-remove="${index}">${escapeHtml(t("cart_remove"))}</button>
      </div>
    `;
    cartItemsList.appendChild(row);
  });

  cartItemsList.querySelectorAll("[data-qty-down]").forEach((btn) => {
    btn.addEventListener("click", () => changeCartQty(parseInt(btn.dataset.qtyDown, 10), -1));
  });
  cartItemsList.querySelectorAll("[data-qty-up]").forEach((btn) => {
    btn.addEventListener("click", () => changeCartQty(parseInt(btn.dataset.qtyUp, 10), 1));
  });
  cartItemsList.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(parseInt(btn.dataset.remove, 10)));
  });
  cartItemsList.querySelectorAll("[data-recipient-toggle]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const idx = parseInt(cb.dataset.recipientToggle, 10);
      if (cart[idx]) cart[idx].shipToOther = cb.checked;
      saveCart();
      renderCartList();
    });
  });
  cartItemsList.querySelectorAll("[data-recipient-name]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const idx = parseInt(inp.dataset.recipientName, 10);
      if (cart[idx]) cart[idx].recipientName = inp.value;
      saveCart();
    });
  });
  cartItemsList.querySelectorAll("[data-recipient-phone]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const idx = parseInt(inp.dataset.recipientPhone, 10);
      if (cart[idx]) cart[idx].recipientPhone = inp.value;
      saveCart();
    });
  });
  cartItemsList.querySelectorAll("[data-recipient-address]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const idx = parseInt(inp.dataset.recipientAddress, 10);
      if (cart[idx]) cart[idx].recipientAddress = inp.value;
      saveCart();
    });
  });
}

function showCartListView() {
  cartListView.style.display = "block";
  cartCheckoutView.style.display = "none";
  renderCartList();
}

function showCartCheckoutView() {
  cartListView.style.display = "none";
  cartCheckoutView.style.display = "block";
  cartFormStatus.className = "form-status";
  cartFormStatus.textContent = "";
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartCheckoutSummary.textContent = t("cart_checkout_summary").replace("{count}", count);

  if (typeof currentClientProfile !== "undefined" && currentClientProfile) {
    document.getElementById("cartClientName").value = currentClientProfile.name || "";
    document.getElementById("cartClientPhone").value = currentClientProfile.phone || "";
    document.getElementById("cartClientAddress").value = currentClientProfile.address || "";
  }
}

function openCartModal() {
  showCartListView();
  cartBackdrop.classList.add("open");
}

cartBtn?.addEventListener("click", openCartModal);
cartClose?.addEventListener("click", () => cartBackdrop.classList.remove("open"));
cartBackdrop?.addEventListener("click", (e) => {
  if (e.target === cartBackdrop) cartBackdrop.classList.remove("open");
});
cartCheckoutBtn?.addEventListener("click", showCartCheckoutView);
backToCartBtn?.addEventListener("click", showCartListView);
cartClearBtn?.addEventListener("click", () => {
  if (!confirm(t("cart_clear_confirm"))) return;
  cart = [];
  saveCart();
  renderCartList();
});

updateCartBadge();

function showToastPublic(message) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function shareProduct(product) {
  const url = `${location.origin}${location.pathname}?product=${product.id}`;
  const priceText = product.salePrice
    ? formatPrice(product.salePrice)
    : (product.priceRange ? formatPrice(product.priceRange) : "");
  const text = `${product.name}${priceText ? " — " + priceText : ""}`;

  if (navigator.share) {
    navigator.share({ title: product.name, text, url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToastPublic(t("share_copied"))).catch(() => {});
  }
}
let activeFilter = "all";
let activeCollection = "all";
let saleOnly = false;
let readyOnly = false;
let favOnly = false;
let loadFailed = false;
let currentProduct = null;
let currentImageIndex = 0;

function renderCarousel() {
  const images = (currentProduct && currentProduct.images) || [];
  if (images.length === 0) {
    detailCarouselImage.innerHTML = `<span>${escapeHtml(currentProduct ? currentProduct.name : "")}</span>`;
    detailCarouselImage.style.cursor = "default";
    if (zoomHint) zoomHint.style.display = "none";
  } else {
    detailCarouselImage.innerHTML = `<img src="${escapeHtml(images[currentImageIndex])}" alt="${escapeHtml(currentProduct.name)}" />`;
    detailCarouselImage.style.cursor = "zoom-in";
    if (zoomHint) zoomHint.style.display = "flex";
  }

  const showNav = images.length > 1;
  carouselPrev.style.display = showNav ? "flex" : "none";
  carouselNext.style.display = showNav ? "flex" : "none";

  carouselDots.innerHTML = "";
  if (showNav) {
    images.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "carousel-dot" + (i === currentImageIndex ? " active" : "");
      carouselDots.appendChild(dot);
    });
  }

  if (imageLightbox.classList.contains("open")) {
    renderLightboxImage();
  }
}

function stepImage(delta) {
  const images = (currentProduct && currentProduct.images) || [];
  if (images.length < 2) return;
  currentImageIndex = (currentImageIndex + delta + images.length) % images.length;
  renderCarousel();
}

carouselPrev.addEventListener("click", () => stepImage(-1));
carouselNext.addEventListener("click", () => stepImage(1));

// ---------- Image lightbox ----------

function renderLightboxImage() {
  const images = (currentProduct && currentProduct.images) || [];
  if (images.length === 0) return;
  lightboxImage.src = images[currentImageIndex];
  lightboxImage.alt = currentProduct.name;
  const showNav = images.length > 1;
  lightboxPrev.style.display = showNav ? "flex" : "none";
  lightboxNext.style.display = showNav ? "flex" : "none";
}

function openLightbox() {
  const images = (currentProduct && currentProduct.images) || [];
  if (images.length === 0) return;
  renderLightboxImage();
  imageLightbox.classList.add("open");
}

function closeLightbox() {
  imageLightbox.classList.remove("open");
}

detailCarouselImage.addEventListener("click", () => {
  if (detailCarouselImage.dataset.justSwiped) return;
  openLightbox();
});
lightboxClose.addEventListener("click", closeLightbox);
imageLightbox.addEventListener("click", (e) => {
  if (e.target === imageLightbox) closeLightbox();
});
lightboxPrev.addEventListener("click", () => stepImage(-1));
lightboxNext.addEventListener("click", () => stepImage(1));

// Touch-swipe support for the product carousel and lightbox — the on-image
// prev/next arrows stay as-is, this just adds swipe as an equally valid way
// to move between photos, matching how every phone photo viewer behaves.
function addSwipeNavigation(el) {
  let startX = 0, startY = 0;
  el.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      stepImage(dx < 0 ? 1 : -1);
      el.dataset.justSwiped = "1";
      setTimeout(() => { delete el.dataset.justSwiped; }, 300);
    }
  });
}
addSwipeNavigation(detailCarouselImage);
addSwipeNavigation(lightboxImage);

function showDetailView() {
  detailView.style.display = "block";
  requestView.style.display = "none";
}

function showRequestView() {
  detailView.style.display = "none";
  requestView.style.display = "block";
  if (currentProduct) {
    modalPieceName.textContent = currentProduct.name;
    productIdField.value = currentProduct.id;
  }
  formStatus.className = "form-status";
  formStatus.textContent = "";
  document.getElementById("clientLocationUrl").value = "";
  document.getElementById("shareLocationStatus").textContent = "";
  document.getElementById("shareLocationConfirm").style.display = "none";
  document.getElementById("locationMapWrap").style.display = "none";
  document.getElementById("locationMap")?.classList.remove("location-map-pulse");
  if (locationMap && locationMarker) {
    locationMap.removeLayer(locationMarker);
  }
  locationMarker = null;

  if (typeof currentClientProfile !== "undefined" && currentClientProfile) {
    document.getElementById("clientName").value = currentClientProfile.name || "";
    document.getElementById("clientPhone").value = currentClientProfile.phone || "";
    document.getElementById("clientAddress").value = currentClientProfile.address || "";
  }
}

detailRequestBtn.addEventListener("click", showRequestView);

// "Have a design in mind?" — same request form/collection as a catalog piece,
// just with no product attached and a required description of the idea up
// front instead of a piece name, so staff can review and reach out if it's
// something they can make.
function openCustomDesignModal() {
  currentProduct = null;
  requestForm.reset();
  productIdField.value = "";
  document.getElementById("recipientFieldsWrap").style.display = "none";
  modalPieceName.style.display = "none";
  requestViewTitle.style.display = "none";
  requestViewTitleCustom.style.display = "";
  backToDetailBtn.style.display = "none";
  customDesignFieldWrap.style.display = "block";
  customDesignDescriptionField.required = true;

  showRequestView();
  modalBackdrop.classList.add("open");
}
customDesignBtn?.addEventListener("click", openCustomDesignModal);

document.getElementById("shipToOtherToggle")?.addEventListener("change", (e) => {
  document.getElementById("recipientFieldsWrap").style.display = e.target.checked ? "block" : "none";
});

// Map pin picker — a free (no API key) alternative to typing an address or
// using one-tap geolocation, for clients who'd rather just point at their spot.
let locationMap = null;
let locationMarker = null;
const ALEXANDRIA_COORDS = [31.2001, 29.9187];

function ensureLocationMap() {
  if (locationMap) return;
  locationMap = L.map("locationMap").setView(ALEXANDRIA_COORDS, 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(locationMap);
  locationMap.on("click", (e) => placeMapMarker(e.latlng.lat, e.latlng.lng));
}

// A quick, unmistakable "yes, we've got it" moment — the same draw-in
// checkmark used for request/cart success, replayed inline, plus a brief
// pulse ring around the map so the pin itself is what catches the eye.
function playLocationConfirmedAnimation() {
  const confirmWrap = document.getElementById("shareLocationConfirm");
  if (confirmWrap) {
    confirmWrap.style.display = "inline-flex";
    const oldSvg = confirmWrap.querySelector("svg");
    if (oldSvg) confirmWrap.replaceChild(oldSvg.cloneNode(true), oldSvg);
  }
  const mapEl = document.getElementById("locationMap");
  if (mapEl) {
    mapEl.classList.remove("location-map-pulse");
    void mapEl.offsetWidth; // restart the animation even if it just played
    mapEl.classList.add("location-map-pulse");
  }
}

function setLocationPin(lat, lng) {
  document.getElementById("clientLocationUrl").value = `https://maps.google.com/?q=${lat},${lng}`;
  document.getElementById("shareLocationStatus").textContent = t("share_location_success");
  playLocationConfirmedAnimation();
}

function placeMapMarker(lat, lng) {
  if (locationMarker) {
    locationMarker.setLatLng([lat, lng]);
  } else {
    locationMarker = L.marker([lat, lng], { draggable: true }).addTo(locationMap);
    locationMarker.on("dragend", () => {
      const pos = locationMarker.getLatLng();
      setLocationPin(pos.lat, pos.lng);
    });
  }
  setLocationPin(lat, lng);
}

document.getElementById("shareLocationBtn")?.addEventListener("click", () => {
  const btn = document.getElementById("shareLocationBtn");
  const status = document.getElementById("shareLocationStatus");
  if (!navigator.geolocation) {
    status.textContent = t("share_location_error");
    return;
  }
  btn.disabled = true;
  status.textContent = t("share_location_loading");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      document.getElementById("locationMapWrap").style.display = "block";
      ensureLocationMap();
      locationMap.setView([latitude, longitude], 15);
      placeMapMarker(latitude, longitude);
      setTimeout(() => locationMap.invalidateSize(), 50);
      btn.disabled = false;
    },
    () => {
      status.textContent = t("share_location_error");
      btn.disabled = false;
    }
  );
});

document.getElementById("pickMapLocationBtn")?.addEventListener("click", () => {
  const wrap = document.getElementById("locationMapWrap");
  if (wrap.style.display !== "none") {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";
  ensureLocationMap();
  setTimeout(() => locationMap.invalidateSize(), 50);
});

backToDetailBtn.addEventListener("click", showDetailView);

function getVariantStock(product, size, color) {
  return (product.variants || [])
    .filter(v => (!size || v.size === size) && (!color || v.color === color))
    .reduce((sum, v) => sum + (v.stock || 0), 0);
}

// How much of this exact size/color is already sitting in the cart (this
// shopper's own, since the cart is local-only) — needed so "how many can I
// still add" accounts for what they've already reserved, not just raw stock.
function getCartQtyForVariant(productId, size, color) {
  return cart
    .filter(c => c.productId === productId && (c.selectedSize || null) === (size || null) && (c.selectedColor || null) === (color || null))
    .reduce((sum, c) => sum + (c.quantity || 0), 0);
}

function getAvailableToAdd(product, size, color) {
  return Math.max(0, getVariantStock(product, size, color) - getCartQtyForVariant(product.id, size, color));
}

// Owner-configurable in Admin → Settings → Inventory; 0 turns the low-stock
// badge off entirely (a genuinely sold-out item still shows Sold Out).
function getLowStockThreshold() {
  const v = typeof currentSettings !== "undefined" ? currentSettings.lowStockThreshold : null;
  return v == null || v === "" ? 3 : Number(v);
}

// The variant quick-add would pick automatically (first one with anything
// left to add), or null if every variant is either out of stock or already
// fully reserved in the cart.
function firstAddableVariant(product) {
  return (product.variants || []).find(v => getAvailableToAdd(product, v.size || null, v.color || null) > 0) || null;
}

function addableVariantsFor(product) {
  return (product.variants || []).filter(v => getAvailableToAdd(product, v.size || null, v.color || null) > 0);
}

// Gallery-card quick-add size/color picker — only needed when a piece has
// more than one addable size or color; a single combo is just shown as a
// label so shoppers can still see it without opening the full detail view.
function buildQuickVariantHtml(product) {
  const addable = addableVariantsFor(product);
  const allSizes = [...new Set(addable.filter(v => v.size).map(v => v.size))];
  const allColors = [...new Set(addable.filter(v => v.color).map(v => v.color))];
  const showSizeSelect = allSizes.length > 1;
  const showColorSelect = allColors.length > 1;
  if (!showSizeSelect && !showColorSelect) {
    const label = [allSizes[0], allColors[0]].filter(Boolean).join(" · ");
    return label ? `<span class="piece-quick-variant-label">${escapeHtml(label)}</span>` : "";
  }
  const sizePart = showSizeSelect
    ? `<select class="piece-quick-size" aria-label="${escapeHtml(t("label_size"))}">${allSizes.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("")}</select>`
    : (allSizes[0] ? `<span class="piece-quick-variant-label">${escapeHtml(allSizes[0])}</span>` : "");
  const colorPart = showColorSelect
    ? `<select class="piece-quick-color" aria-label="${escapeHtml(t("label_color"))}"></select>`
    : (allColors[0] ? `<span class="piece-quick-variant-label">${escapeHtml(allColors[0])}</span>` : "");
  return `<div class="piece-quick-variant-row">${sizePart}${colorPart}</div>`;
}

// Wires the selects built above (if any) to an internal {size, color} state,
// cascading color options to whatever the chosen size still has in stock.
function setupCardVariantPicker(card, product, onChange) {
  const addable = addableVariantsFor(product);
  const allSizes = [...new Set(addable.filter(v => v.size).map(v => v.size))];
  const state = { size: allSizes[0] || null, color: null };
  const sizeSel = card.querySelector(".piece-quick-size");
  const colorSel = card.querySelector(".piece-quick-color");

  function colorsForSize(size) {
    return [...new Set(addable.filter(v => v.color && (!size || v.size === size)).map(v => v.color))];
  }

  function refreshColors() {
    const colors = colorsForSize(state.size);
    if (colorSel) {
      colorSel.innerHTML = colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
      state.color = colors[0] || null;
      colorSel.value = state.color || "";
    } else {
      state.color = colors[0] || null;
    }
  }

  if (sizeSel) {
    sizeSel.addEventListener("click", (e) => e.stopPropagation());
    sizeSel.addEventListener("change", () => {
      state.size = sizeSel.value;
      refreshColors();
      onChange();
    });
  }
  if (colorSel) {
    colorSel.addEventListener("click", (e) => e.stopPropagation());
    colorSel.addEventListener("change", () => {
      state.color = colorSel.value;
      onChange();
    });
  }
  refreshColors();
  return state;
}

function populateOrderQuantity(maxQty) {
  const qtySelect = document.getElementById("orderQuantity");
  const max = Math.max(1, Math.min(maxQty, 10));
  qtySelect.innerHTML = Array.from({ length: max }, (_, i) => i + 1)
    .map(n => `<option value="${n}">${n}</option>`).join("");
}

function updateOrderQuantityForSelection(product) {
  const size = document.getElementById("orderSize").value;
  const color = document.getElementById("orderColor").value;
  populateOrderQuantity(getAvailableToAdd(product, size || null, color || null) || 1);
}

function refreshOrderColorOptions(product) {
  const selectedSize = document.getElementById("orderSize").value;
  const colorSelect = document.getElementById("orderColor");
  const colors = [...new Set(
    (product.variants || [])
      .filter(v => v.color && v.stock > 0 && (!selectedSize || v.size === selectedSize))
      .map(v => v.color)
  )];
  colorSelect.innerHTML = colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  document.getElementById("orderColorWrap").style.display = colors.length > 0 ? "block" : "none";
  updateOrderQuantityForSelection(product);
}

function setupVariantSelectors(product) {
  const wrap = document.getElementById("orderVariantWrap");
  // Always show at least a quantity picker — even a made-to-order piece can
  // reasonably be wanted "2 of", and this is also what Add to Cart reads.
  wrap.style.display = "block";

  if (product.availability !== "ready_stock") {
    document.getElementById("orderSizeWrap").style.display = "none";
    document.getElementById("orderColorWrap").style.display = "none";
    document.getElementById("orderSize").onchange = null;
    document.getElementById("orderColor").onchange = null;
    populateOrderQuantity(10);
    return;
  }

  const sizeSelect = document.getElementById("orderSize");
  const sizes = [...new Set((product.variants || []).filter(v => v.size && v.stock > 0).map(v => v.size))];
  sizeSelect.innerHTML = sizes.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  document.getElementById("orderSizeWrap").style.display = sizes.length > 0 ? "block" : "none";

  sizeSelect.onchange = () => refreshOrderColorOptions(product);
  document.getElementById("orderColor").onchange = () => updateOrderQuantityForSelection(product);

  refreshOrderColorOptions(product);
}

function openModal(product) {
  currentProduct = product;
  currentImageIndex = 0;

  modalPieceName.style.display = "";
  requestViewTitle.style.display = "";
  requestViewTitleCustom.style.display = "none";
  backToDetailBtn.style.display = "";
  customDesignFieldWrap.style.display = "none";
  customDesignDescriptionField.required = false;

  detailCategory.textContent = product.category || t("piece_category_fallback");
  detailName.textContent = product.name;
  if (product.salePrice) {
    const detailDiscount = calcDiscountPercent(product.priceRange, product.salePrice);
    detailPrice.className = "piece-price piece-price-row";
    detailPrice.innerHTML = `<span class="piece-price-sale"><bdi>${escapeHtml(formatPrice(product.salePrice))}</bdi></span><span class="piece-price-original"><bdi>${escapeHtml(formatPrice(product.priceRange) || "")}</bdi></span>${detailDiscount ? `<span class="piece-price-off">-${detailDiscount}%</span>` : ""}`;
    detailPrice.style.display = "";
  } else {
    detailPrice.className = "piece-price";
    detailPrice.textContent = formatPrice(product.priceRange) || "";
    detailPrice.style.display = product.priceRange ? "block" : "none";
  }
  detailDescription.textContent = product.description || "";
  renderCarousel();

  const totalStock = product.availability === "ready_stock"
    ? (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)
    : null;
  if (product.availability === "ready_stock" && totalStock === 0) {
    detailRequestBtn.textContent = t("sold_out_label");
    detailRequestBtn.disabled = true;
  } else {
    detailRequestBtn.textContent = t(product.availability === "ready_stock" ? "detail_cta_order" : "detail_cta_request");
    detailRequestBtn.disabled = false;
  }

  requestForm.reset();
  productIdField.value = product.id; // reset() clears hidden fields too, so set again
  document.getElementById("recipientFieldsWrap").style.display = "none";
  setupVariantSelectors(product);
  // "Order This Item" is a separate, independent immediate order (not tied
  // to the cart), so it only cares about genuine sold-out. Add to Cart also
  // needs to disappear once this shopper's own cart already holds every
  // unit left, even if the product itself technically still has stock.
  const remainingForCart = product.availability === "ready_stock"
    ? (product.variants || []).reduce((sum, v) => sum + getAvailableToAdd(product, v.size || null, v.color || null), 0)
    : null;
  if (product.availability === "ready_stock" && (totalStock === 0 || remainingForCart <= 0)) {
    document.getElementById("orderVariantWrap").style.display = "none";
    if (addToCartBtn) addToCartBtn.style.display = "none";
  } else if (addToCartBtn) {
    addToCartBtn.style.display = "";
  }
  if (cartAddStatus) {
    cartAddStatus.className = "form-status";
    cartAddStatus.textContent = "";
  }

  showDetailView();
  modalBackdrop.classList.add("open");
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  closeLightbox();
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// successBackdrop open/close is handled generically in account.js (shared across all pages)
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (imageLightbox.classList.contains("open")) {
    closeLightbox();
  } else {
    closeModal();
  }
});

function getCollectionFilteredProducts() {
  return activeCollection === "all"
    ? allProducts
    : allProducts.filter(p => p.collectionId === activeCollection);
}

function refreshCollectionAndCategoryUI() {
  const categories = [...new Set(getCollectionFilteredProducts().map(p => p.category).filter(Boolean))];
  renderCombinedFilters(categories);
  renderGallery();
}

// Collections and categories are two different, unbounded-growth lists — a row of chips
// that keeps adding a button per item gets unreadable and hard to tap on mobile as the
// owner adds more of them. Two native <select> dropdowns scale to any number of options,
// give a large native touch target, and take up a fixed, predictable amount of space.
function renderCombinedFilters(categories) {
  filterRow.innerHTML = "";

  if (allCollections.length > 0) {
    const collectionSelect = document.createElement("select");
    collectionSelect.className = "filter-select";
    collectionSelect.setAttribute("aria-label", t("filter_group_collections"));
    collectionSelect.innerHTML = `<option value="all">${escapeHtml(t("filter_all_collections"))}</option>` +
      allCollections.map(c => `<option value="${escapeHtml(c.id)}"${c.id === activeCollection ? " selected" : ""}>${escapeHtml(c.name)}</option>`).join("");
    collectionSelect.addEventListener("change", () => {
      activeCollection = collectionSelect.value;
      activeFilter = "all";
      refreshCollectionAndCategoryUI();
    });
    filterRow.appendChild(collectionSelect);
  }

  if (categories.length > 0) {
    const categorySelect = document.createElement("select");
    categorySelect.className = "filter-select";
    categorySelect.setAttribute("aria-label", t("filter_group_categories"));
    categorySelect.innerHTML = `<option value="all">${escapeHtml(t("filter_all_types"))}</option>` +
      categories.map(cat => `<option value="${escapeHtml(cat)}"${cat === activeFilter ? " selected" : ""}>${escapeHtml(cat)}</option>`).join("");
    categorySelect.addEventListener("change", () => {
      activeFilter = categorySelect.value;
      refreshCollectionAndCategoryUI();
    });
    filterRow.appendChild(categorySelect);
  }

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "filter-chip filter-chip-fav" + (favOnly ? " active" : "");
  favBtn.textContent = t("filter_favorites");
  favBtn.addEventListener("click", () => {
    favOnly = !favOnly;
    refreshCollectionAndCategoryUI();
  });
  filterRow.appendChild(favBtn);

  const saleBtn = document.createElement("button");
  saleBtn.type = "button";
  saleBtn.className = "filter-chip filter-chip-sale" + (saleOnly ? " active" : "");
  saleBtn.textContent = t("filter_sale");
  saleBtn.addEventListener("click", () => {
    saleOnly = !saleOnly;
    refreshCollectionAndCategoryUI();
  });
  filterRow.appendChild(saleBtn);

  const readyBtn = document.createElement("button");
  readyBtn.type = "button";
  readyBtn.className = "filter-chip filter-chip-ready" + (readyOnly ? " active" : "");
  readyBtn.textContent = t("filter_ready_stock");
  readyBtn.addEventListener("click", () => {
    readyOnly = !readyOnly;
    refreshCollectionAndCategoryUI();
  });
  filterRow.appendChild(readyBtn);
}

function renderGallery() {
  if (loadFailed) {
    emptyState.style.display = "block";
    emptyState.textContent = t("empty_state_error");
    return;
  }

  const collectionFiltered = getCollectionFilteredProducts();
  const categoryFiltered = activeFilter === "all"
    ? collectionFiltered
    : collectionFiltered.filter(p => p.category === activeFilter);

  const saleFiltered = saleOnly ? categoryFiltered.filter(p => p.salePrice) : categoryFiltered;
  const readyFiltered = readyOnly ? saleFiltered.filter(p => p.availability === "ready_stock") : saleFiltered;
  const favFiltered = favOnly ? readyFiltered.filter(p => likedProducts.has(p.id)) : readyFiltered;

  const searchQuery = (productSearchInput?.value || "").trim().toLowerCase();
  const filtered = searchQuery
    ? favFiltered.filter(p => {
        const collectionName = allCollections.find(c => c.id === p.collectionId)?.name || "";
        return `${p.name || ""} ${p.category || ""} ${p.description || ""} ${collectionName} ${p.productCode || ""}`
          .toLowerCase().includes(searchQuery);
      })
    : favFiltered;

  galleryGrid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    const onlyFavFilterActive = favOnly && activeCollection === "all" && activeFilter === "all" && !saleOnly && !readyOnly && !searchQuery;
    const filtersActive = activeCollection !== "all" || activeFilter !== "all" || saleOnly || readyOnly || favOnly || Boolean(searchQuery);
    if (onlyFavFilterActive) {
      emptyState.innerHTML = `<p>${escapeHtml(t("empty_state_favorites"))}</p><button type="button" class="btn-link" id="clearFiltersBtn">${escapeHtml(t("empty_state_clear"))}</button>`;
      document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        favOnly = false;
        refreshCollectionAndCategoryUI();
      });
    } else if (filtersActive) {
      emptyState.innerHTML = `<p>${escapeHtml(t("empty_state_filtered"))}</p><button type="button" class="btn-link" id="clearFiltersBtn">${escapeHtml(t("empty_state_clear"))}</button>`;
      document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        activeCollection = "all";
        activeFilter = "all";
        saleOnly = false;
        readyOnly = false;
        favOnly = false;
        if (productSearchInput) productSearchInput.value = "";
        refreshCollectionAndCategoryUI();
      });
    } else {
      emptyState.textContent = t("empty_state");
    }
    return;
  }
  emptyState.style.display = "none";

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "piece-card";
    const onSale = Boolean(product.salePrice);
    const discountPercent = onSale ? calcDiscountPercent(product.priceRange, product.salePrice) : null;
    const priceHtml = onSale
      ? `<p class="piece-price piece-price-row"><span class="piece-price-sale"><bdi>${escapeHtml(formatPrice(product.salePrice))}</bdi></span><span class="piece-price-original"><bdi>${escapeHtml(formatPrice(product.priceRange) || "")}</bdi></span></p>`
      : (product.priceRange ? `<p class="piece-price">${escapeHtml(formatPrice(product.priceRange))}</p>` : "");
    const collectionName = product.collectionId ? allCollections.find(c => c.id === product.collectionId)?.name : null;
    const isLiked = likedProducts.has(product.id);
    const isReady = product.availability === "ready_stock";
    const totalStock = isReady ? (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0) : 0;
    const isSoldOut = isReady && totalStock === 0;
    // Stock genuinely left to add — separate from totalStock, since anything
    // already sitting in this shopper's own cart shouldn't still look
    // available to quick-add more of.
    const remainingToAdd = isReady
      ? (product.variants || []).reduce((sum, v) => sum + getAvailableToAdd(product, v.size || null, v.color || null), 0)
      : 0;
    const isFullyReserved = isReady && !isSoldOut && remainingToAdd <= 0;
    const lowStockThreshold = getLowStockThreshold();
    const isLowStock = isReady && lowStockThreshold > 0 && remainingToAdd > 0 && remainingToAdd <= lowStockThreshold;
    const canQuickAdd = !isSoldOut && !isFullyReserved;
    const badgeHtml = isSoldOut
      ? `<span class="sold-out-badge">${escapeHtml(t("sold_out_label"))}</span>`
      : isFullyReserved
        ? `<span class="sold-out-badge">${escapeHtml(t("in_cart_badge"))}</span>`
        : isLowStock
          ? `<span class="low-stock-badge">${escapeHtml(t("stock_left_label").replace("{count}", remainingToAdd))}</span>`
          : `<span class="ready-badge">${escapeHtml(t("ready_badge"))}</span>`;
    card.innerHTML = `
      <div class="piece-media">
        ${onSale ? `<span class="sale-badge">${discountPercent ? `-${discountPercent}%` : t("sale_badge")}</span>` : ""}
        <div class="piece-card-actions">
          <button type="button" class="piece-action-btn piece-like-btn${isLiked ? " liked" : ""}" aria-label="${escapeHtml(t("like_label"))}">
            <svg viewBox="0 0 24 24"><path d="M12 21s-6.72-4.35-9.33-8.2C1 10.1 1.6 6.6 4.5 5a5 5 0 0 1 7.5 1.8A5 5 0 0 1 19.5 5c2.9 1.6 3.5 5.1 1.83 7.8C18.72 16.65 12 21 12 21Z"/></svg>
          </button>
          <button type="button" class="piece-action-btn piece-share-btn" aria-label="${escapeHtml(t("share_label"))}">
            <svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .05 2.06L8.91 9.51a3 3 0 1 0 0 4.98l6.14 3.45A3 3 0 1 0 15.83 16l-6.14-3.45a3.04 3.04 0 0 0 0-1.1L15.83 8A2.99 2.99 0 0 0 18 8Z"/></svg>
          </button>
        </div>
        ${product.images && product.images[0]
          ? `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" loading="lazy" style="object-position: center ${escapeHtml(product.imageFocus || "top")};" />`
          : `<span>${escapeHtml(product.name)}</span>`}
      </div>
      <div class="piece-body">
        <p class="piece-eyebrow">${escapeHtml(product.category || t("piece_category_fallback"))}${collectionName ? ` <span class="piece-collection-tag">· ${escapeHtml(collectionName)}</span>` : ""}${isReady ? ` ${badgeHtml}` : ""}</p>
        <h3 class="piece-name">${escapeHtml(product.name)}</h3>
        <p class="piece-desc">${escapeHtml(product.description || "")}</p>
        <div class="piece-body-bottom">
          ${priceHtml}
          ${canQuickAdd ? `
            <div class="piece-quickcart-row">
              ${isReady ? buildQuickVariantHtml(product) : ""}
              <div class="piece-qty-stepper">
                <button type="button" class="piece-qty-btn" data-qty-down aria-label="-">−</button>
                <span class="piece-qty-value">1</span>
                <button type="button" class="piece-qty-btn" data-qty-up aria-label="+">+</button>
              </div>
              <button type="button" class="piece-quickcart-btn" aria-label="${escapeHtml(t("cart_quick_add"))}">🛍 ${escapeHtml(t("cart_quick_add"))}</button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
    card.addEventListener("click", () => openModal(product));
    card.querySelector(".piece-like-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(product.id, e.currentTarget);
    });
    card.querySelector(".piece-share-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      shareProduct(product);
    });
    if (canQuickAdd) {
      const qtyValueEl = card.querySelector(".piece-qty-value");
      let variantState = { size: null, color: null };
      const getQuickMaxQty = () => isReady
        ? Math.max(1, getAvailableToAdd(product, variantState.size, variantState.color) || 1)
        : 10;
      if (isReady) {
        variantState = setupCardVariantPicker(card, product, () => {
          qtyValueEl.textContent = Math.min(parseInt(qtyValueEl.textContent, 10), getQuickMaxQty()) || 1;
        });
      }
      card.querySelector("[data-qty-down]").addEventListener("click", (e) => {
        e.stopPropagation();
        qtyValueEl.textContent = Math.max(1, parseInt(qtyValueEl.textContent, 10) - 1);
      });
      card.querySelector("[data-qty-up]").addEventListener("click", (e) => {
        e.stopPropagation();
        qtyValueEl.textContent = Math.min(getQuickMaxQty(), parseInt(qtyValueEl.textContent, 10) + 1);
      });
      card.querySelector(".piece-quickcart-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        quickAddToCart(product, parseInt(qtyValueEl.textContent, 10), variantState.size, variantState.color);
        qtyValueEl.textContent = "1";
      });
    }
    card.classList.add("reveal-hidden");
    galleryGrid.appendChild(card);
    galleryRevealObserver.observe(card);
  });
}

// Cards fade/slide into place as they scroll into view rather than all appearing at once.
const galleryRevealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove("reveal-hidden");
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

let deepLinkHandled = false;

function loadProducts() {
  db.collection("products")
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        loadFailed = false;
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        refreshCollectionAndCategoryUI();

        // A shared product link (?product=ID) opens straight to that piece's detail view.
        if (!deepLinkHandled && allProducts.length > 0) {
          deepLinkHandled = true;
          const sharedId = new URLSearchParams(location.search).get("product");
          const sharedProduct = sharedId ? allProducts.find(p => p.id === sharedId) : null;
          if (sharedProduct) openModal(sharedProduct);
        }
      },
      (err) => {
        console.error("Failed to load products:", err);
        loadFailed = true;
        renderGallery();
      }
    );
}

function loadCollections() {
  // Filtering status client-side (rather than .where("status","==","active")) avoids needing
  // a composite Firestore index — collections are publicly readable so this is safe either way.
  db.collection("collections")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        allCollections = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.status === "active");
        if (activeCollection !== "all" && !allCollections.some(c => c.id === activeCollection)) {
          activeCollection = "all";
        }
        refreshCollectionAndCategoryUI();
      },
      (err) => console.error("Collections listener error:", err)
    );
}

// A short, human-readable order number (e.g. "HM-260723-4821") shown to both
// the client (My Requests) and staff (admin Requests) — much easier to say
// over the phone or WhatsApp than a raw document ID or UUID cartId.
function generateOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HM-${y}${m}${d}-${rand}`;
}

requestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = t("submit_btn_sending");

  const product = allProducts.find(p => p.id === productIdField.value);

  const payload = {
    orderNumber: generateOrderNumber(),
    productId: productIdField.value || null,
    productName: product ? product.name : null,
    productCode: product ? (product.productCode || null) : null,
    clientName: document.getElementById("clientName").value.trim(),
    clientPhone: document.getElementById("clientPhone").value.trim(),
    clientAddress: document.getElementById("clientAddress").value.trim(),
    clientLocationUrl: document.getElementById("clientLocationUrl").value || null,
    material: document.getElementById("clientMaterial").value,
    preferredDate: document.getElementById("preferredDate").value || null,
    notes: document.getElementById("clientNotes").value.trim(),
    status: "new",
    clientUid: auth.currentUser ? auth.currentUser.uid : null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (product && product.availability === "ready_stock") {
    payload.orderType = "ready_stock";
    payload.selectedSize = document.getElementById("orderSize").value || null;
    payload.selectedColor = document.getElementById("orderColor").value || null;
    payload.quantity = parseInt(document.getElementById("orderQuantity").value, 10) || 1;
  }

  if (!currentProduct) {
    payload.requestType = "custom_design";
    payload.designDescription = customDesignDescriptionField.value.trim();
  }

  if (document.getElementById("shipToOtherToggle").checked) {
    payload.recipientName = document.getElementById("recipientName").value.trim() || null;
    payload.recipientPhone = document.getElementById("recipientPhone").value.trim() || null;
    payload.recipientAddress = document.getElementById("recipientAddress").value.trim() || null;
  }

  try {
    await db.collection("requests").add(payload);
    requestForm.reset();
    document.getElementById("recipientFieldsWrap").style.display = "none";
    closeModal();
    showSuccessPopup("submit_success_title", "submit_success");
  } catch (err) {
    console.error("Failed to submit request:", err);
    formStatus.className = "form-status error";
    formStatus.textContent = t("submit_error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t("submit_btn");
  }
});

const addToCartBtn = document.getElementById("addToCartBtn");
const cartAddStatus = document.getElementById("cartAddStatus");

addToCartBtn?.addEventListener("click", () => {
  const product = allProducts.find(p => p.id === productIdField.value);
  if (!product) return;
  cartAddStatus.className = "form-status";
  cartAddStatus.textContent = "";

  const qty = parseInt(document.getElementById("orderQuantity").value, 10) || 1;
  const item = { productId: product.id, quantity: qty };

  if (product.availability === "ready_stock") {
    const size = document.getElementById("orderSize").value || null;
    const color = document.getElementById("orderColor").value || null;
    const available = getAvailableToAdd(product, size, color);
    if (available <= 0) {
      cartAddStatus.className = "form-status error";
      cartAddStatus.textContent = t("cart_add_out_of_stock");
      return;
    }
    item.orderType = "ready_stock";
    item.selectedSize = size;
    item.selectedColor = color;
    item.quantity = Math.min(qty, available);
  } else {
    item.material = "unspecified";
  }

  addToCart(item);
  showToastPublic(t("cart_added_toast"));
  closeModal();
});

cartCheckoutForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (cart.length === 0) return;
  cartSubmitBtn.disabled = true;
  cartSubmitBtn.textContent = t("submit_btn_sending");

  const cartId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const orderNumber = generateOrderNumber();
  const clientName = document.getElementById("cartClientName").value.trim();
  const clientPhone = document.getElementById("cartClientPhone").value.trim();
  const clientAddress = document.getElementById("cartClientAddress").value.trim();
  const preferredDate = document.getElementById("cartPreferredDate").value || null;
  const notes = document.getElementById("cartNotes").value.trim();
  const clientUid = auth.currentUser ? auth.currentUser.uid : null;

  try {
    const batch = db.batch();
    cart.forEach((item) => {
      const product = allProducts.find(p => p.id === item.productId);
      const ref = db.collection("requests").doc();
      const payload = {
        orderNumber,
        productId: item.productId,
        productName: product ? product.name : null,
        productCode: product ? (product.productCode || null) : null,
        clientName,
        clientPhone,
        clientAddress,
        clientLocationUrl: null,
        material: item.material || "unspecified",
        preferredDate,
        notes,
        status: "new",
        clientUid,
        cartId,
        cartSize: cart.length,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (item.orderType === "ready_stock") {
        payload.orderType = "ready_stock";
        payload.selectedSize = item.selectedSize || null;
        payload.selectedColor = item.selectedColor || null;
        payload.quantity = item.quantity || 1;
      }
      if (item.shipToOther) {
        payload.recipientName = item.recipientName || null;
        payload.recipientPhone = item.recipientPhone || null;
        payload.recipientAddress = item.recipientAddress || null;
      }
      batch.set(ref, payload);
    });
    await batch.commit();

    cart = [];
    saveCart();
    cartCheckoutForm.reset();
    cartBackdrop.classList.remove("open");
    showSuccessPopup("cart_success_title", "cart_success_message");
  } catch (err) {
    console.error("Failed to submit cart:", err);
    cartFormStatus.className = "form-status error";
    cartFormStatus.textContent = t("cart_submit_error");
  } finally {
    cartSubmitBtn.disabled = false;
    cartSubmitBtn.textContent = t("cart_submit_btn");
  }
});

// Re-render dynamic (JS-generated) content whenever the language toggles,
// since data-i18n only covers static markup.
document.addEventListener("langchange", () => {
  refreshCollectionAndCategoryUI();
  if (currentProduct && detailView.style.display !== "none") {
    detailCategory.textContent = currentProduct.category || t("piece_category_fallback");
  }
});

productSearchInput?.addEventListener("input", renderGallery);

loadProducts();
loadCollections();

document.querySelectorAll(".how-step").forEach((step) => {
  step.classList.add("reveal-hidden");
  galleryRevealObserver.observe(step);
});
