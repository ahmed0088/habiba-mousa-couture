// ================================
// Admin panel logic
// Auth: Firebase Auth (email/password)
// Access control: uid must exist in "staff" collection to see the dashboard
// ================================

const loginScreen = document.getElementById("loginScreen");
const adminShell = document.getElementById("adminShell");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentStaff = null; // { uid, name, email, role }

// ---------- Auth ----------

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";
  loginStatus.className = "form-status";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged below handles the rest
  } catch (err) {
    console.error(err);
    loginStatus.className = "form-status error";
    loginStatus.textContent = "Sign in failed — check your email and password." + errSuffix(err);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

document.getElementById("forgotPasswordBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) {
    loginStatus.className = "form-status error";
    loginStatus.textContent = typeof t === "function" ? t("admin_forgot_password_need_email") : "Type your email above first, then click here.";
    return;
  }
  try {
    await auth.sendPasswordResetEmail(email);
    loginStatus.className = "form-status success";
    loginStatus.textContent = typeof t === "function" ? t("admin_forgot_password_sent") : "We've sent a password reset link to your email.";
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    loginStatus.className = "form-status error";
    loginStatus.textContent = (typeof t === "function" ? t("admin_forgot_password_error") : "Couldn't send the reset link. Please try again.") + errSuffix(err);
  }
});

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    currentStaff = null;
    loginScreen.style.display = "flex";
    adminShell.style.display = "none";
    return;
  }

  try {
    const staffDoc = await db.collection("staff").doc(user.uid).get();
    if (!staffDoc.exists) {
      loginStatus.className = "form-status error";
      loginStatus.textContent = "This account isn't set up for dashboard access yet. Ask an admin to add you under Staff.";
      await auth.signOut();
      return;
    }
    currentStaff = { uid: user.uid, ...staffDoc.data() };
    const whoamiText = `Signed in as ${currentStaff.name || currentStaff.email} (${currentStaff.role})`;
    document.getElementById("whoamiRequests").textContent = whoamiText;
    document.getElementById("whoamiDashboard").textContent = whoamiText;

    loginScreen.style.display = "none";
    adminShell.style.display = "flex";

    loadRequests();
    loadProducts();
    loadCollections();
    loadSettings();
    if (currentStaff.role === "admin") {
      loadStaff();
      loadActivityLog();
    } else {
      document.querySelector('.admin-nav button[data-view="staff"]').style.display = "none";
      document.querySelector('.admin-nav button[data-view="activity"]').style.display = "none";
      document.getElementById("dashboardActivityCard").style.display = "none";
    }
    updateDashboardStats();
  } catch (err) {
    console.error("Staff lookup failed:", err);
    loginStatus.className = "form-status error";
    loginStatus.textContent = "Couldn't verify access. Try again." + errSuffix(err);
    await auth.signOut();
  }
});

// ---------- Nav ----------

document.querySelectorAll(".admin-nav button[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav button[data-view]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    ["dashboard", "requests", "products", "collections", "settings", "staff", "activity"].forEach((v) => {
      document.getElementById(`view-${v}`).style.display = v === btn.dataset.view ? "block" : "none";
    });
  });
});

