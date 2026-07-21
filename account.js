// ================================
// Client account logic — shared by all public pages (not admin.html)
// Auth: Firebase Auth (email/password), same project as staff login but
// these users have no "staff" doc, so they never gain dashboard access.
// Tracking: requests where clientUid == the signed-in user's uid.
// ================================

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

let myRequestsUnsubscribe = null;

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
    await auth.signInWithEmailAndPassword(
      document.getElementById("signInEmail").value.trim(),
      document.getElementById("signInPassword").value
    );
    signInForm.reset();
    closeAccountModal();
  } catch (err) {
    console.error("Sign in failed:", err);
    signInStatus.className = "form-status error";
    signInStatus.textContent = t("account_signin_error");
  } finally {
    signInBtn.disabled = false;
    signInBtn.textContent = t("account_signin_btn");
  }
});

signUpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  signUpBtn.disabled = true;
  signUpBtn.textContent = t("account_signup_btn_loading");
  signUpStatus.className = "form-status";
  const name = document.getElementById("signUpName").value.trim();
  try {
    const cred = await auth.createUserWithEmailAndPassword(
      document.getElementById("signUpEmail").value.trim(),
      document.getElementById("signUpPassword").value
    );
    if (name) await cred.user.updateProfile({ displayName: name });
    signUpForm.reset();
    closeAccountModal();
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
  } catch (err) {
    console.error("Google sign in failed:", err);
    signInStatus.className = "form-status error";
    signInStatus.textContent = t("account_google_error");
  } finally {
    googleSignInBtn.disabled = false;
  }
});

accountSignOutBtn?.addEventListener("click", () => auth.signOut());

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

function renderMyRequests(docs) {
  if (!myRequestsList) return;
  myRequestsList.innerHTML = "";

  if (docs.length === 0) {
    myRequestsEmpty.style.display = "block";
    myRequestsEmpty.textContent = t("my_requests_empty");
    return;
  }
  myRequestsEmpty.style.display = "none";

  docs.forEach((r) => {
    const row = document.createElement("div");
    row.className = "my-request-row";
    row.innerHTML = `
      <div class="my-request-piece">${escapeHtmlAccount(r.productName || "—")}</div>
      <span class="status-pill status-${escapeHtmlAccount(r.status)}">${escapeHtmlAccount(t(STATUS_KEY_MAP[r.status] || r.status))}</span>
      <div class="my-request-date">${formatDateAccount(r.createdAt)}</div>
    `;
    myRequestsList.appendChild(row);
  });
}

function loadMyRequests(uid) {
  if (myRequestsUnsubscribe) myRequestsUnsubscribe();
  myRequestsUnsubscribe = db.collection("requests")
    .where("clientUid", "==", uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => renderMyRequests(snapshot.docs.map((d) => d.data())),
      (err) => console.error("My requests listener error:", err)
    );
}

auth.onAuthStateChanged((user) => {
  if (user) {
    if (accountSignInBtn) accountSignInBtn.style.display = "none";
    if (accountSignedIn) accountSignedIn.style.display = "inline-flex";
    loadMyRequests(user.uid);
  } else {
    if (accountSignInBtn) accountSignInBtn.style.display = "inline-block";
    if (accountSignedIn) accountSignedIn.style.display = "none";
    if (myRequestsUnsubscribe) {
      myRequestsUnsubscribe();
      myRequestsUnsubscribe = null;
    }
    if (myRequestsList) myRequestsList.innerHTML = "";
    closeMyRequests();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAccountModal();
    closeMyRequests();
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
