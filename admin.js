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
const DEFAULT_LOGO_SRC = document.getElementById("brandLogo")?.getAttribute("src");

// ---------- Auth ----------

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";
  loginStatus.className = "form-status";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const remember = document.getElementById("loginRemember")?.checked !== false;

  try {
    await auth.setPersistence(remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
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

document.querySelectorAll(".password-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "\u{1F648}" : "\u{1F441}️";
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

logoutBtn.addEventListener("click", () => auth.signOut());

const myProfileBtn = document.getElementById("myProfileBtn");
const myProfileBackdrop = document.getElementById("myProfileBackdrop");
const myProfileClose = document.getElementById("myProfileClose");
const myProfileName = document.getElementById("myProfileName");
const myProfileSaveBtn = document.getElementById("myProfileSaveBtn");
const myProfileStatus = document.getElementById("myProfileStatus");

myProfileBtn?.addEventListener("click", () => {
  myProfileName.value = (currentStaff && currentStaff.name) || "";
  myProfileStatus.className = "form-status";
  myProfileStatus.textContent = "";
  myProfileBackdrop.classList.add("open");
});

myProfileClose?.addEventListener("click", () => myProfileBackdrop.classList.remove("open"));
myProfileBackdrop?.addEventListener("click", (e) => {
  if (e.target === myProfileBackdrop) myProfileBackdrop.classList.remove("open");
});

myProfileSaveBtn?.addEventListener("click", async () => {
  const name = myProfileName.value.trim();
  myProfileSaveBtn.disabled = true;
  try {
    await db.collection("staff").doc(currentStaff.uid).update({ name });
    currentStaff.name = name;
    const whoamiText = `Signed in as ${currentStaff.name || currentStaff.email} (${currentStaff.role})`;
    document.getElementById("whoamiRequests").textContent = whoamiText;
    document.getElementById("whoamiDashboard").textContent = whoamiText;
    logActivity("Updated own profile", name);
    myProfileBackdrop.classList.remove("open");
  } catch (err) {
    console.error("Failed to save profile:", err);
    myProfileStatus.className = "form-status error";
    myProfileStatus.textContent = "Couldn't save your profile. Please try again." + errSuffix(err);
  } finally {
    myProfileSaveBtn.disabled = false;
  }
});

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
    loadCategories();
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

const adminSidebar = document.querySelector(".admin-sidebar");
const adminNavToggle = document.getElementById("adminNavToggle");
adminNavToggle?.addEventListener("click", () => {
  const open = adminSidebar.classList.toggle("nav-open");
  adminNavToggle.classList.toggle("open", open);
  adminNavToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".admin-nav button[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav button[data-view]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    ["dashboard", "requests", "products", "categories", "collections", "settings", "staff", "activity"].forEach((v) => {
      document.getElementById(`view-${v}`).style.display = v === btn.dataset.view ? "block" : "none";
    });
    adminSidebar.classList.remove("nav-open");
    adminNavToggle?.classList.remove("open");
    adminNavToggle?.setAttribute("aria-expanded", "false");
  });
});

