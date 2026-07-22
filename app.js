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
}

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

detailCarouselImage.addEventListener("click", openLightbox);
lightboxClose.addEventListener("click", closeLightbox);
imageLightbox.addEventListener("click", (e) => {
  if (e.target === imageLightbox) closeLightbox();
});
lightboxPrev.addEventListener("click", () => stepImage(-1));
lightboxNext.addEventListener("click", () => stepImage(1));

function showDetailView() {
  detailView.style.display = "block";
  requestView.style.display = "none";
}

function showRequestView() {
  detailView.style.display = "none";
  requestView.style.display = "block";
  modalPieceName.textContent = currentProduct.name;
  productIdField.value = currentProduct.id;
  formStatus.className = "form-status";
  formStatus.textContent = "";
  document.getElementById("clientLocationUrl").value = "";
  document.getElementById("shareLocationStatus").textContent = "";
  document.getElementById("locationMapWrap").style.display = "none";
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
      document.getElementById("clientLocationUrl").value = `https://maps.google.com/?q=${latitude},${longitude}`;
      status.textContent = t("share_location_success");
      btn.disabled = false;
    },
    () => {
      status.textContent = t("share_location_error");
      btn.disabled = false;
    }
  );
});

// Map pin picker — a free (no API key) alternative to typing an address or
// using one-tap geolocation, for clients who'd rather just point at their spot.
let locationMap = null;
let locationMarker = null;
const ALEXANDRIA_COORDS = [31.2001, 29.9187];

function setLocationPin(lat, lng) {
  document.getElementById("clientLocationUrl").value = `https://maps.google.com/?q=${lat},${lng}`;
  document.getElementById("shareLocationStatus").textContent = t("share_location_success");
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

document.getElementById("pickMapLocationBtn")?.addEventListener("click", () => {
  const wrap = document.getElementById("locationMapWrap");
  if (wrap.style.display !== "none") {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";
  if (!locationMap) {
    locationMap = L.map("locationMap").setView(ALEXANDRIA_COORDS, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(locationMap);
    locationMap.on("click", (e) => placeMapMarker(e.latlng.lat, e.latlng.lng));
  }
  setTimeout(() => locationMap.invalidateSize(), 50);
});

backToDetailBtn.addEventListener("click", showDetailView);

function openModal(product) {
  currentProduct = product;
  currentImageIndex = 0;

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

  requestForm.reset();
  productIdField.value = product.id; // reset() clears hidden fields too, so set again

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

  const saleBtn = document.createElement("button");
  saleBtn.type = "button";
  saleBtn.className = "filter-chip filter-chip-sale" + (saleOnly ? " active" : "");
  saleBtn.textContent = t("filter_sale");
  saleBtn.addEventListener("click", () => {
    saleOnly = !saleOnly;
    refreshCollectionAndCategoryUI();
  });
  filterRow.appendChild(saleBtn);
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

  const searchQuery = (productSearchInput?.value || "").trim().toLowerCase();
  const filtered = searchQuery
    ? saleFiltered.filter(p => {
        const collectionName = allCollections.find(c => c.id === p.collectionId)?.name || "";
        return `${p.name || ""} ${p.category || ""} ${p.description || ""} ${collectionName} ${p.productCode || ""}`
          .toLowerCase().includes(searchQuery);
      })
    : saleFiltered;

  galleryGrid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    const filtersActive = activeCollection !== "all" || activeFilter !== "all" || saleOnly || Boolean(searchQuery);
    if (filtersActive) {
      emptyState.innerHTML = `<p>${escapeHtml(t("empty_state_filtered"))}</p><button type="button" class="btn-link" id="clearFiltersBtn">${escapeHtml(t("empty_state_clear"))}</button>`;
      document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        activeCollection = "all";
        activeFilter = "all";
        saleOnly = false;
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
        <p class="piece-eyebrow">${escapeHtml(product.category || t("piece_category_fallback"))}${collectionName ? ` <span class="piece-collection-tag">· ${escapeHtml(collectionName)}</span>` : ""}</p>
        <h3 class="piece-name">${escapeHtml(product.name)}</h3>
        <p class="piece-desc">${escapeHtml(product.description || "")}</p>
        ${priceHtml}
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

requestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = t("submit_btn_sending");

  const product = allProducts.find(p => p.id === productIdField.value);

  const payload = {
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

  try {
    await db.collection("requests").add(payload);
    requestForm.reset();
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
