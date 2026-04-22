// ============================================================
//  api/paystack-webhook.js — Auto code generation after payment
//  Paystack calls this URL when payment is confirmed
// ============================================================

const crypto = require("crypto");

function generateCode(tier) {
  const prefix = tier === "junior" ? "JNR" : "SNR";
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Verify Paystack signature ─────────────────────────────
  const secret    = process.env.PAYSTACK_SECRET_KEY;
  const hash      = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");
  const signature = req.headers["x-paystack-signature"];

  if (hash !== signature) {
    console.error("Invalid Paystack signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body;

  // Only handle successful charges
  if (event.event !== "charge.success") {
    return res.status(200).json({ received: true });
  }

  const { email, amount, metadata } = event.data;
  const tier = metadata?.tier || (amount >= 3000000 ? "senior" : "junior");
  // amount is in kobo: ₦20,000 = 2000000 kobo, ₦30,000 = 3000000 kobo

  try {
    // ── Save code to Firestore ──────────────────────────────
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

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db  = getFirestore(app);

    const newCode = generateCode(tier);

    await addDoc(collection(db, "accessCodes"), {
      code:       newCode,
      tier,
      plan:       "term",
      used:       false,
      email,
      amount:     amount / 100,
      reference:  event.data.reference,
      createdAt:  serverTimestamp(),
      createdBy:  "paystack",
    });

    // ── Send email with code via Resend or EmailJS ──────────
    // Using a simple fetch to an email API
    const emailBody = `
Dear Student,

Thank you for subscribing to ExamEdge NG!

Your access code is:

🔑 ${newCode}

Subscription: ${tier === "junior" ? "Junior Category (JSS1–JSS3)" : "Senior Category (SS1–SS3)"}
Amount Paid: ₦${(amount / 100).toLocaleString()}

How to use your code:
1. Go to examedge-ng.vercel.app
2. Sign in with Google
3. Click "I have an access code"
4. Enter the code above
5. Select your class and start learning!

Your code can only be used once. Keep it safe.

If you need help, reply to this email or contact the administrator.

Welcome to ExamEdge NG — The AI Advantage! 🎓
    `.trim();

    // Send via Resend (if configured) or log it
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from:    "ExamEdge NG <noreply@examedge-ng.com>",
          to:      email,
          subject: `Your ExamEdge NG Access Code — ${newCode}`,
          text:    emailBody,
        }),
      });
    }

    console.log(`✅ Code ${newCode} generated for ${email} (${tier})`);
    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