function showToast(message, type) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (type === "error" ? " toast-error" : "");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function logActivity(action, target, extra) {
  const entry = {
    action,
    target: target || "",
    actor: (currentStaff && (currentStaff.name || currentStaff.email)) || "unknown",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (extra && extra.imageUrl) entry.imageUrl = extra.imageUrl;
  if (extra && extra.snapshotCollection && extra.snapshotData) {
    entry.snapshotCollection = extra.snapshotCollection;
    entry.snapshotId = extra.snapshotId || null;
    entry.snapshotData = extra.snapshotData;
  }
  db.collection("activityLog").add(entry).catch((err) => {
    console.error("Failed to log activity:", err);
    showToast("Couldn't save to the activity log — the live Firestore rules may be out of date." + errSuffix(err), "error");
  });
}

let allActivityLog = [];
let activityShowCount = 20;
const ACTIVITY_PAGE_SIZE = 20;

function activityIconFor(action) {
  if (/^Deleted/.test(action)) return "🗑️";
  if (/^Created|^Invited/.test(action)) return "➕";
  if (/^Updated/.test(action)) return "✏️";
  if (/^Changed/.test(action)) return "🔄";
  if (/^Removed/.test(action)) return "👤";
  if (/^Restored/.test(action)) return "↩️";
  return "•";
}

function populateActivityFilters() {
  const actionFilter = document.getElementById("activityActionFilter");
  const actorFilter = document.getElementById("activityActorFilter");
  if (!actionFilter || !actorFilter) return;
  const currentAction = actionFilter.value;
  const currentActor = actorFilter.value;

  const actions = [...new Set(allActivityLog.map(a => a.action))].sort();
  const actors = [...new Set(allActivityLog.map(a => a.actor))].sort();

  actionFilter.innerHTML = `<option value="all">${t("admin_activity_filter_all_actions")}</option>` +
    actions.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");
  actorFilter.innerHTML = `<option value="all">${t("admin_activity_filter_all_staff")}</option>` +
    actors.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");

  actionFilter.value = currentAction || "all";
  actorFilter.value = currentActor || "all";
}

function renderActivityLog() {
  const feed = document.getElementById("activityFeed");
  const empty = document.getElementById("activityEmpty");
  const showMoreBtn = document.getElementById("activityShowMoreBtn");
  const recentBox = document.getElementById("dashboardRecentActivity");
  const recentEmpty = document.getElementById("dashboardActivityEmpty");
  if (!feed) return;

  const actionFilter = document.getElementById("activityActionFilter")?.value || "all";
  const actorFilter = document.getElementById("activityActorFilter")?.value || "all";
  const dateFrom = document.getElementById("activityDateFrom")?.value;
  const dateTo = document.getElementById("activityDateTo")?.value;

  const filtered = allActivityLog.filter((a) => {
    if (actionFilter !== "all" && a.action !== actionFilter) return false;
    if (actorFilter !== "all" && a.actor !== actorFilter) return false;
    if ((dateFrom || dateTo) && a.createdAt) {
      const d = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    }
    return true;
  });

  feed.innerHTML = "";
  if (recentBox) recentBox.innerHTML = "";

  if (filtered.length === 0) {
    empty.style.display = "block";
    if (recentEmpty) recentEmpty.style.display = "block";
    if (showMoreBtn) showMoreBtn.style.display = "none";
    return;
  }
  empty.style.display = "none";
  if (recentEmpty) recentEmpty.style.display = "none";

  filtered.slice(0, activityShowCount).forEach((a) => {
    const row = document.createElement("div");
    row.className = "activity-row";
    const thumbHtml = a.imageUrl
      ? `<img class="activity-thumb" src="${escapeHtml(a.imageUrl)}" alt="" loading="lazy" />`
      : `<div class="activity-icon">${activityIconFor(a.action)}</div>`;
    const canRestore = /^Deleted/.test(a.action) && a.snapshotCollection && a.snapshotData;
    row.innerHTML = `
      ${thumbHtml}
      <div class="activity-body">
        <div class="activity-action">${escapeHtml(a.action)}</div>
        <div class="activity-target">${escapeHtml(a.target || "—")}</div>
        <div class="activity-meta">${escapeHtml(a.actor)} · ${formatDate(a.createdAt)}</div>
      </div>
      <div class="activity-row-actions">
        ${canRestore ? `<button class="icon-btn" data-restore-log="${a.id}">${escapeHtml(t("admin_activity_restore"))}</button>` : ""}
        <button class="icon-btn danger" data-delete-log="${a.id}">${escapeHtml(t("admin_activity_delete"))}</button>
      </div>
    `;
    feed.appendChild(row);
  });

  filtered.slice(0, 5).forEach((a) => {
    if (!recentBox) return;
    const p = document.createElement("p");
    p.style.cssText = "margin:0 0 8px; font-size:13.5px; border-bottom:1px solid var(--border-soft); padding-bottom:8px;";
    p.innerHTML = `<strong>${escapeHtml(a.action)}</strong> ${escapeHtml(a.target)} — <span style="color:var(--text-faint);">${escapeHtml(a.actor)}, ${formatDate(a.createdAt)}</span>`;
    recentBox.appendChild(p);
  });

  if (showMoreBtn) {
    if (filtered.length > activityShowCount) {
      showMoreBtn.style.display = "block";
      showMoreBtn.textContent = `${t("my_requests_show_more")} (${filtered.length - activityShowCount})`;
    } else {
      showMoreBtn.style.display = "none";
    }
  }

  feed.querySelectorAll("[data-delete-log]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(t("admin_activity_delete_confirm"))) return;
      try {
        await db.collection("activityLog").doc(btn.dataset.deleteLog).delete();
      } catch (err) {
        console.error("Failed to delete activity log entry:", err);
        alert("Couldn't delete this entry." + errSuffix(err));
      }
    });
  });

  feed.querySelectorAll("[data-restore-log]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const entry = allActivityLog.find(a => a.id === btn.dataset.restoreLog);
      if (!entry) return;
      if (!confirm(t("admin_activity_restore_confirm"))) return;
      try {
        const { id, ...cleanData } = entry.snapshotData;
        const targetCollection = db.collection(entry.snapshotCollection);
        if (entry.snapshotId) {
          await targetCollection.doc(entry.snapshotId).set(cleanData);
        } else {
          await targetCollection.add(cleanData);
        }
        logActivity(`Restored ${entry.snapshotCollection.slice(0, -1)}`, entry.target || "");
        showToast(t("admin_activity_restored"));
      } catch (err) {
        console.error("Failed to restore item:", err);
        showToast(t("admin_activity_restore_error") + errSuffix(err), "error");
      }
    });
  });
}

