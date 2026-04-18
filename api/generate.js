// ============================================================
//  api/generate.js — Compendium generation with PDF + URL refs
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { subjectName, pdfBase64, pdfName, referenceUrls } = req.body;
  if (!subjectName) return res.status(400).json({ error: "subjectName is required" });

  // ── Build reference context ──────────────────────────────────
  let referenceContext = "";
  const messages = [];
  const contentParts = [];

  // Add URL content if provided
  if (referenceUrls && referenceUrls.length > 0) {
    referenceContext += `\n\nThe admin has provided these reference URLs for additional context:\n${referenceUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}\nPlease incorporate relevant information from these sources in your analysis.`;
  }

  // Build the user message — with or without PDF
  const textPrompt = `Analyze all past question patterns for ${subjectName} across WAEC and NECO from 1988 to 2025.${referenceContext}

Generate a comprehensive study compendium using EXACTLY these section headers (include the emoji):

📌 OVERVIEW
Describe the ${subjectName} exam structure in WAEC and NECO: number of papers, question types, total marks, time allowed, and general marking scheme.

🔁 REPEATED QUESTIONS (1988–2025)
List 8–10 specific questions or question types confirmed to have appeared in multiple years. For each, state the question and the years it appeared.

🗂️ TOP 15 RECURRING TOPICS (RANKED BY FREQUENCY)
Rank the 15 most-tested topics from most frequent to least. For each include: rank, topic name, approximate frequency, and 2–3 key things students must know.

🧩 QUESTION PATTERN GUIDE
Identify 6–8 structural patterns used in ${subjectName} questions. For each give: pattern name, description, and one real example question.

📝 30 HIGH-PROBABILITY EXAM QUESTIONS WITH MODEL ANSWERS
List 30 questions most likely to appear in 2025/2026. For EACH: number it, write the full question, write a complete model answer.

📐 KEY MUST-KNOWS
List all essential formulas, key definitions, diagrams, or facts frequently tested. Format clearly with labels.

🔥 2025/2026 PREDICTED HOT TOPICS
Based on recent trends (2019–2025), list 7 topics most likely to feature this year. For each explain WHY it is predicted.

⚡ LAST-MINUTE FOCUS LIST (TOP 5)
The top 5 things to study if a student has only 48 hours left. Be very direct and specific.

Write in a clear, encouraging, exam-focused tone using Nigerian curriculum context.`;

  // If PDF provided, include it as a document
  if (pdfBase64) {
    contentParts.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: pdfBase64,
      },
    });
    contentParts.push({
      type: "text",
      text: `The above PDF document (${pdfName || "reference material"}) has been provided as additional reference. Please incorporate relevant information from it into the compendium.\n\n${textPrompt}`,
    });
  } else {
    contentParts.push({ type: "text", text: textPrompt });
  }

  messages.push({ role: "user", content: contentParts });

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
        system:     `You are an expert Nigerian secondary school examination analyst with encyclopedic knowledge of all WAEC and NECO past questions from 1988 to 2025. You have analyzed every question paper, identified all patterns, recurring topics, structural formats, and trends. You help SS3 students achieve A1 grades.`,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
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
