// ============================================================
//  api/generate.js — Vercel Serverless Function
//  Handles Claude API calls server-side (keeps API key safe)
//  Deployed automatically by Vercel when you push to GitHub
// ============================================================

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subjectName, subjectIcon } = req.body;

  if (!subjectName) {
    return res.status(400).json({ error: "subjectName is required" });
  }

  // ── Build the Claude prompt ──────────────────────────────────
  const systemPrompt = `You are an expert Nigerian secondary school examination analyst with encyclopedic knowledge of all WAEC and NECO past questions from 1988 to 2025. You have analyzed every question paper, identified all patterns, recurring topics, structural formats, and trends. You help SS3 students achieve A1 grades by providing razor-sharp, exam-focused study guides.`;

  const userPrompt = `Analyze all past question patterns for ${subjectName} across WAEC and NECO from 1988 to 2025.

Generate a comprehensive study compendium using EXACTLY these section headers (include the emoji):

📌 OVERVIEW
Describe the ${subjectName} exam structure in WAEC and NECO: number of papers, question types (objective/essay/practical), total marks, time allowed, and general marking scheme.

🔁 REPEATED QUESTIONS (1988–2025)
List 8–10 specific questions or question types confirmed to have appeared in multiple years. For each, state: the question, and the years it appeared (e.g., 2003, 2009, 2015).

🗂️ TOP 15 RECURRING TOPICS (RANKED BY FREQUENCY)
Rank the 15 most-tested topics from most frequent to least. For each topic, include: rank number, topic name, approximate frequency (e.g., "appears in 80% of years"), and 2–3 key things students must know about it.

🧩 QUESTION PATTERN GUIDE
Identify 6–8 structural patterns used in ${subjectName} questions. For each pattern, give: the pattern name, a description, and one real example question.

📝 30 HIGH-PROBABILITY EXAM QUESTIONS WITH MODEL ANSWERS
List 30 questions most likely to appear in 2025/2026. For EACH question:
- Number it (1–30)
- Write the full question
- Write a complete model answer (concise but thorough)

📐 KEY MUST-KNOWS
List all essential formulas, key definitions, diagrams, or facts that are frequently tested in ${subjectName}. Format clearly with labels.

🔥 2025/2026 PREDICTED HOT TOPICS
Based on recent trends (2019–2025), list 7 topics most likely to feature in this year's exam. For each, explain WHY it is predicted (e.g., "not tested in 3 years and overdue", "featured in NECO 2024").

⚡ LAST-MINUTE FOCUS LIST (TOP 5)
The absolute top 5 things to study if a student has only 48 hours before the exam. Be very direct, specific, and practical. Include a one-line tip for each.

Write in a clear, encouraging, exam-focused tone. Use Nigerian curriculum context. Be as specific as possible with topic names, formulas, and answers.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":         "application/json",
        "x-api-key":            process.env.ANTHROPIC_API_KEY,
        "anthropic-version":    "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic API error:", err);
      return res.status(500).json({ error: "AI generation failed", details: err });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("\n") || "";

    return res.status(200).json({ compendium: text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