["activityActionFilter", "activityActorFilter", "activityDateFrom", "activityDateTo"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", () => {
    activityShowCount = ACTIVITY_PAGE_SIZE;
    renderActivityLog();
  });
});

document.getElementById("activityFilterClearBtn")?.addEventListener("click", () => {
  const actionFilter = document.getElementById("activityActionFilter");
  const actorFilter = document.getElementById("activityActorFilter");
  const dateFrom = document.getElementById("activityDateFrom");
  const dateTo = document.getElementById("activityDateTo");
  if (actionFilter) actionFilter.value = "all";
  if (actorFilter) actorFilter.value = "all";
  if (dateFrom) dateFrom.value = "";
  if (dateTo) dateTo.value = "";
  activityShowCount = ACTIVITY_PAGE_SIZE;
  renderActivityLog();
});

document.getElementById("activityShowMoreBtn")?.addEventListener("click", () => {
  activityShowCount += ACTIVITY_PAGE_SIZE;
  renderActivityLog();
});

function loadActivityLog() {
  db.collection("activityLog").orderBy("createdAt", "desc").limit(300).onSnapshot((snapshot) => {
    allActivityLog = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    populateActivityFilters();
    renderActivityLog();
  }, (err) => {
    console.error("Activity log listener error:", err);
    const empty = document.getElementById("activityEmpty");
    const recentEmpty = document.getElementById("dashboardActivityEmpty");
    const message = "Couldn't load activity — the live Firestore rules may be out of date." + errSuffix(err);
    if (empty) {
      empty.style.display = "block";
      empty.textContent = message;
    }
    if (recentEmpty) {
      recentEmpty.style.display = "block";
      recentEmpty.textContent = message;
    }
  });
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
  return `<div><p style="margin:0; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-faint);">${escapeHtml(label)}</p><p style="margin:2px 0 0; font-weight:500;">${escapeHtml(value || "—")}</p></div>`;
}

function statusPillGroupHtml(id, currentStatus) {
  const pills = STATUS_OPTIONS.map((s) => {
    const active = s === currentStatus;
    return `<button type="button" class="status-pill-btn status-${s}${active ? " active" : ""}" data-status="${s}" data-id="${id}">${escapeHtml(STATUS_LABELS[s])}</button>`;
  }).join("");
  return `<div class="status-pill-group">${pills}</div>`;
}

// A cart checkout creates one requests doc per item, all sharing a cartId —
// this shows the rest of that order right in the detail view so staff don't
// have to hunt through the list to see what else was ordered alongside it.
function cartSiblingsHtml(currentId, r) {
  if (!r.cartId) return "";
  const siblings = allRequests.filter(([, sr]) => sr.cartId === r.cartId);
  const rows = siblings.map(([sid, sr]) => `
    <div class="cart-sibling-row${sid === currentId ? " current" : ""}">
      <span>${escapeHtml(sr.productName || "—")}${sr.productCode ? ` <span style="color:var(--text-faint); font-size:12px;">(${escapeHtml(sr.productCode)})</span>` : ""}</span>
      <span class="status-pill status-${escapeHtml(sr.status)}">${escapeHtml(STATUS_LABELS[sr.status] || sr.status)}</span>
    </div>
  `).join("");
  return `
    <div class="cart-siblings-block">
      <p class="cart-siblings-title">🛍 Part of a ${siblings.length}-piece order</p>
      ${rows}
    </div>
  `;
}

function openRequestDetail(id) {
  const r = requestsById[id];
  if (!r) return;
  const product = r.productId ? allProductsAdmin.find(([pid]) => pid === r.productId) : null;
  const thumbSrc = product && product[1].images && product[1].images[0] ? product[1].images[0] : "";
  const thumbFocus = product && product[1].imageFocus ? product[1].imageFocus : "top";
  const photoHtml = thumbSrc
    ? `<img src="${escapeHtml(thumbSrc)}" alt="" style="width:100%; max-width:220px; aspect-ratio:3/4; object-fit:cover; object-position: center ${escapeHtml(thumbFocus)}; border-radius:8px; border:1px solid var(--line); display:block; margin:0 auto 18px; box-shadow:0 10px 24px -14px rgba(28,16,19,0.4);" />`
    : "";

  requestDetailBody.innerHTML = `
    ${photoHtml}
    ${statusPillGroupHtml(id, r.status)}
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px 20px; margin-top:18px;">
      ${detailRow("Client", r.clientName)}
      ${detailRow("Phone", r.clientPhone)}
      ${detailRow("Piece", r.productName + (r.productCode ? ` (${r.productCode})` : ""))}
      ${detailRow("Material", MATERIAL_LABELS[r.material] || r.material)}
      ${detailRow("Address", r.clientAddress)}
      ${detailRow("Needed by", r.preferredDate)}
      ${detailRow("Received", formatDate(r.createdAt))}
      ${r.orderType === "ready_stock" ? detailRow("Ready-stock order", `${[r.selectedSize, r.selectedColor].filter(Boolean).join(" / ") || "—"} × ${r.quantity || 1}`) : ""}
    </div>
    ${r.clientLocationUrl ? `<p style="margin:16px 0 0;"><strong>Location:</strong> <a href="${escapeHtml(r.clientLocationUrl)}" target="_blank" rel="noopener">Open pinned location in Maps</a></p>` : ""}
    ${r.notes ? `<div style="margin-top:16px;">${detailRow("Notes", r.notes)}</div>` : ""}
    ${cartSiblingsHtml(id, r)}
  `;

  requestDetailBody.querySelectorAll(".status-pill-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (btn.classList.contains("active")) return;
      const newStatus = btn.dataset.status;
      try {
        await db.collection("requests").doc(id).update({ status: newStatus });
        logActivity("Changed request status", `${r.clientName} → ${newStatus}`);
        requestDetailBody.querySelectorAll(".status-pill-btn").forEach((b) => {
          b.classList.toggle("active", b === btn);
        });
      } catch (err) {
        console.error("Failed to update status:", err);
        alert("Couldn't update status. Please try again." + errSuffix(err));
      }
    });
  });

  requestDetailBackdrop.classList.add("open");
}

