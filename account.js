// ================================
// Client account logic — shared by all public pages (not admin.html)
// Auth: Firebase Auth (email/password), same project as staff login but
// these users have no "staff" doc, so they never gain dashboard access.
// Tracking: requests where clientUid == the signed-in user's uid.
// ================================

// ---------- Shared animated success popup (used for sign-in and request submission) ----------

const successBackdrop = document.getElementById("successBackdrop");

function showSuccessPopup(titleKey, messageKey) {
  if (!successBackdrop) return;
  const titleEl = document.getElementById("successTitle");
  const msgEl = document.getElementById("successMessage");
  if (titleEl) titleEl.textContent = t(titleKey);
  if (msgEl) msgEl.textContent = t(messageKey);
  // CSS animations only play once per DOM node — clone the SVG so it replays each time.
  const oldSvg = successBackdrop.querySelector(".success-check");
  if (oldSvg) oldSvg.parentNode.replaceChild(oldSvg.cloneNode(true), oldSvg);
  successBackdrop.classList.add("open");
}

document.getElementById("successCloseBtn")?.addEventListener("click", () => successBackdrop?.classList.remove("open"));
successBackdrop?.addEventListener("click", (e) => {
  if (e.target === successBackdrop) successBackdrop.classList.remove("open");
});

const accountSignInBtn = document.getElementById("accountSignInBtn");
const accountSignedIn = document.getElementById("accountSignedIn");
const myRequestsBtn = document.getElementById("myRequestsBtn");
const accountSignOutBtn = document.getElementById("accountSignOutBtn");

const accountModalBackdrop = document.getElementById("accountModalBackdrop");
const accountModalClose = document.getElementById("accountModalClose");
const accountTabs = document.querySelectorAll(".account-tab");
const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");
const signInStatus = document.getElementById("signInStatus");
const signUpStatus = document.getElementById("signUpStatus");
const signInBtn = document.getElementById("signInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");

const myRequestsBackdrop = document.getElementById("myRequestsBackdrop");
const myRequestsClose = document.getElementById("myRequestsClose");
const myRequestsList = document.getElementById("myRequestsList");
const myRequestsEmpty = document.getElementById("myRequestsEmpty");

const completeProfileBackdrop = document.getElementById("completeProfileBackdrop");
const completeProfileForm = document.getElementById("completeProfileForm");
const completeProfilePhone = document.getElementById("completeProfilePhone");
const completeProfileStatus = document.getElementById("completeProfileStatus");
const completeProfileBtn = document.getElementById("completeProfileBtn");
const completeProfileClose = document.getElementById("completeProfileClose");

let myRequestsUnsubscribe = null;
let currentClientProfile = null;

const myAccountName = document.getElementById("myAccountName");
const myAccountPhone = document.getElementById("myAccountPhone");
const myAccountAddress = document.getElementById("myAccountAddress");
const myAccountSaveBtn = document.getElementById("myAccountSaveBtn");
const myAccountStatus = document.getElementById("myAccountStatus");

// ---------- Floating scroll-jump + WhatsApp ----------

const scrollJumpBtn = document.getElementById("scrollJumpBtn");

function updateScrollJumpBtn() {
  if (!scrollJumpBtn) return;
  const scrolled = window.scrollY > 300;
  scrollJumpBtn.textContent = scrolled ? "↑" : "↓";
  scrollJumpBtn.setAttribute("aria-label", scrolled ? t("scroll_top_label") : t("scroll_jump_label"));
  scrollJumpBtn.style.display = document.body.scrollHeight > window.innerHeight * 1.3 ? "flex" : "none";
}

window.addEventListener("scroll", updateScrollJumpBtn);
window.addEventListener("resize", updateScrollJumpBtn);
scrollJumpBtn?.addEventListener("click", () => {
  if (window.scrollY > 300) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
  }
});
updateScrollJumpBtn();
window.addEventListener("load", updateScrollJumpBtn);
// Gallery/products render asynchronously after Firestore data arrives, changing
// page height well after the initial check — re-check once things settle.
setTimeout(updateScrollJumpBtn, 1500);