function logActivity(action, target) {
  db.collection("activityLog").add({
    action,
    target: target || "",
    actor: (currentStaff && (currentStaff.name || currentStaff.email)) || "unknown",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch((err) => console.error("Failed to log activity:", err));
}

function loadActivityLog() {
  db.collection("activityLog").orderBy("createdAt", "desc").limit(100).onSnapshot((snapshot) => {
    const tbody = document.getElementById("activityTableBody");
    const empty = document.getElementById("activityEmpty");
    const recentBox = document.getElementById("dashboardRecentActivity");
    const recentEmpty = document.getElementById("dashboardActivityEmpty");
    tbody.innerHTML = "";
    if (recentBox) recentBox.innerHTML = "";

    if (snapshot.empty) {
      empty.style.display = "block";
      if (recentEmpty) recentEmpty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    if (recentEmpty) recentEmpty.style.display = "none";

    snapshot.forEach((doc, i) => {
      const a = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Action">${escapeHtml(a.action)}</td>
        <td data-label="Details">${escapeHtml(a.target)}</td>
        <td data-label="By">${escapeHtml(a.actor)}</td>
        <td data-label="When">${formatDate(a.createdAt)}</td>
      `;
      tbody.appendChild(tr);

      if (i < 5 && recentBox) {
        const row = document.createElement("p");
        row.style.cssText = "margin:0 0 8px; font-size:13.5px; border-bottom:1px solid var(--border-soft); padding-bottom:8px;";
        row.innerHTML = `<strong>${escapeHtml(a.action)}</strong> ${escapeHtml(a.target)} — <span style="color:var(--text-faint);">${escapeHtml(a.actor)}, ${formatDate(a.createdAt)}</span>`;
        recentBox.appendChild(row);
      }
    });
  }, (err) => console.error("Activity log listener error:", err));
}

function errSuffix(err) {
  return err && err.code ? ` (${err.code})` : "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---------- Requests ----------

const STATUS_OPTIONS = ["new", "contacted", "confirmed", "in_progress", "delivered", "cancelled"];
const STATUS_LABELS = {
  new: "New", contacted: "Contacted", confirmed: "Confirmed",
  in_progress: "In Progress", delivered: "Delivered", cancelled: "Cancelled"
};
const MATERIAL_LABELS = {
  silk: "Silk", chiffon: "Chiffon", satin: "Satin", lace: "Lace", cotton: "Cotton",
  crepe: "Crepe", tulle: "Tulle", organza: "Organza", velvet: "Velvet", brocade: "Brocade",
  unspecified: "Not sure yet"
};

let requestsById = {};

const requestDetailBackdrop = document.getElementById("requestDetailBackdrop");
const requestDetailClose = document.getElementById("requestDetailClose");
const requestDetailBody = document.getElementById("requestDetailBody");

function detailRow(label, value) {
  return `<p style="margin:0 0 10px;"><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value || "—")}</p>`;
}

function openRequestDetail(id) {
  const r = requestsById[id];
  if (!r) return;
  requestDetailBody.innerHTML = [
    detailRow("Client", r.clientName),
    detailRow("Phone", r.clientPhone),
    detailRow("Address", r.clientAddress),
    r.clientLocationUrl ? `<p style="margin:0 0 10px;"><strong>Location:</strong><br><a href="${escapeHtml(r.clientLocationUrl)}" target="_blank" rel="noopener">${escapeHtml(r.clientLocationUrl)}</a></p>` : "",
    detailRow("Piece", r.productName + (r.productCode ? ` (${r.productCode})` : "")),
    detailRow("Material", MATERIAL_LABELS[r.material] || r.material),
    detailRow("Needed by", r.preferredDate),
    detailRow("Notes", r.notes),
    detailRow("Status", STATUS_LABELS[r.status] || r.status),
    detailRow("Received", formatDate(r.createdAt))
  ].join("");
  requestDetailBackdrop.classList.add("open");
}

requestDetailClose?.addEventListener("click", () => requestDetailBackdrop.classList.remove("open"));
requestDetailBackdrop?.addEventListener("click", (e) => {
  if (e.target === requestDetailBackdrop) requestDetailBackdrop.classList.remove("open");
});

let allRequests = [];
const requestsSearchInput = document.getElementById("requestsSearch");

function requestMatchesSearch(r, q) {
  if (!q) return true;
  const hay = `${r.clientName || ""} ${r.clientPhone || ""} ${r.productName || ""} ${r.productCode || ""} ${r.clientAddress || ""}`.toLowerCase();
  return hay.includes(q);
}

function updateDashboardStats() {
  const newRequestsEl = document.getElementById("statNewRequests");
  const totalRequestsEl = document.getElementById("statTotalRequests");
  const activeProductsEl = document.getElementById("statActiveProducts");
  const activeCollectionsEl = document.getElementById("statActiveCollections");
  if (newRequestsEl) newRequestsEl.textContent = allRequests.filter(([, r]) => r.status === "new").length;
  if (totalRequestsEl) totalRequestsEl.textContent = allRequests.length;
  if (activeProductsEl) activeProductsEl.textContent = allProductsAdmin.filter(([, p]) => p.status === "active").length;
  if (activeCollectionsEl) activeCollectionsEl.textContent = allCollections.filter(c => c.status === "active").length;
}

function renderRequestsTable() {
  const tbody = document.getElementById("requestsTableBody");
  const empty = document.getElementById("requestsEmpty");
  const q = (requestsSearchInput?.value || "").trim().toLowerCase();
  const filtered = allRequests.filter(([, r]) => requestMatchesSearch(r, q));
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    empty.style.display = "block";
    empty.textContent = q ? "No requests match your search." : "No requests yet.";
    return;
  }
  empty.style.display = "none";

  filtered.forEach(([id, r]) => {
    const tr = document.createElement("tr");
    const optionsHtml = STATUS_OPTIONS.map(
      s => `<option value="${s}" ${r.status === s ? "selected" : ""}>${STATUS_LABELS[s]}</option>`
    ).join("");

    const product = r.productId ? allProductsAdmin.find(([id]) => id === r.productId) : null;
    const thumbSrc = product && product[1].images && product[1].images[0] ? product[1].images[0] : "";
    const thumbFocus = product && product[1].imageFocus ? product[1].imageFocus : "top";
    const thumbHtml = thumbSrc
      ? `<img class="request-thumb" src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(r.productName || "")}" style="object-position: center ${escapeHtml(thumbFocus)};" loading="lazy" />`
      : `<div class="request-thumb request-thumb-empty"></div>`;

    tr.innerHTML = `
      <td data-label="">${thumbHtml}</td>
      <td data-label="Client">${escapeHtml(r.clientName)}</td>
      <td data-label="Piece">${escapeHtml(r.productName || "—")}${r.productCode ? ` <span style="color:var(--text-faint); font-size:12px;">(${escapeHtml(r.productCode)})</span>` : ""}</td>
      <td data-label="Contact">${escapeHtml(r.clientPhone)}</td>
      <td data-label="Address" style="max-width:180px;">${escapeHtml(r.clientAddress || "—")}</td>
      <td data-label="Material">${escapeHtml(MATERIAL_LABELS[r.material] || "—")}</td>
      <td data-label="Needed By">${escapeHtml(r.preferredDate || "—")}</td>
      <td data-label="Notes" style="max-width:220px;">${escapeHtml(r.notes || "—")}</td>
      <td data-label="Status"><select class="status-select" data-id="${id}">${optionsHtml}</select></td>
      <td data-label="Received">${formatDate(r.createdAt)}</td>
      <td data-label="">
        <button class="icon-btn" data-view-request="${id}">View</button>
        <button class="icon-btn danger" data-delete-request="${id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-view-request]").forEach((btn) => {
    btn.addEventListener("click", () => openRequestDetail(btn.dataset.viewRequest));
  });

  tbody.querySelectorAll("[data-delete-request]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this request permanently? This can't be undone.")) return;
      const r = requestsById[btn.dataset.deleteRequest];
      try {
        await db.collection("requests").doc(btn.dataset.deleteRequest).delete();
        logActivity("Deleted request", r ? r.clientName : "");
      } catch (err) {
        console.error("Failed to delete request:", err);
        alert("Couldn't delete this request. Please try again." + errSuffix(err));
      }
    });
  });

  tbody.querySelectorAll(".status-select").forEach((sel) => {
    sel.addEventListener("change", async () => {
      try {
        await db.collection("requests").doc(sel.dataset.id).update({ status: sel.value });
        logActivity("Changed request status", `${requestsById[sel.dataset.id] ? requestsById[sel.dataset.id].clientName : ""} → ${sel.value}`);
      } catch (err) {
        console.error("Failed to update status:", err);
        alert("Couldn't update status. Please try again." + errSuffix(err));
      }
    });
  });
}

requestsSearchInput?.addEventListener("input", renderRequestsTable);

function loadRequests() {
  db.collection("requests").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    allRequests = snapshot.docs.map(doc => [doc.id, doc.data()]);
    requestsById = Object.fromEntries(allRequests);
    renderRequestsTable();
    updateDashboardStats();
  }, (err) => console.error("Requests listener error:", err));
}

// ---------- Products ----------

const newProductBtn = document.getElementById("newProductBtn");
const productFormBackdrop = document.getElementById("productFormBackdrop");
const productFormClose = document.getElementById("productFormClose");
const productFormTitle = document.getElementById("productFormTitle");
const productDocId = document.getElementById("productDocId");
const saveProductBtn = document.getElementById("saveProductBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const productFormStatus = document.getElementById("productFormStatus");

function openProductForm() {
  productFormBackdrop.classList.add("open");
}

function closeProductForm() {
  productFormBackdrop.classList.remove("open");
}

function resetProductForm() {
  productDocId.value = "";
  document.getElementById("pName").value = "";
  document.getElementById("pCode").value = `HM-${Math.floor(1000 + Math.random() * 9000)}`;
  document.getElementById("pCategory").value = "";
  document.getElementById("pCollection").value = "";
  document.getElementById("pPrice").value = "";
  document.getElementById("pSalePrice").value = "";
  document.getElementById("pStatus").value = "active";
  document.getElementById("pDescription").value = "";
  document.getElementById("pImages").value = "";
  document.getElementById("pImageFocus").value = "top";
  productFormStatus.className = "form-status";
  productFormStatus.textContent = "";
}

newProductBtn.addEventListener("click", () => {
  resetProductForm();
  productFormTitle.textContent = "New Piece";
  openProductForm();
});

cancelProductBtn.addEventListener("click", () => {
  closeProductForm();
});

productFormClose?.addEventListener("click", () => {
  closeProductForm();
});

productFormBackdrop?.addEventListener("click", (e) => {
  if (e.target === productFormBackdrop) closeProductForm();
});

saveProductBtn.addEventListener("click", async () => {
  const name = document.getElementById("pName").value.trim();
  if (!name) {
    productFormStatus.className = "form-status error";
    productFormStatus.textContent = "Name is required.";
    return;
  }

  const data = {
    name,
    productCode: document.getElementById("pCode").value.trim(),
    category: document.getElementById("pCategory").value.trim(),
    collectionId: document.getElementById("pCollection").value || null,
    priceRange: document.getElementById("pPrice").value.trim(),
    salePrice: document.getElementById("pSalePrice").value.trim(),
    status: document.getElementById("pStatus").value,
    description: document.getElementById("pDescription").value.trim(),
    images: document.getElementById("pImages").value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean),
    imageFocus: document.getElementById("pImageFocus").value
  };

  saveProductBtn.disabled = true;
  try {
    if (productDocId.value) {
      await db.collection("products").doc(productDocId.value).update(data);
      logActivity("Updated product", data.name);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").add(data);
      logActivity("Created product", data.name);
    }
    closeProductForm();
  } catch (err) {
    console.error("Failed to save product:", err);
    productFormStatus.className = "form-status error";
    productFormStatus.textContent = "Couldn't save this piece. Please try again." + errSuffix(err);
  } finally {
    saveProductBtn.disabled = false;
  }
});

document.querySelectorAll(".quick-sale-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const priceRaw = document.getElementById("pPrice").value;
    const numberMatch = priceRaw.match(/[\d,]+(\.\d+)?/);
    if (!numberMatch) {
      alert("Add a numeric price range first (e.g. 1,800 EGP) so a discount can be calculated.");
      return;
    }
    const base = parseFloat(numberMatch[0].replace(/,/g, ""));
    const off = Number(btn.dataset.off);
    const discounted = Math.round(base * (1 - off / 100));
    const currencyMatch = priceRaw.match(/[A-Za-z]+$/);
    const currency = currencyMatch ? ` ${currencyMatch[0]}` : "";
    document.getElementById("pSalePrice").value = `${discounted.toLocaleString()}${currency}`;
  });
});

document.getElementById("clearSaleBtn")?.addEventListener("click", () => {
  document.getElementById("pSalePrice").value = "";
});

let allProductsAdmin = [];
const productsSearchInput = document.getElementById("productsSearch");

function productMatchesSearch(p, q) {
  if (!q) return true;
  const hay = `${p.name || ""} ${p.productCode || ""} ${p.category || ""}`.toLowerCase();
  return hay.includes(q);
}

function renderProductsTable() {
  const tbody = document.getElementById("productsTableBody");
  const q = (productsSearchInput?.value || "").trim().toLowerCase();
  const filtered = allProductsAdmin.filter(([, p]) => productMatchesSearch(p, q));
  tbody.innerHTML = "";

  filtered.forEach(([id, p]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Code">${escapeHtml(p.productCode || "—")}</td>
      <td data-label="Piece">${escapeHtml(p.name)}</td>
      <td data-label="Category">${escapeHtml(p.category || "—")}</td>
      <td data-label="Price">${p.salePrice ? `${escapeHtml(p.priceRange || "—")} → <strong>${escapeHtml(p.salePrice)}</strong> (Sale)` : escapeHtml(p.priceRange || "—")}</td>
      <td data-label="Status"><span class="status-pill status-${p.status === "active" ? "confirmed" : "delivered"}">${escapeHtml(p.status)}</span></td>
      <td data-label="">
        <button class="icon-btn" data-edit="${id}">Edit</button>
        <button class="icon-btn danger" data-delete="${id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const doc = await db.collection("products").doc(btn.dataset.edit).get();
        const p = doc.data();
        productDocId.value = doc.id;
        document.getElementById("pName").value = p.name || "";
        document.getElementById("pCode").value = p.productCode || "";
        document.getElementById("pCategory").value = p.category || "";
        document.getElementById("pCollection").value = p.collectionId || "";
        document.getElementById("pPrice").value = p.priceRange || "";
        document.getElementById("pSalePrice").value = p.salePrice || "";
        document.getElementById("pStatus").value = p.status || "active";
        document.getElementById("pDescription").value = p.description || "";
        document.getElementById("pImages").value = (p.images || []).join("\n");
        document.getElementById("pImageFocus").value = p.imageFocus || "top";
        productFormTitle.textContent = "Edit Piece";
        openProductForm();
      });
    });

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this piece from the catalog? This can't be undone.")) return;
      const entry = allProductsAdmin.find(([id]) => id === btn.dataset.delete);
      try {
        await db.collection("products").doc(btn.dataset.delete).delete();
        logActivity("Deleted product", entry ? entry[1].name : "");
      } catch (err) {
        console.error("Failed to delete product:", err);
        alert("Couldn't delete this piece. Please try again." + errSuffix(err));
      }
    });
  });
}

productsSearchInput?.addEventListener("input", renderProductsTable);

function loadProducts() {
  db.collection("products").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    allProductsAdmin = snapshot.docs.map(doc => [doc.id, doc.data()]);
    renderProductsTable();
    renderRequestsTable();
    updateDashboardStats();
  }, (err) => console.error("Products listener error:", err));
}

// ---------- Collections ----------

const newCollectionBtn = document.getElementById("newCollectionBtn");
const collectionFormCard = document.getElementById("collectionFormCard");
const collectionNameInput = document.getElementById("collectionName");
const saveCollectionBtn = document.getElementById("saveCollectionBtn");
const cancelCollectionBtn = document.getElementById("cancelCollectionBtn");
const collectionFormStatus = document.getElementById("collectionFormStatus");
const pCollectionSelect = document.getElementById("pCollection");

let allCollections = [];

newCollectionBtn.addEventListener("click", () => {
  collectionNameInput.value = "";
  collectionFormStatus.className = "form-status";
  collectionFormStatus.textContent = "";
  collectionFormCard.style.display = "block";
});

cancelCollectionBtn.addEventListener("click", () => {
  collectionFormCard.style.display = "none";
});

saveCollectionBtn.addEventListener("click", async () => {
  const name = collectionNameInput.value.trim();
  if (!name) {
    collectionFormStatus.className = "form-status error";
    collectionFormStatus.textContent = "Name is required.";
    return;
  }

  saveCollectionBtn.disabled = true;
  try {
    await db.collection("collections").add({
      name,
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logActivity("Created collection", name);
    collectionFormCard.style.display = "none";
  } catch (err) {
    console.error("Failed to save collection:", err);
    collectionFormStatus.className = "form-status error";
    collectionFormStatus.textContent = "Couldn't create this collection. Please try again." + errSuffix(err);
  } finally {
    saveCollectionBtn.disabled = false;
  }
});

function populateCollectionSelect() {
  const current = pCollectionSelect.value;
  pCollectionSelect.innerHTML = '<option value="">— No collection —</option>' +
    allCollections
      .filter(c => c.status === "active")
      .map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join("");
  pCollectionSelect.value = current;
}

function loadCollections() {
  db.collection("collections").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    allCollections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    populateCollectionSelect();
    updateDashboardStats();

    const tbody = document.getElementById("collectionsTableBody");
    const empty = document.getElementById("collectionsEmpty");
    tbody.innerHTML = "";

    if (allCollections.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    allCollections.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Name">${escapeHtml(c.name)}</td>
        <td data-label="Status"><span class="status-pill status-${c.status === "active" ? "confirmed" : "delivered"}">${escapeHtml(c.status)}</span></td>
        <td data-label="">
          <button class="icon-btn" data-toggle="${c.id}" data-next="${c.status === "active" ? "archived" : "active"}">${c.status === "active" ? "Archive" : "Restore"}</button>
          <button class="icon-btn danger" data-delete-collection="${c.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await db.collection("collections").doc(btn.dataset.toggle).update({ status: btn.dataset.next });
          logActivity("Changed collection status", btn.dataset.next);
        } catch (err) {
          console.error("Failed to update collection status:", err);
          alert("Couldn't update this collection. Please try again." + errSuffix(err));
        }
      });
    });

    tbody.querySelectorAll("[data-delete-collection]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this collection? Products keep their existing tag but it'll no longer show as a filter.")) return;
        const collection = allCollections.find(c => c.id === btn.dataset.deleteCollection);
        try {
          await db.collection("collections").doc(btn.dataset.deleteCollection).delete();
          logActivity("Deleted collection", collection ? collection.name : "");
        } catch (err) {
          console.error("Failed to delete collection:", err);
          alert("Couldn't delete this collection. Please try again." + errSuffix(err));
        }
      });
    });
  }, (err) => console.error("Collections listener error:", err));
}

// ---------- Site Settings ----------

const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsFormStatus = document.getElementById("settingsFormStatus");

const SETTINGS_FIELDS = {
  setHeroTaglineAr: "heroTagline_ar",
  setHeroTaglineEn: "heroTagline_en",
  setTurnaroundAr: "turnaround_ar",
  setTurnaroundEn: "turnaround_en",
  setAboutIntroAr: "aboutIntro_ar",
  setAboutIntroEn: "aboutIntro_en",
  setAboutStoryAr: "aboutStory_ar",
  setAboutStoryEn: "aboutStory_en",
  setContactPhone: "contactPhone",
  setContactWhatsapp: "contactWhatsapp",
  setContactEmail: "contactEmail",
  setContactHoursAr: "contactHours_ar",
  setContactHoursEn: "contactHours_en",
  setAddressAr: "address_ar",
  setAddressEn: "address_en",
  setGoogleMapsUrl: "googleMapsUrl",
  setWazeUrl: "wazeUrl"
};

function loadSettings() {
  db.collection("settings").doc("site").onSnapshot((doc) => {
    const data = doc.exists ? doc.data() : {};
    Object.entries(SETTINGS_FIELDS).forEach(([elId, field]) => {
      const el = document.getElementById(elId);
      if (el && document.activeElement !== el) el.value = data[field] || "";
    });
    const depositEl = document.getElementById("setDepositPercent");
    if (document.activeElement !== depositEl) {
      depositEl.value = data.depositPercent != null ? data.depositPercent : 40;
    }
  }, (err) => console.error("Settings listener error:", err));
}

saveSettingsBtn.addEventListener("click", async () => {
  const data = {};
  Object.entries(SETTINGS_FIELDS).forEach(([elId, field]) => {
    data[field] = document.getElementById(elId).value.trim();
  });
  const depositRaw = document.getElementById("setDepositPercent").value;
  data.depositPercent = depositRaw === "" ? 40 : Number(depositRaw);

  saveSettingsBtn.disabled = true;
  settingsFormStatus.className = "form-status";
  try {
    await db.collection("settings").doc("site").set(data, { merge: true });
    logActivity("Updated site settings", "");
    settingsFormStatus.className = "form-status success";
    settingsFormStatus.textContent = "Settings saved.";
  } catch (err) {
    console.error("Failed to save settings:", err);
    settingsFormStatus.className = "form-status error";
    settingsFormStatus.textContent = "Couldn't save settings. Please try again." + errSuffix(err);
  } finally {
    saveSettingsBtn.disabled = false;
  }
});

// ---------- Staff (admin only) ----------

const staffEditUid = document.getElementById("staffEditUid");
const cancelStaffEditBtn = document.getElementById("cancelStaffEditBtn");
const addStaffBtn = document.getElementById("addStaffBtn");

function resetStaffForm() {
  staffEditUid.value = "";
  document.getElementById("staffEmail").value = "";
  document.getElementById("staffEmail").disabled = false;
  document.getElementById("staffName").value = "";
  document.getElementById("staffRole").value = "staff";
  addStaffBtn.textContent = "Add Staff Member";
  cancelStaffEditBtn.style.display = "none";
  document.getElementById("staffFormStatus").className = "form-status";
  document.getElementById("staffFormStatus").textContent = "";
}

cancelStaffEditBtn?.addEventListener("click", resetStaffForm);

function populateStaffEmailOptions(emails) {
  const datalist = document.getElementById("staffEmailOptions");
  if (!datalist) return;
  datalist.innerHTML = [...new Set(emails.filter(Boolean))]
    .map(email => `<option value="${escapeHtml(email)}"></option>`)
    .join("");
}

function loadStaff() {
  db.collection("staff").onSnapshot((snapshot) => {
    const tbody = document.getElementById("staffTableBody");
    tbody.innerHTML = "";
    const knownEmails = [];
    snapshot.forEach((doc) => {
      const s = doc.data();
      knownEmails.push(s.email);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Name">${escapeHtml(s.name || "—")}</td>
        <td data-label="Email">${escapeHtml(s.email || "—")}</td>
        <td data-label="Role">${escapeHtml(s.role || "staff")}</td>
        <td data-label="">
          <button class="icon-btn" data-edit-staff="${doc.id}" data-name="${escapeHtml(s.name || "")}" data-email="${escapeHtml(s.email || "")}" data-role="${escapeHtml(s.role || "staff")}">Edit</button>
          ${doc.id === currentStaff.uid ? "" : `<button class="icon-btn danger" data-remove="${doc.id}">Remove</button>`}
        </td>
      `;
      tbody.appendChild(tr);
    });

    populateStaffEmailOptions(knownEmails);
    db.collection("staff_pending").get().then((pendingSnap) => {
      populateStaffEmailOptions([...knownEmails, ...pendingSnap.docs.map(d => d.data().email)]);
    }).catch((err) => console.error("Failed to load pending staff emails:", err));

    tbody.querySelectorAll("[data-edit-staff]").forEach((btn) => {
      btn.addEventListener("click", () => {
        staffEditUid.value = btn.dataset.editStaff;
        document.getElementById("staffEmail").value = btn.dataset.email;
        document.getElementById("staffEmail").disabled = true;
        document.getElementById("staffName").value = btn.dataset.name;
        document.getElementById("staffRole").value = btn.dataset.role;
        addStaffBtn.textContent = "Update Staff Member";
        cancelStaffEditBtn.style.display = "inline-block";
        document.getElementById("staffFormStatus").className = "form-status";
        document.getElementById("staffFormStatus").textContent = "";
      });
    });

    tbody.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Remove this person's dashboard access?")) return;
        try {
          await db.collection("staff").doc(btn.dataset.remove).delete();
          logActivity("Removed staff access", btn.dataset.remove);
        } catch (err) {
          console.error("Failed to remove staff member:", err);
          alert("Couldn't remove this person. Please try again." + errSuffix(err));
        }
      });
    });
  }, (err) => console.error("Staff listener error:", err));
}

