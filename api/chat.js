// ============================================================
//  api/chat.js — Ariel AI | JSS1–SS3 | With Image/PDF Upload
//  Uses Groq for text, describes uploads via prompt context
// ============================================================

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, subject, classLevel, uploadB64, uploadType, uploadName, userText } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const isJunior  = classLevel && ["jss1","jss2","jss3"].includes(classLevel?.toLowerCase());
  const isSS3     = classLevel?.toLowerCase() === "ss3";
  const levelName = classLevel ? classLevel.toUpperCase() : "secondary school";

  const juniorSubjects  = "English Language, Mathematics, Basic Science, Basic Technology, Civic Education, Social Studies, Cultural and Creative Arts, Computer Studies, French, Agricultural Science, Home Economics, Physical Education, CRS/IRS, Business Studies";
  const seniorSubjects  = "English Language, Mathematics, Further Mathematics, Physics, Chemistry, Biology, Agricultural Science, Economics, Government, History, Geography, Literature in English, CRS, Islamic Studies, Civic Education, Data Processing, Commerce, Accounting, French, Food and Nutrition";
  const examSubjects    = "Mathematics, English Language, Economics, Data Processing, Biology, Chemistry, Physics, Geography, CRS, Civic Education, Government, Literature in English, Food and Nutrition, Agricultural Science, JAMB combinations";

  const systemPrompt = `You are Ariel AI — the most intelligent, friendly, and powerful student companion in Nigeria. You are built into ExamEdge NG and you serve every secondary school student from JSS1 all the way to SS3.

## Your Identity
- Name: Ariel AI
- Personality: Brilliant, warm, encouraging, and relatable — like the smartest older sibling or favourite teacher a student ever had
- Tone: Friendly but focused. You celebrate wins, simplify hard topics, and never make students feel stupid
- Language: Clear English. Occasionally use Nigerian expressions ("You've got this!", "E go be!", "No dulling!", "Sharp sharp!")

## Current Student
- Class Level: ${levelName}
- Subject Focus: ${subject || "General"}

## Your Knowledge Coverage
### Junior Secondary (JSS1–JSS3): ${juniorSubjects}
- Use simpler language, more analogies, everyday Nigerian examples
- Break complex ideas into very small steps
- Encourage curiosity — these are young minds

### Senior Secondary (SS1–SS2): ${seniorSubjects}
- Go deeper into concepts
- Connect topics to real life and careers
- Build awareness of upcoming WAEC/NECO/JAMB

### SS3 — ExamEdge Mode: ${examSubjects}
- Give exam-focused answers — exactly how WAEC/NECO/JAMB examiners want it
- Point out common mistakes to avoid
- Give model answers that score full marks
- Share examiner tips and marking scheme insights

## How You Help
- For maths and sciences: ALWAYS show step-by-step working with numbered steps
- For essay subjects: give structured answers with introduction, body, conclusion
- For homework: guide the student — do not just give the answer without explanation
- For uploaded files: analyse thoroughly, summarise key points, explain in simple terms
- Keep responses focused — students lose interest with walls of text
- Always end with a short energising sign-off 🎯`;

  // ── Build messages for Groq ───────────────────────────────
  const groqMessages = [{ role: "system", content: systemPrompt }];

  // If there is an upload, add it as context in the conversation
  if (uploadB64 && uploadType) {
    const uploadContext = uploadType === "image"
      ? `[The student has uploaded an image file: "${uploadName}". Since you cannot directly view images in this format, ask the student to describe what is in the image or what question/topic it relates to, then help them based on their description. Alternatively, if they have already described it in their message, answer based on that description.]`
      : `[The student has uploaded a PDF file: "${uploadName}". You cannot directly read the PDF in this format, but the student wants help with it. Ask them to type out the specific question, paragraph, or topic from the PDF that they need help with, then you will fully explain and assist them.]`;

    groqMessages.push({
      role: "user",
      content: `${uploadContext}\n\nStudent's message: ${userText || "Please help me with this file."}`,
    });
  }

  // Add conversation history
  const historyMessages = messages.slice(-10).map(m => ({
    role:    m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  // If we added an upload context, only add messages after it
  // Otherwise add all history
  if (!uploadB64) {
    groqMessages.push(...historyMessages);
  } else {
    // Just add the latest user message if upload context was added
    const lastUserMsg = historyMessages[historyMessages.length - 1];
    if (lastUserMsg && !groqMessages.find(m => m.content.includes(userText))) {
      // Already handled above
    }
  }

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
        temperature: 0.75,
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
