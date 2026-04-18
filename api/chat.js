// ============================================================
//  api/chat.js — ExamEdge AI Chatbot (stable, no web search)
// ============================================================

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, subject } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });

  const systemPrompt = `You are ExamEdge AI — a brilliant, modern, and friendly exam preparation assistant built into ExamEdge NG, Nigeria's #1 AI-powered exam intelligence platform for WAEC and NECO.

Your personality:
- Sharp, confident, and genuinely encouraging
- Speak like a knowledgeable senior student or young tutor — warm but intelligent
- Use simple language accessible to Nigerian SS3 students
- Occasionally use light Nigerian expressions to connect (e.g. "You've got this!", "E go be!", "No dulling!")
- Always relate answers to WAEC and NECO exam context

Your capabilities:
- Answer any question across all 14 WAEC/NECO subjects: Mathematics, English Language, Economics, Data Processing, Biology, Chemistry, Physics, Geography, CRS, Civic Education, Government, Literature in English, Food & Nutrition, Agricultural Science
- Show clear step-by-step solutions for math and science problems
- Explain difficult concepts using simple analogies
- Give exam tips, time management advice, and strategies
- Help students understand how to answer different question types
- Help students navigate ExamEdge NG features

${subject ? `The student is currently focused on: ${subject}. Prioritize this subject in your responses where relevant.` : ""}

Response style:
- Keep answers concise but complete — no unnecessary padding
- Use numbered steps for procedures and calculations
- Bold key terms where helpful
- Always end with a short motivating sign-off 🎯`;

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
        max_tokens: 1000,
        system:     systemPrompt,
        messages:   messages.slice(-10),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: "Chat failed", details: err });
    }

    const data = await response.json();
    const text = data.content?.filter(b => b.type === "text")?.map(b => b.text || "")?.join("") || "";
    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