// ---------- Mobile nav toggle ----------

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (e) => {
  if (!navLinks?.classList.contains("open")) return;
  if (navLinks.contains(e.target) || navToggle?.contains(e.target)) return;
  navLinks.classList.remove("open");
  navToggle?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navLinks?.classList.contains("open")) {
    navLinks.classList.remove("open");
    navToggle?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

function escapeHtmlAccount(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function formatDateAccount(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---------- Sign in / sign up modal ----------

function openAccountModal() {
  signInForm.style.display = "block";
  signUpForm.style.display = "none";
  accountTabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === "signin"));
  signInStatus.className = "form-status";
  signInStatus.textContent = "";
  signUpStatus.className = "form-status";
  signUpStatus.textContent = "";
  accountModalBackdrop.classList.add("open");
}

function closeAccountModal() {
  accountModalBackdrop.classList.remove("open");
}

accountSignInBtn?.addEventListener("click", openAccountModal);
accountModalClose?.addEventListener("click", closeAccountModal);
accountModalBackdrop?.addEventListener("click", (e) => {
  if (e.target === accountModalBackdrop) closeAccountModal();
});

accountTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    accountTabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const isSignIn = btn.dataset.tab === "signin";
    signInForm.style.display = isSignIn ? "block" : "none";
    signUpForm.style.display = isSignIn ? "none" : "block";
  });
});

signInForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  signInBtn.disabled = true;
  signInBtn.textContent = t("account_signin_btn_loading");
  signInStatus.className = "form-status";
  try {
    const remember = document.getElementById("signInRemember")?.checked !== false;
    await auth.setPersistence(remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
    await auth.signInWithEmailAndPassword(
      document.getElementById("signInEmail").value.trim(),
      document.getElementById("signInPassword").value
    );
    signInForm.reset();
    closeAccountModal();
    showSuccessPopup("account_signin_success_title", "account_signin_success_message");
  } catch (err) {
    console.error("Sign in failed:", err);
    signInStatus.className = "form-status error";
    signInStatus.textContent = t("account_signin_error");
  } finally {
    signInBtn.disabled = false;
    signInBtn.textContent = t("account_signin_btn");
  }
});

document.getElementById("signInForgotBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("signInEmail").value.trim();
  if (!email) {
    signInStatus.className = "form-status error";
    signInStatus.textContent = t("account_forgot_password_need_email");
    return;
  }
  try {
    await auth.sendPasswordResetEmail(email);
    signInStatus.className = "form-status success";
    signInStatus.textContent = t("account_forgot_password_sent");
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    signInStatus.className = "form-status error";
    signInStatus.textContent = t("account_forgot_password_error");
  }
});

document.querySelectorAll(".password-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "\u{1F648}" : "\u{1F441}️";
    btn.setAttribute("aria-label", t(show ? "password_hide_label" : "password_show_label"));
  });
});

signUpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  signUpBtn.disabled = true;
  signUpBtn.textContent = t("account_signup_btn_loading");
  signUpStatus.className = "form-status";
  const name = document.getElementById("signUpName").value.trim();
  const phone = document.getElementById("signUpPhone").value.trim();
  try {
    const cred = await auth.createUserWithEmailAndPassword(
      document.getElementById("signUpEmail").value.trim(),
      document.getElementById("signUpPassword").value
    );
    if (name) await cred.user.updateProfile({ displayName: name });
    await db.collection("clients").doc(cred.user.uid).set({
      name,
      email: cred.user.email,
      phone,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    signUpForm.reset();
    closeAccountModal();
    showSuccessPopup("account_signup_success_title", "account_signup_success_message");
  } catch (err) {
    console.error("Sign up failed:", err);
    signUpStatus.className = "form-status error";
    signUpStatus.textContent = t("account_signup_error");
  } finally {
    signUpBtn.disabled = false;
    signUpBtn.textContent = t("account_signup_btn");
  }
});

