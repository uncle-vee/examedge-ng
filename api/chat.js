// ============================================================
//  api/chat.js — AI Chatbot for ExamEdge NG
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, subject } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages array is required" });

  const systemPrompt = `You are ExamBot, the friendly and highly knowledgeable AI assistant for ExamEdge NG — Nigeria's #1 exam preparation platform for WAEC and NECO.

Your role is to:
1. Answer student questions about any of the 14 subjects: Mathematics, English Language, Economics, Data Processing, Biology, Chemistry, Physics, Geography, CRS, Civic Education, Government, Literature in English, Food & Nutrition, and Agricultural Science.
2. Help students understand exam topics, solve past questions, and clarify concepts.
3. Help students navigate the ExamEdge NG app and understand its features.
4. Motivate and encourage students in their exam preparation.

${subject ? `The student is currently studying: ${subject}. Focus answers on this subject where relevant.` : ""}

Guidelines:
- Be friendly, encouraging, and use simple language accessible to Nigerian SS3 students
- For math/science questions, show step-by-step working
- Always relate answers to WAEC and NECO exam context
- Keep responses concise but complete
- If asked about the app, explain features like: generating compendiums, subject selection, admin approval, and PDF/URL references
- Sign off with motivating phrases like "You've got this! 🎯" or "One step closer to your A1! 🌟"
- You are not able to browse the internet but you have deep knowledge of Nigerian secondary school curriculum`;

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
        messages:   messages.slice(-10), // Keep last 10 messages for context
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: "Chat failed", details: err });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
