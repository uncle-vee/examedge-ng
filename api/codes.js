// ============================================================
//  api/codes.js — Access Code Generation and Validation
//  Handles: generate codes, validate codes, Paystack webhook
// ============================================================

const crypto = require("crypto");

// ── Generate a unique access code ────────────────────────────
function generateCode(tier) {
  const prefix  = tier === "junior" ? "JNR" : "SNR";
  const random  = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}

module.exports = async function handler(req, res) {

  // ── POST /api/codes — validate or generate a code ────────
  if (req.method === "POST") {
    const { action, code, tier, email, adminKey } = req.body;

    // ── ACTION: validate a code ──────────────────────────────
    if (action === "validate") {
      if (!code) return res.status(400).json({ error: "Code is required" });

      const { initializeApp, getApps } = require("firebase/app");
      const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require("firebase/firestore");

      const firebaseConfig = {
        apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.REACT_APP_FIREBASE_APP_ID,
      };

      const firebaseApp = getApps().length === 0
        ? initializeApp(firebaseConfig)
        : getApps()[0];
      const db = getFirestore(firebaseApp);

      try {
        const q    = query(collection(db, "accessCodes"), where("code", "==", code.trim().toUpperCase()));
        const snap = await getDocs(q);

        if (snap.empty) return res.status(404).json({ valid: false, error: "Invalid code. Please check and try again." });

        const codeDoc  = snap.docs[0];
        const codeData = codeDoc.data();

        if (codeData.used) return res.status(400).json({ valid: false, error: "This code has already been used." });
        if (codeData.expiresAt && codeData.expiresAt.toDate() < new Date()) return res.status(400).json({ valid: false, error: "This code has expired." });

        // Mark code as used
        await updateDoc(doc(db, "accessCodes", codeDoc.id), {
          used:     true,
          usedAt:   new Date(),
          usedBy:   email || "unknown",
        });

        return res.status(200).json({
          valid:  true,
          tier:   codeData.tier,
          plan:   codeData.plan || "term",
        });
      } catch (err) {
        console.error("Validate code error:", err);
        return res.status(500).json({ error: "Server error" });
      }
    }

    // ── ACTION: generate codes (admin only) ──────────────────
    if (action === "generate") {
      if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { initializeApp, getApps } = require("firebase/app");
      const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");

      const firebaseConfig = {
        apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.REACT_APP_FIREBASE_APP_ID,
      };

      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const db = getFirestore(firebaseApp);

      const count    = parseInt(req.body.count || "1");
      const newCodes = [];

      for (let i = 0; i < Math.min(count, 50); i++) {
        const newCode = generateCode(tier);
        await addDoc(collection(db, "accessCodes"), {
          code:      newCode,
          tier:      tier || "junior",
          plan:      "term",
          used:      false,
          createdAt: serverTimestamp(),
          createdBy: "admin",
          email:     email || "",
        });
        newCodes.push(newCode);
      }

      return res.status(200).json({ codes: newCodes });
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
