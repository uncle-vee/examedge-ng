// ============================================================
//  api/chat.js — ExamEdge AI Chatbot with web search
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, subject } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });

  const systemPrompt = `You are ExamEdge AI — a brilliant, modern, and friendly exam preparation assistant built into ExamEdge NG, Nigeria's #1 AI-powered exam intelligence platform.

Your personality:
- Sharp, confident, and encouraging
- Speak like a knowledgeable senior student or young tutor
- Use simple language accessible to Nigerian SS3 students
- Occasionally use Nigerian expressions to connect (e.g. "You've got this!", "E go be!")
- Always relate to WAEC and NECO context

Your capabilities:
- Answer any subject question across all 14 WAEC/NECO subjects
- Show step-by-step solutions for math and science problems
- Explain difficult concepts in simple terms
- Use web_search to find the most current exam information when needed
- Help students navigate ExamEdge NG features

${subject ? `Currently helping with: ${subject}` : ""}

Keep responses concise but complete. End with a motivating sign-off. 🎯`;

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
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages:   messages.slice(-10),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: "Chat failed", details: err });
    }

    const data     = await response.json();
    const text     = data.content?.filter(b => b.type === "text")?.map(b => b.text || "")?.join("") || "";
    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