googleSignInBtn?.addEventListener("click", async () => {
  googleSignInBtn.disabled = true;
  signInStatus.className = "form-status";
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    closeAccountModal();
    showSuccessPopup("account_signin_success_title", "account_signin_success_message");
  } catch (err) {
    console.error("Google sign in failed:", err);
    signInStatus.className = "form-status error";
    signInStatus.textContent = t("account_google_error");
  } finally {
    googleSignInBtn.disabled = false;
  }
});

accountSignOutBtn?.addEventListener("click", () => auth.signOut());

// ---------- Complete profile (phone number) ----------
// Shown after Google sign-in (which doesn't collect a phone number) or for any
// account created before this feature existed — email/password signup already
// captures phone directly, so this only fires when a client's "clients" doc is missing.

function openCompleteProfile() {
  completeProfileStatus.className = "form-status";
  completeProfileStatus.textContent = "";
  completeProfileBackdrop.classList.add("open");
}

function closeCompleteProfile() {
  completeProfileBackdrop.classList.remove("open");
}

completeProfileClose?.addEventListener("click", closeCompleteProfile);

completeProfileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  completeProfileBtn.disabled = true;
  completeProfileBtn.textContent = t("account_profile_save_loading");
  completeProfileStatus.className = "form-status";
  try {
    await db.collection("clients").doc(user.uid).set({
      name: user.displayName || "",
      email: user.email || "",
      phone: completeProfilePhone.value.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    completeProfileForm.reset();
    closeCompleteProfile();
  } catch (err) {
    console.error("Failed to save profile:", err);
    completeProfileStatus.className = "form-status error";
    completeProfileStatus.textContent = t("account_profile_error");
  } finally {
    completeProfileBtn.disabled = false;
    completeProfileBtn.textContent = t("account_profile_save");
  }
});

// ---------- My Requests ----------

function openMyRequests() {
  myRequestsBackdrop.classList.add("open");
}

function closeMyRequests() {
  myRequestsBackdrop.classList.remove("open");
}

myRequestsBtn?.addEventListener("click", openMyRequests);
myRequestsClose?.addEventListener("click", closeMyRequests);
myRequestsBackdrop?.addEventListener("click", (e) => {
  if (e.target === myRequestsBackdrop) closeMyRequests();
});

const STATUS_KEY_MAP = {
  new: "status_new",
  contacted: "status_contacted",
  confirmed: "status_confirmed",
  in_progress: "status_in_progress",
  delivered: "status_delivered",
  cancelled: "status_cancelled"
};

let productsCacheForRequests = {};
db.collection("products").get().then((snap) => {
  snap.docs.forEach((doc) => { productsCacheForRequests[doc.id] = doc.data(); });
}).catch((err) => console.error("Failed to load product photos for My Requests:", err));

function renderRequestRow(r, suppressCartTag) {
  const row = document.createElement("div");
  row.className = "my-request-row";
  const product = r.productId ? productsCacheForRequests[r.productId] : null;
  const thumbSrc = product && product.images && product.images[0] ? product.images[0] : "";
  const thumbFocus = product && product.imageFocus ? product.imageFocus : "top";
  const thumbHtml = thumbSrc
    ? `<img class="my-request-thumb" src="${escapeHtmlAccount(thumbSrc)}" alt="" style="object-position: center ${escapeHtmlAccount(thumbFocus)};" loading="lazy" />`
    : `<div class="my-request-thumb-empty"></div>`;
  const tagsHtml = [
    r.orderNumber ? `<span class="my-request-order-number">#${escapeHtmlAccount(r.orderNumber)}</span>` : "",
    (r.cartId && !suppressCartTag) ? `<span class="my-request-cart-tag">🛍 ${escapeHtmlAccount(t("my_requests_multi_item").replace("{count}", r.cartSize || "?"))}</span>` : "",
    (r.recipientName || r.recipientAddress) ? `<span class="my-request-cart-tag">${escapeHtmlAccount(t("recipient_badge"))}</span>` : ""
  ].filter(Boolean).join("");
  row.innerHTML = `
    ${thumbHtml}
    <div class="my-request-piece">
      ${tagsHtml ? `<div class="my-request-tags">${tagsHtml}</div>` : ""}
      <div class="my-request-name">${escapeHtmlAccount(r.productName || "—")}</div>
      ${(r.recipientName || r.recipientAddress) ? `<div class="my-request-recipient">${escapeHtmlAccount([r.recipientName, r.recipientAddress].filter(Boolean).join(" · "))}</div>` : ""}
    </div>
    <div class="my-request-meta">
      <span class="status-pill status-${escapeHtmlAccount(r.status)}">${escapeHtmlAccount(t(STATUS_KEY_MAP[r.status] || r.status))}</span>
      <div class="my-request-date">${formatDateAccount(r.createdAt)}</div>
    </div>
  `;
  return row;
}

