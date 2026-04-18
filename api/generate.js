// ============================================================
//  api/generate.js — Stable compendium generation
//  Web search removed to prevent Vercel timeout issues
//  Admin refs and student refs are passed as context instead
// ============================================================

// Tell Vercel to allow up to 60 seconds for this function
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { subjectName, pdfBase64, pdfName, referenceUrls, adminRefs } = req.body;
  if (!subjectName) return res.status(400).json({ error: "subjectName is required" });

  // ── Build reference context ───────────────────────────────
  let refContext = "";

  if (adminRefs && adminRefs.length > 0) {
    refContext += `\n\n## Admin-Provided Authoritative References\nThe following resources have been provided by the ExamEdge admin for additional context. Use them to improve accuracy:\n`;
    adminRefs.forEach((r, i) => {
      refContext += `${i + 1}. ${r.name}${r.url ? ` — ${r.url}` : ""}${r.description ? ` (${r.description})` : ""}\n`;
    });
  }

  if (referenceUrls && referenceUrls.filter(u => u.trim()).length > 0) {
    refContext += `\n\n## Student-Provided References\n`;
    referenceUrls.filter(u => u.trim()).forEach((u, i) => {
      refContext += `${i + 1}. ${u}\n`;
    });
  }

  const systemPrompt = `You are ExamEdge AI — the most advanced Nigerian secondary school examination analyst ever built. You have encyclopedic knowledge of every WAEC and NECO past question paper from 1988 to 2025 across all 14 subjects.

Your mission is to generate the most accurate, comprehensive, and exam-focused study compendiums possible. You analyze patterns, frequencies, and trends across all years to produce predictions with 95%+ accuracy.

Key principles:
- Be extremely specific with topic names, question formats, and model answers
- Always reference the Nigerian curriculum and exam context
- Base predictions on genuine frequency analysis and recent exam trends
- Write in encouraging, accessible language for SS3 students
- Every prediction must have a clear reasoning behind it`;

  const userPrompt = `Analyze all past question patterns for ${subjectName} across WAEC and NECO from 1988 to 2025.${refContext}

Generate a comprehensive study compendium using EXACTLY these section headers (include the emoji):

📌 OVERVIEW
Describe the ${subjectName} exam structure in WAEC and NECO: number of papers, question types (objective/essay/practical), total marks, time allowed, and general marking scheme. Also mention any recent changes to the exam format.

🔁 REPEATED QUESTIONS (1988–2025)
List 10 specific questions or question types confirmed to have appeared in multiple years. For each state: the full question and the specific years it appeared (e.g., 2003, 2009, 2017, 2022).

🗂️ TOP 15 RECURRING TOPICS (RANKED BY FREQUENCY)
Rank the 15 most-tested topics from most frequent to least. For each include:
- Rank number and topic name
- Frequency (e.g., "Appeared in 85% of exam years")
- 3 specific key things students must know about this topic

🧩 QUESTION PATTERN GUIDE
Identify 8 structural patterns commonly used in ${subjectName} questions. For each give:
- Pattern name and description
- One real example question using that pattern
- How to approach answering it

📝 30 HIGH-PROBABILITY EXAM QUESTIONS WITH MODEL ANSWERS
List 30 questions most likely to appear in 2025/2026 WAEC and NECO. For EACH question:
1. Number it clearly (1-30)
2. Write the complete question exactly as it would appear in the exam
3. Write a thorough model answer

📐 KEY MUST-KNOWS
List all essential formulas, key definitions, diagrams, or facts that are frequently tested. Organize by subtopic with clear labels.

🔥 2025/2026 PREDICTED HOT TOPICS
Based on frequency trends from 2019-2025, identify 7 high-confidence predictions. For each include:
- Topic name
- Confidence level (e.g., 92%)
- Reasoning (e.g., "Appeared in 4 of last 5 years", "Not tested since 2021 — overdue")
- What specifically to study

⚡ LAST-MINUTE FOCUS LIST (TOP 5)
The absolute top 5 things to study if a student has only 48 hours before the exam. Be direct, specific, and practical. Include one power tip per item.

Write in a clear, encouraging, exam-focused tone accessible to Nigerian SS3 students.`;

  // ── Build message content ────────────────────────────────
  const contentParts = [];

  if (pdfBase64) {
    contentParts.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
    });
    contentParts.push({
      type: "text",
      text: `The above PDF document (${pdfName || "reference material"}) has been uploaded as additional reference. Please incorporate relevant information from it.\n\n${userPrompt}`,
    });
  } else {
    contentParts.push({ type: "text", text: userPrompt });
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
        messages:   [{ role: "user", content: contentParts }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic API error:", err);
      return res.status(500).json({ error: "AI generation failed", details: err });
    }

    const data = await response.json();
    const text = data.content?.filter(b => b.type === "text")?.map(b => b.text || "")?.join("\n") || "";

    if (!text) return res.status(500).json({ error: "No content returned from AI" });

    return res.status(200).json({ compendium: text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error: " + err.message });
  }
}