addStaffBtn?.addEventListener("click", async () => {
  const name = document.getElementById("staffName").value.trim();
  const role = document.getElementById("staffRole").value;
  const statusEl = document.getElementById("staffFormStatus");

  if (staffEditUid.value) {
    try {
      await db.collection("staff").doc(staffEditUid.value).update({ name, role });
      logActivity("Updated staff member", `${name} (${role})`);
      resetStaffForm();
    } catch (err) {
      console.error("Failed to update staff member:", err);
      statusEl.className = "form-status error";
      statusEl.textContent = "Couldn't update this person. Please try again." + errSuffix(err);
    }
    return;
  }

  const email = document.getElementById("staffEmail").value.trim();
  if (!email) {
    statusEl.className = "form-status error";
    statusEl.textContent = "Email is required.";
    return;
  }

  statusEl.className = "form-status error";
  statusEl.textContent =
    "Note: this creates a staff record, but you still need the matching login created in Firebase Console → Authentication first, using the same email — then copy that user's UID here as the document ID. (See README for the step-by-step.)";

  // Staff docs are keyed by Firebase Auth UID so security rules can check access.
  // Since this simple form doesn't create Auth users directly, we store a pending
  // record keyed by email for the admin to reconcile — see README for the full flow.
  try {
    await db.collection("staff_pending").add({
      email, name, role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logActivity("Invited staff member", email);
    document.getElementById("staffEmail").value = "";
    document.getElementById("staffName").value = "";
  } catch (err) {
    console.error("Failed to save staff invite:", err);
  }
});
