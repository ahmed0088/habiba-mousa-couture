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
let activeFilter = "all";
let activeCollection = "all";
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
backToDetailBtn.addEventListener("click", showDetailView);

function openModal(product) {
  currentProduct = product;
  currentImageIndex = 0;

  detailCategory.textContent = product.category || t("piece_category_fallback");
  detailName.textContent = product.name;
  if (product.salePrice) {
    detailPrice.innerHTML = `<span class="piece-price-original"><bdi>${escapeHtml(formatPrice(product.priceRange) || "")}</bdi></span> <span class="piece-price-sale"><bdi>${escapeHtml(formatPrice(product.salePrice))}</bdi></span>`;
    detailPrice.style.display = "block";
  } else {
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

// Collections and categories are two different taxonomies, but showing them as two
// separate chip rows (each with its own "All") read as cluttered/confusing, so they're
// combined into one row: a single "All" resets both, then collection chips, then category chips.
function renderCombinedFilters(categories) {
  filterRow.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "filter-chip" + (activeCollection === "all" && activeFilter === "all" ? " active" : "");
  allBtn.textContent = t("filter_all");
  allBtn.addEventListener("click", () => {
    activeCollection = "all";
    activeFilter = "all";
    refreshCollectionAndCategoryUI();
  });
  filterRow.appendChild(allBtn);

  allCollections.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "filter-chip" + (c.id === activeCollection ? " active" : "");
    btn.textContent = c.name;
    btn.addEventListener("click", () => {
      activeCollection = c.id;
      activeFilter = "all";
      refreshCollectionAndCategoryUI();
    });
    filterRow.appendChild(btn);
  });

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-chip" + (cat === activeFilter ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      activeFilter = cat;
      refreshCollectionAndCategoryUI();
    });
    filterRow.appendChild(btn);
  });
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

  const searchQuery = (productSearchInput?.value || "").trim().toLowerCase();
  const filtered = searchQuery
    ? categoryFiltered.filter(p =>
        `${p.name || ""} ${p.category || ""} ${p.description || ""}`.toLowerCase().includes(searchQuery)
      )
    : categoryFiltered;

  galleryGrid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    emptyState.textContent = t("empty_state");
    return;
  }
  emptyState.style.display = "none";

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "piece-card";
    const onSale = Boolean(product.salePrice);
    const priceHtml = onSale
      ? `<p class="piece-price"><span class="piece-price-original"><bdi>${escapeHtml(formatPrice(product.priceRange) || "")}</bdi></span> <span class="piece-price-sale"><bdi>${escapeHtml(formatPrice(product.salePrice))}</bdi></span></p>`
      : (product.priceRange ? `<p class="piece-price">${escapeHtml(formatPrice(product.priceRange))}</p>` : "");
    card.innerHTML = `
      <div class="piece-media">
        ${onSale ? `<span class="sale-badge">${t("sale_badge")}</span>` : ""}
        ${product.images && product.images[0]
          ? `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" loading="lazy" style="object-position: center ${escapeHtml(product.imageFocus || "top")};" />`
          : `<span>${escapeHtml(product.name)}</span>`}
      </div>
      <div class="piece-body">
        <p class="piece-eyebrow">${escapeHtml(product.category || t("piece_category_fallback"))}</p>
        <h3 class="piece-name">${escapeHtml(product.name)}</h3>
        <p class="piece-desc">${escapeHtml(product.description || "")}</p>
        ${priceHtml}
      </div>
    `;
    card.addEventListener("click", () => openModal(product));
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

function loadProducts() {
  db.collection("products")
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        loadFailed = false;
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        refreshCollectionAndCategoryUI();
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
    formStatus.className = "form-status success";
    formStatus.textContent = t("submit_success");
    requestForm.reset();
    setTimeout(closeModal, 2200);
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
