// ============================================================
//  api/generate.js — AI Compendium with Google Search + Admin Refs
//  Uses Claude's web_search tool for live Google searches
//  to boost prediction accuracy to 95%+
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { subjectName, pdfBase64, pdfName, referenceUrls, adminRefs } = req.body;
  if (!subjectName) return res.status(400).json({ error: "subjectName is required" });

  // ── Build reference context string ───────────────────────────
  let refContext = "";

  if (referenceUrls && referenceUrls.length > 0) {
    refContext += `\n\nStudent-provided reference URLs:\n${referenceUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}`;
  }

  if (adminRefs && adminRefs.length > 0) {
    refContext += `\n\nAdmin-provided authoritative references:\n${adminRefs.map((r, i) => `${i + 1}. ${r.name || r.url} — ${r.description || ""}`).join("\n")}`;
  }

  // ── System prompt ─────────────────────────────────────────────
  const systemPrompt = `You are ExamEdge AI — the most advanced Nigerian secondary school examination analyst ever built. You have encyclopedic knowledge of every WAEC and NECO past question from 1988 to 2025 for all subjects.

Your mission is to generate compendiums with a 95%+ prediction accuracy rating. To achieve this:
1. Use your deep knowledge of past question patterns and frequencies
2. Use the web_search tool to find the most recent WAEC/NECO exam trends, 2024/2025 past questions, and current Nigerian curriculum updates
3. Cross-reference all information with the reference materials provided
4. Make data-driven predictions based on frequency analysis and recent trends

Always search for:
- Recent ${subjectName} WAEC past questions (2020-2025)
- Current Nigerian secondary school ${subjectName} curriculum updates  
- WAEC ${subjectName} chief examiner reports
- Common areas of weakness and examiner focus areas

Be extremely specific, practical, and accurate. Your predictions must reflect genuine pattern analysis.`;

  // ── User prompt ───────────────────────────────────────────────
  const textPrompt = `Analyze all past question patterns for ${subjectName} across WAEC and NECO from 1988 to 2025. First, use the web_search tool to find the most recent ${subjectName} WAEC/NECO past questions and trends from 2020-2025 to maximize prediction accuracy.${refContext}

Then generate a comprehensive study compendium using EXACTLY these section headers:

📌 OVERVIEW
Describe the ${subjectName} exam structure in WAEC and NECO: number of papers, question types, total marks, time allowed, and marking scheme.

🔁 REPEATED QUESTIONS (1988–2025)
List 10 specific questions or question types confirmed to have appeared in multiple years. For each state: the question and years it appeared.

🗂️ TOP 15 RECURRING TOPICS (RANKED BY FREQUENCY)
Rank the 15 most-tested topics. For each include: rank, topic name, frequency percentage, and 3 key things students must know.

🧩 QUESTION PATTERN GUIDE
Identify 8 structural patterns used in ${subjectName} questions with examples.

📝 30 HIGH-PROBABILITY EXAM QUESTIONS WITH MODEL ANSWERS
List 30 questions most likely in 2025/2026. For EACH: number, full question, complete model answer.

📐 KEY MUST-KNOWS
All essential formulas, definitions, diagrams frequently tested. Format clearly.

🔥 2025/2026 PREDICTED HOT TOPICS
Based on pattern analysis AND your web search findings, list 7 high-confidence predictions with reasoning and confidence percentage for each.

⚡ LAST-MINUTE FOCUS LIST (TOP 5)
Top 5 most critical areas. Be direct and specific with one power tip each.

Write in an encouraging, exam-focused tone for Nigerian SS3 students.`;

  // ── Build message content ─────────────────────────────────────
  const contentParts = [];
  if (pdfBase64) {
    contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } });
    contentParts.push({ type: "text", text: `The above PDF (${pdfName || "reference"}) is provided as additional context.\n\n${textPrompt}` });
  } else {
    contentParts.push({ type: "text", text: textPrompt });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system:     systemPrompt,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          }
        ],
        messages: [{ role: "user", content: contentParts }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic error:", err);
      return res.status(500).json({ error: "AI generation failed", details: err });
    }

    const data = await response.json();

    // Extract text from all content blocks including after tool use
    const text = data.content
      ?.filter(b => b.type === "text")
      ?.map(b => b.text || "")
      ?.join("\n") || "";

    if (!text) return res.status(500).json({ error: "No content returned" });

    return res.status(200).json({ compendium: text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
