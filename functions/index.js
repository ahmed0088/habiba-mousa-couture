const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

function findVariant(variants, size, color) {
  return (variants || []).find(
    (v) => (v.size || null) === (size || null) && (v.color || null) === (color || null)
  );
}

// Public clients have no write access to `products` (see firestore.rules) --
// on purpose, since inventory shouldn't be something a browser can edit
// directly. This function is the one trusted, server-side place where a
// ready-stock item's stock is actually checked and decremented, atomically,
// as part of the same transaction that creates the request doc(s). A plain
// client-side write (even with a Firestore transaction) would still mean
// trusting the client to run the correct logic at all, and would need
// public write access to `products` to work.
exports.submitRequest = onCall(async (request) => {
  const data = request.data || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const clientName = String(data.clientName || "").trim();
  const clientPhone = String(data.clientPhone || "").trim();

  if (!clientName || !clientPhone) {
    throw new HttpsError("invalid-argument", "Name and phone are required.");
  }
  if (items.length === 0) {
    throw new HttpsError("invalid-argument", "At least one item is required.");
  }

  const clientAddress = String(data.clientAddress || "").trim();
  const clientLocationUrl = data.clientLocationUrl || null;
  const preferredDate = data.preferredDate || null;
  const notes = String(data.notes || "").trim();
  const clientUid = request.auth ? request.auth.uid : null;

  const cartId = items.length > 1 ? db.collection("requests").doc().id : null;
  const cartSize = items.length > 1 ? items.length : null;

  await db.runTransaction(async (tx) => {
    // ---- READ phase: every ready-stock product this submission touches ----
    const productIds = [...new Set(
      items.filter((i) => i.orderType === "ready_stock" && i.productId).map((i) => i.productId)
    )];
    const productSnaps = {};
    for (const pid of productIds) {
      productSnaps[pid] = await tx.get(db.collection("products").doc(pid));
    }

    // ---- Validate stock + compute the post-order variants in memory ----
    const workingVariants = {};
    for (const pid of productIds) {
      const snap = productSnaps[pid];
      if (!snap.exists) {
        throw new HttpsError("failed-precondition", `MISSING_PRODUCT:${pid}`);
      }
      workingVariants[pid] = (snap.data().variants || []).map((v) => ({ ...v }));
    }

    for (const item of items) {
      if (item.orderType !== "ready_stock") continue;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const variants = workingVariants[item.productId];
      const variant = findVariant(variants, item.selectedSize, item.selectedColor);
      if (!variant || (variant.stock || 0) < qty) {
        throw new HttpsError("failed-precondition", `OUT_OF_STOCK:${item.productId}`);
      }
      variant.stock -= qty;
    }

    // ---- WRITE phase: commit decremented stock + create the request doc(s) ----
    productIds.forEach((pid) => {
      tx.update(db.collection("products").doc(pid), { variants: workingVariants[pid] });
    });

    items.forEach((item) => {
      const ref = db.collection("requests").doc();
      const payload = {
        productId: item.productId || null,
        productName: item.productName || null,
        productCode: item.productCode || null,
        clientName,
        clientPhone,
        clientAddress,
        clientLocationUrl,
        material: item.material || "unspecified",
        preferredDate,
        notes,
        status: "new",
        clientUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      if (cartId) {
        payload.cartId = cartId;
        payload.cartSize = cartSize;
      }
      if (item.orderType === "ready_stock") {
        payload.orderType = "ready_stock";
        payload.selectedSize = item.selectedSize || null;
        payload.selectedColor = item.selectedColor || null;
        payload.quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      }
      tx.set(ref, payload);
    });
  });

  return { success: true };
});