requestDetailClose?.addEventListener("click", () => requestDetailBackdrop.classList.remove("open"));
requestDetailBackdrop?.addEventListener("click", (e) => {
  if (e.target === requestDetailBackdrop) requestDetailBackdrop.classList.remove("open");
});

let allRequests = [];
const requestsSearchInput = document.getElementById("requestsSearch");
const requestsStatusFilter = document.getElementById("requestsStatusFilter");

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
  const feed = document.getElementById("requestsFeed");
  const empty = document.getElementById("requestsEmpty");
  const q = (requestsSearchInput?.value || "").trim().toLowerCase();
  const statusFilter = requestsStatusFilter?.value || "all";
  const filtered = allRequests.filter(([, r]) =>
    requestMatchesSearch(r, q) && (statusFilter === "all" || r.status === statusFilter)
  );
  feed.innerHTML = "";

  if (filtered.length === 0) {
    empty.style.display = "block";
    empty.textContent = (q || statusFilter !== "all") ? "No requests match your search/filter." : "No requests yet.";
    return;
  }
  empty.style.display = "none";

  filtered.forEach(([id, r]) => {
    const optionsHtml = STATUS_OPTIONS.map(
      s => `<option value="${s}" ${r.status === s ? "selected" : ""}>${STATUS_LABELS[s]}</option>`
    ).join("");

    const product = r.productId ? allProductsAdmin.find(([pid]) => pid === r.productId) : null;
    const thumbSrc = product && product[1].images && product[1].images[0] ? product[1].images[0] : "";
    const thumbFocus = product && product[1].imageFocus ? product[1].imageFocus : "top";
    const thumbHtml = thumbSrc
      ? `<img class="request-thumb" src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(r.productName || "")}" style="object-position: center ${escapeHtml(thumbFocus)};" loading="lazy" />`
      : `<div class="request-thumb request-thumb-empty"></div>`;

    const metaParts = [
      r.clientPhone ? `📞 ${escapeHtml(r.clientPhone)}` : "",
      r.clientAddress ? `📍 ${escapeHtml(r.clientAddress)}` : "",
      r.material ? `🧵 ${escapeHtml(MATERIAL_LABELS[r.material] || r.material)}` : "",
      r.preferredDate ? `📅 ${escapeHtml(r.preferredDate)}` : "",
      r.orderType === "ready_stock" ? `📦 ${escapeHtml([r.selectedSize, r.selectedColor].filter(Boolean).join(" / ") || "Ready Stock")} × ${r.quantity || 1}` : ""
    ].filter(Boolean);

    const row = document.createElement("div");
    row.className = "request-row";
    if (r.cartId) row.dataset.cartId = r.cartId;
    row.innerHTML = `
      ${thumbHtml}
      <div class="request-row-body">
        <div class="request-row-top">
          <span class="request-row-name">${escapeHtml(r.clientName)}</span>
          <span class="request-row-piece">${escapeHtml(r.productName || "—")}${r.productCode ? ` <span class="request-row-code">(${escapeHtml(r.productCode)})</span>` : ""}</span>
          ${r.cartId ? `<button type="button" class="request-cart-badge" data-cart-badge="${escapeHtml(r.cartId)}" title="Part of a ${r.cartSize || "multi"}-piece order submitted together">🛍 ${r.cartSize || "?"}-piece order</button>` : ""}
        </div>
        ${metaParts.length ? `<div class="request-row-meta">${metaParts.map(m => `<span>${m}</span>`).join("")}</div>` : ""}
        ${r.notes ? `<div class="request-row-notes">${escapeHtml(r.notes)}</div>` : ""}
      </div>
      <div class="request-row-side">
        <select class="status-select status-${r.status}" data-id="${id}">${optionsHtml}</select>
        <span class="request-row-date">${formatDate(r.createdAt)}</span>
        <div class="request-row-actions">
          <button class="icon-btn" data-view-request="${id}">View</button>
          <button class="icon-btn danger" data-delete-request="${id}">Delete</button>
        </div>
      </div>
    `;
    feed.appendChild(row);
  });

  feed.querySelectorAll("[data-view-request]").forEach((btn) => {
    btn.addEventListener("click", () => openRequestDetail(btn.dataset.viewRequest));
  });

  feed.querySelectorAll("[data-cart-badge]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cartId = btn.dataset.cartBadge;
      const siblings = feed.querySelectorAll(`.request-row[data-cart-id="${CSS.escape(cartId)}"]`);
      siblings.forEach((row) => row.classList.add("request-row-cart-highlight"));
      siblings[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => siblings.forEach((row) => row.classList.remove("request-row-cart-highlight")), 1600);
    });
  });

  feed.querySelectorAll("[data-delete-request]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this request? You can restore it later from the Activity Log if needed.")) return;
      const r = requestsById[btn.dataset.deleteRequest];
      try {
        await db.collection("requests").doc(btn.dataset.deleteRequest).delete();
        logActivity("Deleted request", r ? r.clientName : "", {
          snapshotCollection: "requests",
          snapshotId: btn.dataset.deleteRequest,
          snapshotData: r || null
        });
      } catch (err) {
        console.error("Failed to delete request:", err);
        alert("Couldn't delete this request. Please try again." + errSuffix(err));
      }
    });
  });

  feed.querySelectorAll(".status-select").forEach((sel) => {
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
requestsStatusFilter?.addEventListener("change", renderRequestsTable);

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

function updateProductImagePreview() {
  const wrap = document.getElementById("pImagePreviewWrap");
  const img = document.getElementById("pImagePreview");
  const firstUrl = document.getElementById("pImages").value.split("\n").map(l => l.trim()).find(Boolean);
  if (firstUrl) {
    img.src = firstUrl;
    img.style.objectPosition = `center ${document.getElementById("pImageFocus").value}`;
    wrap.style.display = "block";
  } else {
    wrap.style.display = "none";
  }
}

document.getElementById("pImages")?.addEventListener("input", updateProductImagePreview);
document.getElementById("pImageFocus")?.addEventListener("change", updateProductImagePreview);

// ---------- Ready-stock variants (size/color/stock) ----------

function addVariantRow(variant) {
  const wrap = document.getElementById("pVariantRows");
  const row = document.createElement("div");
  row.className = "variant-row";
  row.innerHTML = `
    <input type="text" class="variant-size" placeholder="Size (e.g. M)" value="${escapeHtml(variant?.size || "")}" />
    <input type="text" class="variant-color" placeholder="Color (e.g. Red)" value="${escapeHtml(variant?.color || "")}" />
    <input type="number" class="variant-stock" placeholder="Stock" min="0" value="${variant?.stock ?? ""}" />
    <button type="button" class="icon-btn danger" data-remove-variant>&times;</button>
  `;
  row.querySelector("[data-remove-variant]").addEventListener("click", () => row.remove());
  wrap.appendChild(row);
}

document.getElementById("pAddVariantBtn")?.addEventListener("click", () => addVariantRow());

document.getElementById("pAvailability")?.addEventListener("change", (e) => {
  document.getElementById("pVariantsWrap").style.display = e.target.value === "ready_stock" ? "block" : "none";
});

function collectVariants() {
  return [...document.querySelectorAll("#pVariantRows .variant-row")]
    .map((row) => ({
      size: row.querySelector(".variant-size").value.trim(),
      color: row.querySelector(".variant-color").value.trim(),
      stock: Math.max(0, parseInt(row.querySelector(".variant-stock").value, 10) || 0)
    }))
    .filter((v) => v.size || v.color || v.stock > 0);
}

const imageLightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

document.getElementById("pImagePreview")?.addEventListener("click", () => {
  lightboxImage.src = document.getElementById("pImagePreview").src;
  imageLightbox.classList.add("open");
});
lightboxClose?.addEventListener("click", () => imageLightbox.classList.remove("open"));
imageLightbox?.addEventListener("click", (e) => {
  if (e.target === imageLightbox) imageLightbox.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") imageLightbox?.classList.remove("open");
});

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
  document.getElementById("pAvailability").value = "made_to_order";
  document.getElementById("pVariantsWrap").style.display = "none";
  document.getElementById("pVariantRows").innerHTML = "";
  productFormStatus.className = "form-status";
  productFormStatus.textContent = "";
  updateProductImagePreview();
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
    imageFocus: document.getElementById("pImageFocus").value,
    availability: document.getElementById("pAvailability").value,
    variants: document.getElementById("pAvailability").value === "ready_stock" ? collectVariants() : []
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
      <td data-label="Piece">${escapeHtml(p.name)}${p.availability === "ready_stock" ? ` <span class="ready-badge">Ready Stock</span>` : ""}</td>
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
        document.getElementById("pAvailability").value = p.availability || "made_to_order";
        document.getElementById("pVariantRows").innerHTML = "";
        (p.variants || []).forEach((v) => addVariantRow(v));
        document.getElementById("pVariantsWrap").style.display = (p.availability === "ready_stock") ? "block" : "none";
        updateProductImagePreview();
        productFormTitle.textContent = "Edit Piece";
        openProductForm();
      });
    });

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this piece from the catalog? You can restore it later from the Activity Log if needed.")) return;
      const entry = allProductsAdmin.find(([id]) => id === btn.dataset.delete);
      try {
        await db.collection("products").doc(btn.dataset.delete).delete();
        logActivity("Deleted product", entry ? entry[1].name : "", {
          imageUrl: entry && entry[1].images ? entry[1].images[0] : null,
          snapshotCollection: "products",
          snapshotId: btn.dataset.delete,
          snapshotData: entry ? entry[1] : null
        });
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

// ---------- Categories ----------

const newCategoryBtn = document.getElementById("newCategoryBtn");
const categoryFormBackdrop = document.getElementById("categoryFormBackdrop");
const categoryFormClose = document.getElementById("categoryFormClose");
const categoryNameInput = document.getElementById("categoryName");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");
const cancelCategoryBtn = document.getElementById("cancelCategoryBtn");
const categoryFormStatus = document.getElementById("categoryFormStatus");
const pCategorySelect = document.getElementById("pCategory");

function openCategoryForm() { categoryFormBackdrop.classList.add("open"); }
function closeCategoryForm() { categoryFormBackdrop.classList.remove("open"); }

let allCategories = [];
let hasSeededCategories = false;

const DEFAULT_CATEGORIES = [
  "Dress", "Evening Gown", "Abaya", "Bridal", "Kaftan", "Cocktail",
  "Casual", "Skirt", "Pants", "Shirt", "T-Shirt", "Jumpsuit", "Blazer / Coat"
];

newCategoryBtn.addEventListener("click", () => {
  categoryNameInput.value = "";
  categoryFormStatus.className = "form-status";
  categoryFormStatus.textContent = "";
  openCategoryForm();
});

cancelCategoryBtn.addEventListener("click", closeCategoryForm);
categoryFormClose?.addEventListener("click", closeCategoryForm);
categoryFormBackdrop?.addEventListener("click", (e) => {
  if (e.target === categoryFormBackdrop) closeCategoryForm();
});

saveCategoryBtn.addEventListener("click", async () => {
  const name = categoryNameInput.value.trim();
  if (!name) {
    categoryFormStatus.className = "form-status error";
    categoryFormStatus.textContent = "Name is required.";
    return;
  }

  saveCategoryBtn.disabled = true;
  try {
    await db.collection("categories").add({
      name,
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logActivity("Created category", name);
    closeCategoryForm();
  } catch (err) {
    console.error("Failed to save category:", err);
    categoryFormStatus.className = "form-status error";
    categoryFormStatus.textContent = "Couldn't create this category. Please try again." + errSuffix(err);
  } finally {
    saveCategoryBtn.disabled = false;
  }
});

function populateCategorySelect() {
  const current = pCategorySelect.value;
  pCategorySelect.innerHTML = '<option value="">— Select a category —</option>' +
    allCategories
      .filter(c => c.status === "active")
      .map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
      .join("");
  pCategorySelect.value = current;
}

async function seedDefaultCategories() {
  hasSeededCategories = true;
  try {
    const batch = db.batch();
    DEFAULT_CATEGORIES.forEach((name) => {
      const ref = db.collection("categories").doc();
      batch.set(ref, { name, status: "active", createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
  } catch (err) {
    console.error("Failed to seed default categories:", err);
  }
}

function loadCategories() {
  db.collection("categories").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    allCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (allCategories.length === 0 && !hasSeededCategories) {
      seedDefaultCategories();
    }

    populateCategorySelect();

    const tbody = document.getElementById("categoriesTableBody");
    const empty = document.getElementById("categoriesEmpty");
    tbody.innerHTML = "";

    if (allCategories.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    allCategories.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Name">${escapeHtml(c.name)}</td>
        <td data-label="Status"><span class="status-pill status-${c.status === "active" ? "confirmed" : "delivered"}">${escapeHtml(c.status)}</span></td>
        <td data-label="">
          <button class="icon-btn" data-toggle-category="${c.id}" data-next="${c.status === "active" ? "archived" : "active"}">${c.status === "active" ? "Archive" : "Restore"}</button>
          <button class="icon-btn danger" data-delete-category="${c.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-toggle-category]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await db.collection("categories").doc(btn.dataset.toggleCategory).update({ status: btn.dataset.next });
          logActivity("Changed category status", btn.dataset.next);
        } catch (err) {
          console.error("Failed to update category status:", err);
          alert("Couldn't update this category. Please try again." + errSuffix(err));
        }
      });
    });

    tbody.querySelectorAll("[data-delete-category]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this category? Products already using it keep their value, but it won't be selectable anymore.")) return;
        const category = allCategories.find(c => c.id === btn.dataset.deleteCategory);
        try {
          await db.collection("categories").doc(btn.dataset.deleteCategory).delete();
          logActivity("Deleted category", category ? category.name : "", {
            snapshotCollection: "categories",
            snapshotId: btn.dataset.deleteCategory,
            snapshotData: category || null
          });
        } catch (err) {
          console.error("Failed to delete category:", err);
          alert("Couldn't delete this category. Please try again." + errSuffix(err));
        }
      });
    });
  }, (err) => console.error("Categories listener error:", err));
}

