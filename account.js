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

const completeProfileBackdrop = document.getElementById("completeProfileBackdrop");
const completeProfileForm = document.getElementById("completeProfileForm");
const completeProfilePhone = document.getElementById("completeProfilePhone");
const completeProfileStatus = document.getElementById("completeProfileStatus");
const completeProfileBtn = document.getElementById("completeProfileBtn");
const completeProfileClose = document.getElementById("completeProfileClose");

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

auth.onAuthStateChanged(async (user) => {
  if (user) {
    if (accountSignInBtn) accountSignInBtn.style.display = "none";
    if (accountSignedIn) accountSignedIn.style.display = "inline-flex";
    loadMyRequests(user.uid);
    try {
      const clientDoc = await db.collection("clients").doc(user.uid).get();
      if (!clientDoc.exists) openCompleteProfile();
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
