// ============================================================
//  api/codes.js — Access Code Validation via REST API
//  Uses Firestore REST API to avoid SDK import issues
// ============================================================

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, code, email } = req.body;

  if (action !== "validate") return res.status(400).json({ error: "Invalid action" });
  if (!code) return res.status(400).json({ valid: false, error: "Please enter an access code." });

  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const apiKey    = process.env.REACT_APP_FIREBASE_API_KEY;

  try {
    // ── Query Firestore REST API for the code ──────────────
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "accessCodes" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "code" },
            op: "EQUAL",
            value: { stringValue: code.trim().toUpperCase() },
          },
        },
        limit: 1,
      },
    };

    const queryRes  = await fetch(queryUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(queryBody) });
    const queryData = await queryRes.json();

    // Check if document was found
    if (!queryData || !queryData[0] || !queryData[0].document) {
      return res.status(404).json({ valid: false, error: "Invalid code. Please check and try again." });
    }

    const docData   = queryData[0].document;
    const docName   = docData.name;
    const fields    = docData.fields;

    const isUsed    = fields.used?.booleanValue === true;
    const tier      = fields.tier?.stringValue || "junior";

    if (isUsed) {
      return res.status(400).json({ valid: false, error: "This code has already been used. Please contact the administrator." });
    }

    // ── Mark code as used via REST API ─────────────────────
    const updateUrl  = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=used&updateMask.fieldPaths=usedAt&updateMask.fieldPaths=usedBy&key=${apiKey}`;
    const updateBody = {
      fields: {
        used:   { booleanValue: true },
        usedAt: { stringValue: new Date().toISOString() },
        usedBy: { stringValue: email || "unknown" },
      },
    };

    await fetch(updateUrl, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateBody) });

    return res.status(200).json({ valid: true, tier });

  } catch (err) {
    console.error("Code validation error:", err.message);
    return res.status(500).json({ valid: false, error: "Server error. Please try again." });
  }
};
