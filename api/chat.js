// ============================================================
//  api/chat.js — ExamEdge AI Chatbot via Groq (Free)
//  Model: llama-3.3-70b-versatile
// ============================================================

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, subject } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const systemPrompt = `You are ExamEdge AI — a brilliant, modern, and friendly exam preparation assistant built into ExamEdge NG, Nigeria's #1 AI-powered exam intelligence platform for WAEC and NECO.

Your personality:
- Sharp, confident, and genuinely encouraging
- Speak like a knowledgeable senior student or young tutor
- Use simple language accessible to Nigerian SS3 students
- Occasionally use light Nigerian expressions (e.g. "You've got this!", "E go be!", "No dulling!")
- Always relate answers to WAEC and NECO exam context

Your capabilities:
- Answer any question across all 14 WAEC/NECO subjects: Mathematics, English Language, Economics, Data Processing, Biology, Chemistry, Physics, Geography, CRS, Civic Education, Government, Literature in English, Food and Nutrition, Agricultural Science
- Show clear step-by-step solutions for math and science problems
- Explain difficult concepts using simple analogies
- Give exam tips, time management advice, and strategies
- Help students navigate ExamEdge NG features

${subject ? "The student is currently focused on: " + subject + ". Prioritize this subject where relevant." : ""}

Keep answers concise but complete. Always end with a short motivating sign-off.`;

  // Groq uses OpenAI-compatible format — straightforward conversion
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-10).map(m => ({
      role:    m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        max_tokens:  1024,
        temperature: 0.8,
        messages:    groqMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Groq chat error:", JSON.stringify(err));
      return res.status(500).json({ error: "Chat failed", details: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("Chat server error:", err.message);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
};
