// ============================================================
//  api/chat.js — ExamEdge AI Chatbot via Google Gemini
// ============================================================

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, subject } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const systemText = `You are ExamEdge AI — a brilliant, modern, and friendly exam preparation assistant built into ExamEdge NG, Nigeria's #1 AI-powered exam intelligence platform for WAEC and NECO.

Your personality:
- Sharp, confident, and genuinely encouraging
- Speak like a knowledgeable senior student or young tutor
- Use simple language accessible to Nigerian SS3 students
- Occasionally use light Nigerian expressions (e.g. "You've got this!", "E go be!", "No dulling!")
- Always relate answers to WAEC and NECO exam context

Your capabilities:
- Answer any question across all 14 WAEC/NECO subjects: Mathematics, English Language, Economics, Data Processing, Biology, Chemistry, Physics, Geography, CRS, Civic Education, Government, Literature in English, Food & Nutrition, Agricultural Science
- Show clear step-by-step solutions for math and science problems
- Explain difficult concepts using simple analogies
- Give exam tips, time management advice, and strategies
- Help students navigate ExamEdge NG features

${subject ? "The student is currently focused on: " + subject + ". Prioritize this subject where relevant." : ""}

Keep answers concise but complete. Always end with a short motivating sign-off.`;

  // ── Convert messages to Gemini format ────────────────────
  // Gemini uses "user" and "model" roles (not "assistant")
  const geminiMessages = messages.slice(-10).map(m => ({
    role:  m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Gemini requires conversation to start with "user"
  // and alternate between user/model
  const filteredMessages = geminiMessages.filter((m, i) => {
    if (i === 0) return m.role === "user";
    return m.role !== geminiMessages[i - 1].role;
  });

  // If empty after filter, add a fallback
  if (filteredMessages.length === 0) {
    filteredMessages.push({ role: "user", parts: [{ text: messages[messages.length - 1]?.content || "Hello" }] });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: filteredMessages,
        generationConfig: {
          temperature:     0.8,
          maxOutputTokens: 1024,
          topP:            0.9,
        },
        systemInstruction: {
          parts: [{ text: systemText }],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini chat error:", JSON.stringify(err));
      return res.status(500).json({ error: "Chat failed", details: err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      ?.join("") || "";

    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("Chat server error:", err.message);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
};