// Requests render newest-first from Firestore already; only a slice is shown at a time
// so a client with hundreds of orders doesn't dump them all into the DOM at once.
const REQUESTS_PAGE_SIZE = 8;
let currentShowCount = REQUESTS_PAGE_SIZE;
let pastShowCount = REQUESTS_PAGE_SIZE;

// A multi-item order writes one requests doc per piece; group them back
// together so a 3-piece order always shows as 3 adjacent rows instead of
// wherever each piece's own timestamp happens to fall in the list.
function groupMyRequests(items) {
  const groups = [];
  const indexByCartId = new Map();
  items.forEach((r) => {
    if (r.cartId && indexByCartId.has(r.cartId)) {
      groups[indexByCartId.get(r.cartId)].push(r);
    } else {
      if (r.cartId) indexByCartId.set(r.cartId, groups.length);
      groups.push([r]);
    }
  });
  // `items` is newest-first, so a group's items were collected newest-first
  // too — reverse to show them in original submission order.
  groups.forEach((g) => { if (g.length > 1) g.reverse(); });
  return groups;
}

function renderRequestGroup(container, titleKey, items, showCount, onShowMore) {
  if (items.length === 0) return;
  const heading = document.createElement("p");
  heading.className = "my-requests-group-title";
  heading.textContent = t(titleKey);
  container.appendChild(heading);

  const groups = groupMyRequests(items);
  const toRender = [];
  let shown = 0;
  for (const g of groups) {
    toRender.push(g);
    shown += g.length;
    if (shown >= showCount) break;
  }

  toRender.forEach((g) => {
    if (g.length > 1) {
      const groupEl = document.createElement("div");
      groupEl.className = "my-request-cart-group";
      const label = document.createElement("div");
      label.className = "my-request-cart-group-label";
      label.textContent = `🛍 ${t("my_requests_group_label").replace("{count}", g[0].cartSize || g.length)}`;
      groupEl.appendChild(label);
      g.forEach(r => groupEl.appendChild(renderRequestRow(r, true)));
      container.appendChild(groupEl);
    } else {
      container.appendChild(renderRequestRow(g[0]));
    }
  });

  if (shown < items.length) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "btn-link my-requests-more-btn";
    moreBtn.textContent = `${t("my_requests_show_more")} (${items.length - shown})`;
    moreBtn.addEventListener("click", onShowMore);
    container.appendChild(moreBtn);
  }
}

let lastMyRequestsDocs = [];

