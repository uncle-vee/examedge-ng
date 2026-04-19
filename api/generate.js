// ============================================================
//  api/generate.js — Compendium generation via Google Gemini
// ============================================================

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subjectName, pdfBase64, pdfName, referenceUrls, adminRefs } = req.body;

  if (!subjectName) {
    return res.status(400).json({ error: "subjectName is required" });
  }

  // ── Build reference context ───────────────────────────────
  let refContext = "";

  if (adminRefs && adminRefs.length > 0) {
    refContext += "\n\n## Admin-Provided Reference Materials\nUse these to improve accuracy:\n";
    adminRefs.forEach((r, i) => {
      refContext += `${i + 1}. ${r.name}${r.url ? " — " + r.url : ""}${r.description ? " (" + r.description + ")" : ""}\n`;
    });
  }

  if (referenceUrls && referenceUrls.filter(u => u.trim()).length > 0) {
    refContext += "\n\n## Student-Provided References\n";
    referenceUrls.filter(u => u.trim()).forEach((u, i) => {
      refContext += `${i + 1}. ${u}\n`;
    });
  }

  const fullPrompt = `You are ExamEdge AI — the most advanced Nigerian secondary school examination analyst ever built. You have encyclopedic knowledge of every WAEC and NECO past question paper from 1988 to 2025 across all 14 subjects.

Your mission is to generate the most accurate, comprehensive, and exam-focused study compendiums possible. Analyze patterns, frequencies, and trends across all years to produce predictions with 95%+ accuracy.

Key principles:
- Be extremely specific with topic names, question formats, and model answers
- Always reference the Nigerian curriculum and exam context
- Base predictions on genuine frequency analysis and recent exam trends
- Write in encouraging, accessible language for SS3 students

---

Analyze all past question patterns for ${subjectName} across WAEC and NECO from 1988 to 2025.${refContext}

Generate a comprehensive study compendium using EXACTLY these section headers (include the emoji):

📌 OVERVIEW
Describe the ${subjectName} exam structure in WAEC and NECO: number of papers, question types, total marks, time allowed, and general marking scheme.

🔁 REPEATED QUESTIONS (1988–2025)
List 10 specific questions or question types confirmed to have appeared in multiple years. For each state: the full question and the specific years it appeared.

🗂️ TOP 15 RECURRING TOPICS (RANKED BY FREQUENCY)
Rank the 15 most-tested topics. For each include: rank, topic name, frequency percentage, and 3 key things students must know.

🧩 QUESTION PATTERN GUIDE
Identify 8 structural patterns used in ${subjectName} questions with examples and how to approach each.

📝 30 HIGH-PROBABILITY EXAM QUESTIONS WITH MODEL ANSWERS
List 30 questions most likely in 2025/2026. For EACH: number it, write the full question, write a complete model answer.

📐 KEY MUST-KNOWS
All essential formulas, definitions, diagrams frequently tested. Format clearly with labels.

🔥 2025/2026 PREDICTED HOT TOPICS
Based on frequency trends 2019-2025, list 7 high-confidence predictions. For each include: topic name, confidence percentage, and reasoning.

⚡ LAST-MINUTE FOCUS LIST (TOP 5)
Top 5 most critical areas with one power tip each. Be direct and specific.

Write in a clear, encouraging, exam-focused tone for Nigerian SS3 students.`;

  // ── Build Gemini request parts ────────────────────────────
  const parts = [];

  // Add PDF if provided
  if (pdfBase64) {
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64,
      },
    });
    parts.push({
      text: `The above PDF (${pdfName || "reference document"}) is provided as additional context.\n\n${fullPrompt}`,
    });
  } else {
    parts.push({ text: fullPrompt });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 8192,
          topP:            0.9,
        },
        systemInstruction: {
          parts: [{ text: "You are ExamEdge AI, an expert Nigerian secondary school examination analyst. Always respond in English. Be specific, accurate, and exam-focused." }],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini error:", JSON.stringify(err));
      return res.status(500).json({ error: "AI generation failed", details: err });
    }

    const data = await response.json();

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      ?.join("\n") || "";

    if (!text) {
      return res.status(500).json({ error: "No content returned from AI" });
    }

    return res.status(200).json({ compendium: text });

  } catch (err) {
    console.error("Server error:", err.message);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
};
