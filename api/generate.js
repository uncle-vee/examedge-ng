// ============================================================
//  api/generate.js — Smart generation based on class level
//  - SS3: Full WAEC/NECO compendium (37 years analysis)
//  - JSS3: JSCE/BECE compendium when in exam mode
//  - JSS1-SS2: Full textbook-style topic coverage by term
// ============================================================

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { subjectName, pdfBase64, pdfName, referenceUrls, adminRefs, examType, classLevel } = req.body;
  if (!subjectName) return res.status(400).json({ error: "subjectName is required" });

  const isExamMode  = examType === "WAEC/NECO" || examType === "JSCE/BECE";
  const isJSCE      = examType === "JSCE/BECE";
  const isSS3       = classLevel === "SS3";
  const isStudyMode = !isExamMode && classLevel && classLevel !== "SS3";

  // ── Build reference context ───────────────────────────────
  let refContext = "";
  if (adminRefs && adminRefs.length > 0) {
    refContext += "\n\n## Admin Reference Materials:\n";
    adminRefs.forEach((r, i) => { refContext += `${i + 1}. ${r.name}${r.url ? " — " + r.url : ""}${r.description ? " (" + r.description + ")" : ""}\n`; });
  }
  if (referenceUrls && referenceUrls.filter(u => u.trim()).length > 0) {
    refContext += "\n\n## Student References:\n";
    referenceUrls.filter(u => u.trim()).forEach((u, i) => { refContext += `${i + 1}. ${u}\n`; });
  }

  const systemPrompt = `You are ExamEdge AI — Nigeria's most advanced educational content generator. You create accurate, curriculum-aligned, exam-focused content for Nigerian secondary school students from JSS1 to SS3. All content follows the Nigerian Educational Research and Development Council (NERDC) curriculum.`;

  let userPrompt = "";

  // ── STUDY GUIDE MODE (JSS1 to SS2) ───────────────────────
  if (isStudyMode) {
    userPrompt = `Create a comprehensive, textbook-quality study guide for ${subjectName} for ${classLevel} students in Nigerian secondary schools.${refContext}

This study guide must cover ALL topics taught across the THREE terms of the ${classLevel} academic year, following the NERDC Nigerian curriculum.

Format the output using EXACTLY these section headers:

📌 OVERVIEW
Brief description of ${subjectName} at ${classLevel} level — what students will learn this year, why it matters, and how it connects to their lives and future studies.

📅 FIRST TERM TOPICS
List all topics covered in First Term. For each topic:
- Topic name as a clear heading
- Full detailed explanation (3-5 paragraphs)
- Real-life Nigerian examples and analogies
- Step-by-step worked examples where applicable (especially for maths and sciences)
- Key terms and definitions in bold
- Common mistakes to avoid
- Quick summary at the end

📅 SECOND TERM TOPICS
Same format as First Term — cover all Second Term topics with full explanations.

📅 THIRD TERM TOPICS
Same format as above — cover all Third Term topics with full explanations.

📝 PRACTICE QUESTIONS
20 practice questions covering all three terms — mix of objective and theory. Include answers.

⚡ KEY FACTS TO REMEMBER
The most important facts, formulas, definitions, and rules for this subject at ${classLevel} level. Formatted as a clear reference list.

Write clearly and simply — this is for a ${classLevel} student. Use encouraging language. Include Nigerian contexts, examples, and references wherever possible.`;
  }

  // ── JSCE/BECE MODE (JSS3 exam prep) ──────────────────────
  else if (isJSCE) {
    userPrompt = `Analyze all past question patterns for ${subjectName} across JSCE and BECE examinations in Nigeria from 2000 to 2025.${refContext}

Generate a comprehensive JSCE/BECE preparation compendium using EXACTLY these section headers:

📌 OVERVIEW
Describe the ${subjectName} JSCE/BECE exam structure: number of papers, question types, total marks, time allowed, and marking scheme.

🔁 REPEATED QUESTIONS (JSCE/BECE 2000–2025)
List 8 specific questions or question types that have appeared in multiple years. For each state the question and years it appeared.

🗂️ TOP 10 RECURRING TOPICS (RANKED BY FREQUENCY)
Rank the 10 most-tested topics. For each: rank, topic name, frequency, and 3 key things to know.

🧩 QUESTION PATTERN GUIDE
Identify 6 structural patterns with examples and how to answer each.

📝 25 HIGH-PROBABILITY QUESTIONS WITH MODEL ANSWERS
25 questions most likely in the upcoming JSCE/BECE. For each: full question and complete model answer.

📐 KEY MUST-KNOWS
Essential formulas, definitions, and facts frequently tested in ${subjectName} JSCE/BECE.

🔥 PREDICTED HOT TOPICS
7 most likely topics for this year's JSCE/BECE with confidence percentage and reasoning.

⚡ LAST-MINUTE FOCUS LIST (TOP 5)
Top 5 things to focus on in the last 48 hours before the exam.

Write in encouraging, clear language for JSS3 students preparing for their first major national exam.`;
  }

  // ── WAEC/NECO COMPENDIUM MODE (SS3) ──────────────────────
  else {
    userPrompt = `Analyze all past question patterns for ${subjectName} across WAEC and NECO from 1988 to 2025.${refContext}

Generate a comprehensive study compendium using EXACTLY these section headers:

📌 OVERVIEW
Describe the ${subjectName} exam structure in WAEC and NECO: number of papers, question types, total marks, time allowed, and marking scheme.

🔁 REPEATED QUESTIONS (1988–2025)
List 10 specific questions confirmed to have appeared in multiple years with the years they appeared.

🗂️ TOP 15 RECURRING TOPICS (RANKED BY FREQUENCY)
Rank the 15 most-tested topics with frequency percentage and 3 key things students must know for each.

🧩 QUESTION PATTERN GUIDE
8 structural patterns with examples and how to approach each.

📝 30 HIGH-PROBABILITY QUESTIONS WITH MODEL ANSWERS
30 questions most likely in 2025/2026. Full question and complete model answer for each.

📐 KEY MUST-KNOWS
All essential formulas, definitions, diagrams frequently tested. Format clearly.

🔥 2025/2026 PREDICTED HOT TOPICS
7 high-confidence predictions with topic name, confidence percentage, and reasoning.

⚡ LAST-MINUTE FOCUS LIST (TOP 5)
Top 5 most critical areas with one power tip each.

Write in a clear, encouraging, exam-focused tone for Nigerian SS3 students.`;
  }

  // ── Build message content ─────────────────────────────────
  const contentParts = [];
  if (pdfBase64) {
    contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } });
    contentParts.push({ type: "text", text: `The above PDF (${pdfName || "reference"}) is additional context.\n\n${userPrompt}` });
  } else {
    contentParts.push({ type: "text", text: userPrompt });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        max_tokens:  8000,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: contentParts.map(p => p.text || "").join("\n") },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Groq error:", JSON.stringify(err));
      return res.status(500).json({ error: "AI generation failed", details: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text) return res.status(500).json({ error: "No content returned" });
    return res.status(200).json({ compendium: text });

  } catch (err) {
    console.error("Server error:", err.message);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
};
