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
    ["requests", "products", "staff"].forEach((v) => {
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
  document.getElementById("pPrice").value = "";
  document.getElementById("pStatus").value = "active";
  document.getElementById("pDescription").value = "";
  document.getElementById("pImage").value = "";
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
    priceRange: document.getElementById("pPrice").value.trim(),
    status: document.getElementById("pStatus").value,
    description: document.getElementById("pDescription").value.trim(),
    images: document.getElementById("pImage").value.trim()
      ? [document.getElementById("pImage").value.trim()]
      : []
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
        document.getElementById("pPrice").value = p.priceRange || "";
        document.getElementById("pStatus").value = p.status || "active";
        document.getElementById("pDescription").value = p.description || "";
        document.getElementById("pImage").value = (p.images && p.images[0]) || "";
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