// ---------- Collections ----------

const newCollectionBtn = document.getElementById("newCollectionBtn");
const collectionFormBackdrop = document.getElementById("collectionFormBackdrop");
const collectionFormClose = document.getElementById("collectionFormClose");
const collectionNameInput = document.getElementById("collectionName");
const saveCollectionBtn = document.getElementById("saveCollectionBtn");
const cancelCollectionBtn = document.getElementById("cancelCollectionBtn");
const collectionFormStatus = document.getElementById("collectionFormStatus");
const pCollectionSelect = document.getElementById("pCollection");

let allCollections = [];

function openCollectionForm() { collectionFormBackdrop.classList.add("open"); }
function closeCollectionForm() { collectionFormBackdrop.classList.remove("open"); }

newCollectionBtn.addEventListener("click", () => {
  collectionNameInput.value = "";
  collectionFormStatus.className = "form-status";
  collectionFormStatus.textContent = "";
  openCollectionForm();
});

cancelCollectionBtn.addEventListener("click", closeCollectionForm);
collectionFormClose?.addEventListener("click", closeCollectionForm);
collectionFormBackdrop?.addEventListener("click", (e) => {
  if (e.target === collectionFormBackdrop) closeCollectionForm();
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
    closeCollectionForm();
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
          logActivity("Deleted collection", collection ? collection.name : "", {
            snapshotCollection: "collections",
            snapshotId: btn.dataset.deleteCollection,
            snapshotData: collection || null
          });
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
  setStep1TitleAr: "step1Title_ar",
  setStep1TitleEn: "step1Title_en",
  setStep1DescAr: "step1Desc_ar",
  setStep1DescEn: "step1Desc_en",
  setStep2TitleAr: "step2Title_ar",
  setStep2TitleEn: "step2Title_en",
  setStep2DescAr: "step2Desc_ar",
  setStep2DescEn: "step2Desc_en",
  setStep3TitleAr: "step3Title_ar",
  setStep3TitleEn: "step3Title_en",
  setStep3DescAr: "step3Desc_ar",
  setStep3DescEn: "step3Desc_en",
  setStep4TitleAr: "step4Title_ar",
  setStep4TitleEn: "step4Title_en",
  setStep4DescAr: "step4Desc_ar",
  setStep4DescEn: "step4Desc_en",
  setContactPhone: "contactPhone",
  setContactWhatsapp: "contactWhatsapp",
  setContactEmail: "contactEmail",
  setContactHoursAr: "contactHours_ar",
  setContactHoursEn: "contactHours_en",
  setAddressAr: "address_ar",
  setAddressEn: "address_en",
  setGoogleMapsUrl: "googleMapsUrl",
  setWazeUrl: "wazeUrl",
  setShopLatLng: "shopLatLng",
  setLogoUrl: "logoUrl"
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

    const logoImg = document.getElementById("brandLogo");
    const brandText = document.getElementById("brandText");
    if (logoImg && brandText) {
      if (data.logoUrl) {
        logoImg.src = data.logoUrl;
        brandText.style.display = "none";
      } else {
        logoImg.src = DEFAULT_LOGO_SRC;
        brandText.style.display = "inline";
      }
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
const staffFormBackdrop = document.getElementById("staffFormBackdrop");
const staffFormClose = document.getElementById("staffFormClose");
const staffFormTitle = document.getElementById("staffFormTitle");
const newStaffBtn = document.getElementById("newStaffBtn");

function openStaffForm() {
  staffFormBackdrop.classList.add("open");
}

function closeStaffForm() {
  staffFormBackdrop.classList.remove("open");
}

function resetStaffForm() {
  staffEditUid.value = "";
  document.getElementById("staffMatchedUid").value = "";
  document.getElementById("staffEmail").value = "";
  document.getElementById("staffEmail").disabled = false;
  document.getElementById("staffEmailMatchStatus").textContent = "";
  document.getElementById("staffName").value = "";
  document.getElementById("staffName").disabled = false;
  document.getElementById("staffRole").value = "staff";
  addStaffBtn.textContent = "Add Staff Member";
  staffFormTitle.textContent = "Add Staff Member";
  document.getElementById("staffFormStatus").className = "form-status";
  document.getElementById("staffFormStatus").textContent = "";
}

newStaffBtn?.addEventListener("click", () => {
  resetStaffForm();
  openStaffForm();
});

cancelStaffEditBtn?.addEventListener("click", () => {
  resetStaffForm();
  closeStaffForm();
});

staffFormClose?.addEventListener("click", closeStaffForm);
staffFormBackdrop?.addEventListener("click", (e) => {
  if (e.target === staffFormBackdrop) closeStaffForm();
});

function loadStaff() {
  db.collection("staff").onSnapshot((snapshot) => {
    const tbody = document.getElementById("staffTableBody");
    tbody.innerHTML = "";
    snapshot.forEach((doc) => {
      const s = doc.data();
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

    tbody.querySelectorAll("[data-edit-staff]").forEach((btn) => {
      btn.addEventListener("click", () => {
        staffEditUid.value = btn.dataset.editStaff;
        document.getElementById("staffEmail").value = btn.dataset.email;
        document.getElementById("staffEmail").disabled = true;
        document.getElementById("staffName").value = btn.dataset.name;
        document.getElementById("staffRole").value = btn.dataset.role;
        addStaffBtn.textContent = "Update Staff Member";
        staffFormTitle.textContent = "Edit Staff Member";
        document.getElementById("staffFormStatus").className = "form-status";
        document.getElementById("staffFormStatus").textContent = "";
        openStaffForm();
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

// Staff docs are keyed by Firebase Auth UID so security rules can check access.
// Rather than requiring a manual Firebase Console step, we look up the typed
// email against the `clients` collection (populated when someone signs up on
// the public site) so we can grab their real UID directly — no Auth Admin SDK
// needed, since every client already has a working login by the time they
// show up there.
let staffEmailLookupTimer = null;

async function lookupClientByEmail(email) {
  const normalized = email.trim();
  if (!normalized) return null;
  let snap = await db.collection("clients").where("email", "==", normalized).limit(1).get();
  if (snap.empty && normalized.toLowerCase() !== normalized) {
    snap = await db.collection("clients").where("email", "==", normalized.toLowerCase()).limit(1).get();
  }
  return snap.empty ? null : { uid: snap.docs[0].id, ...snap.docs[0].data() };
}

document.getElementById("staffEmail")?.addEventListener("input", (e) => {
  if (staffEditUid.value) return; // editing an existing staff member — no lookup needed
  const email = e.target.value;
  const statusEl = document.getElementById("staffEmailMatchStatus");
  const matchedField = document.getElementById("staffMatchedUid");
  matchedField.value = "";
  addStaffBtn.disabled = false;

  clearTimeout(staffEmailLookupTimer);
  if (!email.trim()) {
    statusEl.textContent = "";
    return;
  }
  statusEl.textContent = "Searching…";
  staffEmailLookupTimer = setTimeout(async () => {
    const client = await lookupClientByEmail(email);
    if (client) {
      matchedField.value = client.uid;
      statusEl.textContent = `✓ Found an account: ${client.name || client.email}`;
      if (!document.getElementById("staffName").value.trim()) {
        document.getElementById("staffName").value = client.name || "";
      }
    } else {
      statusEl.textContent = "No account found with this email yet — ask them to sign up on the site first, then try again.";
    }
  }, 400);
});

addStaffBtn?.addEventListener("click", async () => {
  const name = document.getElementById("staffName").value.trim();
  const role = document.getElementById("staffRole").value;
  const statusEl = document.getElementById("staffFormStatus");

  if (staffEditUid.value) {
    try {
      await db.collection("staff").doc(staffEditUid.value).update({ name, role });
      logActivity("Updated staff member", `${name} (${role})`);
      resetStaffForm();
      closeStaffForm();
    } catch (err) {
      console.error("Failed to update staff member:", err);
      statusEl.className = "form-status error";
      statusEl.textContent = "Couldn't update this person. Please try again." + errSuffix(err);
    }
    return;
  }

  const email = document.getElementById("staffEmail").value.trim();
  const matchedUid = document.getElementById("staffMatchedUid").value;
  if (!email) {
    statusEl.className = "form-status error";
    statusEl.textContent = "Email is required.";
    return;
  }
  if (!matchedUid) {
    statusEl.className = "form-status error";
    statusEl.textContent = "No account found with this email yet — ask them to sign up on the site first, then try again.";
    return;
  }

  try {
    await db.collection("staff").doc(matchedUid).set({
      name, email, role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logActivity("Added staff member", `${name} (${role})`);
    resetStaffForm();
    closeStaffForm();
  } catch (err) {
    console.error("Failed to add staff member:", err);
    statusEl.className = "form-status error";
    statusEl.textContent = "Couldn't add this person. Please try again." + errSuffix(err);
  }
});
