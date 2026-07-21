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
    loginStatus.textContent = "Sign in failed — check your email and password.";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

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
    document.getElementById("whoamiRequests").textContent =
      `Signed in as ${currentStaff.name || currentStaff.email} (${currentStaff.role})`;

    loginScreen.style.display = "none";
    adminShell.style.display = "flex";

    loadRequests();
    loadProducts();
    loadCollections();
    loadSettings();
    if (currentStaff.role === "admin") {
      loadStaff();
    } else {
      document.querySelector('.admin-nav button[data-view="staff"]').style.display = "none";
    }
  } catch (err) {
    console.error("Staff lookup failed:", err);
    loginStatus.className = "form-status error";
    loginStatus.textContent = "Couldn't verify access. Try again.";
    await auth.signOut();
  }
});

// ---------- Nav ----------

document.querySelectorAll(".admin-nav button[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav button[data-view]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    ["requests", "products", "collections", "settings", "staff"].forEach((v) => {
      document.getElementById(`view-${v}`).style.display = v === btn.dataset.view ? "block" : "none";
    });
  });
});

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

function loadRequests() {
  db.collection("requests").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    const tbody = document.getElementById("requestsTableBody");
    const empty = document.getElementById("requestsEmpty");
    tbody.innerHTML = "";

    if (snapshot.empty) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    snapshot.forEach((doc) => {
      const r = doc.data();
      const tr = document.createElement("tr");
      const optionsHtml = STATUS_OPTIONS.map(
        s => `<option value="${s}" ${r.status === s ? "selected" : ""}>${STATUS_LABELS[s]}</option>`
      ).join("");

      tr.innerHTML = `
        <td>${escapeHtml(r.clientName)}</td>
        <td>${escapeHtml(r.productName || "—")}</td>
        <td>${escapeHtml(r.clientPhone)}</td>
        <td>${escapeHtml(r.preferredDate || "—")}</td>
        <td style="max-width:220px;">${escapeHtml(r.notes || "—")}</td>
        <td><select class="status-select" data-id="${doc.id}">${optionsHtml}</select></td>
        <td>${formatDate(r.createdAt)}</td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".status-select").forEach((sel) => {
      sel.addEventListener("change", async () => {
        try {
          await db.collection("requests").doc(sel.dataset.id).update({ status: sel.value });
        } catch (err) {
          console.error("Failed to update status:", err);
          alert("Couldn't update status. Please try again.");
        }
      });
    });
  }, (err) => console.error("Requests listener error:", err));
}

// ---------- Products ----------

const newProductBtn = document.getElementById("newProductBtn");
const productFormCard = document.getElementById("productFormCard");
const productFormTitle = document.getElementById("productFormTitle");
const productDocId = document.getElementById("productDocId");
const saveProductBtn = document.getElementById("saveProductBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const productFormStatus = document.getElementById("productFormStatus");

function resetProductForm() {
  productDocId.value = "";
  document.getElementById("pName").value = "";
  document.getElementById("pCategory").value = "";
  document.getElementById("pCollection").value = "";
  document.getElementById("pPrice").value = "";
  document.getElementById("pStatus").value = "active";
  document.getElementById("pDescription").value = "";
  document.getElementById("pImages").value = "";
  productFormStatus.className = "form-status";
  productFormStatus.textContent = "";
}

newProductBtn.addEventListener("click", () => {
  resetProductForm();
  productFormTitle.textContent = "New Piece";
  productFormCard.style.display = "block";
});

cancelProductBtn.addEventListener("click", () => {
  productFormCard.style.display = "none";
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
    category: document.getElementById("pCategory").value.trim(),
    collectionId: document.getElementById("pCollection").value || null,
    priceRange: document.getElementById("pPrice").value.trim(),
    status: document.getElementById("pStatus").value,
    description: document.getElementById("pDescription").value.trim(),
    images: document.getElementById("pImages").value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
  };

  saveProductBtn.disabled = true;
  try {
    if (productDocId.value) {
      await db.collection("products").doc(productDocId.value).update(data);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").add(data);
    }
    productFormCard.style.display = "none";
  } catch (err) {
    console.error("Failed to save product:", err);
    productFormStatus.className = "form-status error";
    productFormStatus.textContent = "Couldn't save this piece. Please try again.";
  } finally {
    saveProductBtn.disabled = false;
  }
});

function loadProducts() {
  db.collection("products").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    const tbody = document.getElementById("productsTableBody");
    tbody.innerHTML = "";

    snapshot.forEach((doc) => {
      const p = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category || "—")}</td>
        <td>${escapeHtml(p.priceRange || "—")}</td>
        <td><span class="status-pill status-${p.status === "active" ? "confirmed" : "delivered"}">${escapeHtml(p.status)}</span></td>
        <td>
          <button class="icon-btn" data-edit="${doc.id}">Edit</button>
          <button class="icon-btn danger" data-delete="${doc.id}">Delete</button>
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
        document.getElementById("pCategory").value = p.category || "";
        document.getElementById("pCollection").value = p.collectionId || "";
        document.getElementById("pPrice").value = p.priceRange || "";
        document.getElementById("pStatus").value = p.status || "active";
        document.getElementById("pDescription").value = p.description || "";
        document.getElementById("pImages").value = (p.images || []).join("\n");
        productFormTitle.textContent = "Edit Piece";
        productFormCard.style.display = "block";
        productFormCard.scrollIntoView({ behavior: "smooth" });
      });
    });

    tbody.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Remove this piece from the catalog? This can't be undone.")) return;
        try {
          await db.collection("products").doc(btn.dataset.delete).delete();
        } catch (err) {
          console.error("Failed to delete product:", err);
          alert("Couldn't delete this piece. Please try again.");
        }
      });
    });
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
    collectionFormCard.style.display = "none";
  } catch (err) {
    console.error("Failed to save collection:", err);
    collectionFormStatus.className = "form-status error";
    collectionFormStatus.textContent = "Couldn't create this collection. Please try again.";
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
        <td>${escapeHtml(c.name)}</td>
        <td><span class="status-pill status-${c.status === "active" ? "confirmed" : "delivered"}">${escapeHtml(c.status)}</span></td>
        <td>
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
        } catch (err) {
          console.error("Failed to update collection status:", err);
          alert("Couldn't update this collection. Please try again.");
        }
      });
    });

    tbody.querySelectorAll("[data-delete-collection]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this collection? Products keep their existing tag but it'll no longer show as a filter.")) return;
        try {
          await db.collection("collections").doc(btn.dataset.deleteCollection).delete();
        } catch (err) {
          console.error("Failed to delete collection:", err);
          alert("Couldn't delete this collection. Please try again.");
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
    settingsFormStatus.className = "form-status success";
    settingsFormStatus.textContent = "Settings saved.";
  } catch (err) {
    console.error("Failed to save settings:", err);
    settingsFormStatus.className = "form-status error";
    settingsFormStatus.textContent = "Couldn't save settings. Please try again.";
  } finally {
    saveSettingsBtn.disabled = false;
  }
});

// ---------- Staff (admin only) ----------

function loadStaff() {
  db.collection("staff").onSnapshot((snapshot) => {
    const tbody = document.getElementById("staffTableBody");
    tbody.innerHTML = "";
    snapshot.forEach((doc) => {
      const s = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(s.name || "—")}</td>
        <td>${escapeHtml(s.email || "—")}</td>
        <td>${escapeHtml(s.role || "staff")}</td>
        <td>${doc.id === currentStaff.uid ? "" : `<button class="icon-btn danger" data-remove="${doc.id}">Remove</button>`}</td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Remove this person's dashboard access?")) return;
        await db.collection("staff").doc(btn.dataset.remove).delete();
      });
    });
  });
}

document.getElementById("addStaffBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("staffEmail").value.trim();
  const name = document.getElementById("staffName").value.trim();
  const role = document.getElementById("staffRole").value;
  const statusEl = document.getElementById("staffFormStatus");

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
    document.getElementById("staffEmail").value = "";
    document.getElementById("staffName").value = "";
  } catch (err) {
    console.error("Failed to save staff invite:", err);
  }
});