function renderMyRequests(docs) {
  if (!myRequestsList) return;
  lastMyRequestsDocs = docs;
  myRequestsList.innerHTML = "";

  const statusFilter = document.getElementById("myRequestsStatusFilter")?.value || "all";
  const filtered = statusFilter === "all" ? docs : docs.filter(r => r.status === statusFilter);

  if (filtered.length === 0) {
    myRequestsEmpty.style.display = "block";
    myRequestsEmpty.textContent = t(statusFilter === "all" ? "my_requests_empty" : "my_requests_empty_filtered");
    return;
  }
  myRequestsEmpty.style.display = "none";

  const past = filtered.filter(r => r.status === "delivered" || r.status === "cancelled");
  const current = filtered.filter(r => r.status !== "delivered" && r.status !== "cancelled");

  renderRequestGroup(myRequestsList, "my_requests_current", current, currentShowCount, () => {
    currentShowCount += REQUESTS_PAGE_SIZE;
    renderMyRequests(docs);
  });
  renderRequestGroup(myRequestsList, "my_requests_past", past, pastShowCount, () => {
    pastShowCount += REQUESTS_PAGE_SIZE;
    renderMyRequests(docs);
  });
}

document.getElementById("myRequestsStatusFilter")?.addEventListener("change", () => {
  renderMyRequests(lastMyRequestsDocs);
});

function loadMyRequests(uid) {
  if (myRequestsUnsubscribe) myRequestsUnsubscribe();
  myRequestsUnsubscribe = db.collection("requests")
    .where("clientUid", "==", uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => renderMyRequests(snapshot.docs.map((d) => d.data())),
      (err) => {
        console.error("My requests listener error:", err);
        if (myRequestsList) myRequestsList.innerHTML = "";
        if (myRequestsEmpty) {
          myRequestsEmpty.style.display = "block";
          myRequestsEmpty.textContent = `Couldn't load your requests (${err.code || err.message}). If this says "failed-precondition", a Firestore index still needs to be created — check the browser console for a link.`;
        }
      }
    );
}

function populateMyAccountForm() {
  if (!myAccountName) return;
  const p = currentClientProfile || {};
  myAccountName.value = p.name || "";
  myAccountPhone.value = p.phone || "";
  myAccountAddress.value = p.address || "";
}

myAccountSaveBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;
  myAccountSaveBtn.disabled = true;
  myAccountStatus.className = "form-status";
  myAccountStatus.textContent = "";
  const data = {
    name: myAccountName.value.trim(),
    phone: myAccountPhone.value.trim(),
    address: myAccountAddress.value.trim(),
    email: user.email || ""
  };
  try {
    await db.collection("clients").doc(user.uid).set(data, { merge: true });
    currentClientProfile = { ...(currentClientProfile || {}), ...data };
    myAccountStatus.className = "form-status success";
    myAccountStatus.textContent = t("my_account_saved");
  } catch (err) {
    console.error("Failed to save profile:", err);
    myAccountStatus.className = "form-status error";
    myAccountStatus.textContent = t("my_account_error");
  } finally {
    myAccountSaveBtn.disabled = false;
  }
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    if (accountSignInBtn) accountSignInBtn.style.display = "none";
    if (accountSignedIn) accountSignedIn.style.display = "inline-flex";
    loadMyRequests(user.uid);
    try {
      const clientDoc = await db.collection("clients").doc(user.uid).get();
      if (!clientDoc.exists) {
        openCompleteProfile();
      } else {
        currentClientProfile = clientDoc.data();
        populateMyAccountForm();
      }
    } catch (err) {
      console.error("Client profile check failed:", err);
    }
  } else {
    if (accountSignInBtn) accountSignInBtn.style.display = "inline-block";
    if (accountSignedIn) accountSignedIn.style.display = "none";
    if (myRequestsUnsubscribe) {
      myRequestsUnsubscribe();
      myRequestsUnsubscribe = null;
    }
    if (myRequestsList) myRequestsList.innerHTML = "";
    currentClientProfile = null;
    closeMyRequests();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAccountModal();
    closeMyRequests();
    closeCompleteProfile();
  }
});

// Re-render dynamic (JS-generated) content whenever the language toggles,
// since data-i18n only covers static markup (see i18n.js).
document.addEventListener("langchange", () => {
  if (auth.currentUser) {
    loadMyRequests(auth.currentUser.uid);
  } else if (myRequestsEmpty) {
    myRequestsEmpty.textContent = t("my_requests_empty");
  }
});
