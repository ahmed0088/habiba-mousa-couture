// ================================
// Public site logic
// Reads: products (status == 'active')
// Writes: requests (new inquiry docs)
// ================================

const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const filterRow = document.getElementById("filterRow");

const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalPieceName = document.getElementById("modalPieceName");
const requestForm = document.getElementById("requestForm");
const productIdField = document.getElementById("productId");
const formStatus = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

let allProducts = [];
let activeFilter = "all";
let loadFailed = false;

function openModal(product) {
  modalPieceName.textContent = product.name;
  productIdField.value = product.id;
  formStatus.className = "form-status";
  formStatus.textContent = "";
  requestForm.reset();
  productIdField.value = product.id; // reset() clears hidden fields too, so set again
  modalBackdrop.classList.add("open");
}

function closeModal() {
  modalBackdrop.classList.remove("open");
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function renderFilters(categories) {
  filterRow.innerHTML = "";
  const cats = ["all", ...categories];
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-chip" + (cat === activeFilter ? " active" : "");
    btn.textContent = cat === "all" ? t("filter_all") : cat;
    btn.dataset.filter = cat;
    btn.addEventListener("click", () => {
      activeFilter = cat;
      renderFilters(categories);
      renderGallery();
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

  const filtered = activeFilter === "all"
    ? allProducts
    : allProducts.filter(p => p.category === activeFilter);

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
    card.innerHTML = `
      <div class="piece-media">
        ${product.images && product.images[0]
          ? `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" loading="lazy" />`
          : `<span>${escapeHtml(product.name)}</span>`}
      </div>
      <div class="piece-body">
        <p class="piece-eyebrow">${escapeHtml(product.category || t("piece_category_fallback"))}</p>
        <h3 class="piece-name">${escapeHtml(product.name)}</h3>
        <p class="piece-desc">${escapeHtml(product.description || "")}</p>
        ${product.priceRange ? `<p class="piece-price">${escapeHtml(product.priceRange)}</p>` : ""}
      </div>
    `;
    card.addEventListener("click", () => openModal(product));
    galleryGrid.appendChild(card);
  });
}

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
        const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        renderFilters(categories);
        renderGallery();
      },
      (err) => {
        console.error("Failed to load products:", err);
        loadFailed = true;
        renderGallery();
      }
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
    clientName: document.getElementById("clientName").value.trim(),
    clientPhone: document.getElementById("clientPhone").value.trim(),
    preferredDate: document.getElementById("preferredDate").value || null,
    notes: document.getElementById("clientNotes").value.trim(),
    status: "new",
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
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  renderFilters(categories);
  renderGallery();
});

loadProducts();
