const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// Same public Web API key as firebase-config.js (Firebase web API keys are not
// secret — access is enforced by Firestore/Auth rules, not by hiding this).
const WEB_API_KEY = "AIzaSyAVggc4qcmmISMmq4RLrMzs3Wp_T0En2RQ";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Triggers Firebase Auth's built-in "reset your password" email (same template
// used by the client SDK's sendPasswordResetEmail) via the Identity Toolkit
// REST API, so no separate email service needs to be configured.
async function sendPasswordSetupEmail(email) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${WEB_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    }
  );
  if (!res.ok) {
    throw new Error(`sendOobCode failed: ${res.status} ${await res.text()}`);
  }
}

// Callable from the admin dashboard. Creates (or reuses) the Firebase Auth user
// for a new staff member, creates their `staff/{uid}` doc immediately so access
// rules pick them up right away, and emails them a link to set their password —
// replacing the old manual "create the Auth user yourself, then paste their UID"
// flow.
exports.createStaffMember = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const callerDoc = await admin.firestore().collection("staff").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can add staff members.");
  }

  const email = String(request.data?.email || "").trim().toLowerCase();
  const name = String(request.data?.name || "").trim();
  const role = request.data?.role === "admin" ? "admin" : "staff";

  if (!email || !EMAIL_RE.test(email)) {
    throw new HttpsError("invalid-argument", "A valid email is required.");
  }
  if (!name) {
    throw new HttpsError("invalid-argument", "Name is required.");
  }

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
  }
  if (!userRecord) {
    userRecord = await admin.auth().createUser({ email, displayName: name });
  }

  await admin.firestore().collection("staff").doc(userRecord.uid).set({
    name,
    email,
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: callerUid,
  });

  let emailSent = true;
  try {
    await sendPasswordSetupEmail(email);
  } catch (err) {
    console.error("Failed to send password setup email:", err);
    emailSent = false;
  }

  return { uid: userRecord.uid, emailSent };
});
