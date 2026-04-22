// ============================================================
//  App.jsx — ExamEdge NG | Modern UI | Fixed All Issues
//  Teal + Sea Blue + White | 3D effects | All clicks working
// ============================================================

import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, addDoc, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app      = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const ADMIN_EMAIL = "Veekthormichael@gmail.com";
const TRIAL_DAYS  = 7;
const BANK        = { name: "Chinaemeze Victor Ngeleh", bank: "Moniepoint", account: "8146746092" };
const PLANS       = {
  junior: { name: "Junior Category", desc: "JSS1 — JSS3 · Full Access", price: 20000, tier: "junior" },
  senior: { name: "Senior Category", desc: "SS1 — SS3 · Full Access + ExamEdge", price: 30000, tier: "senior" },
};

const CLASS_LEVELS = [
  { level: "JSS1", label: "JSS 1", sub: "Junior Secondary 1", tier: "junior", color: "#0ea5e9" },
  { level: "JSS2", label: "JSS 2", sub: "Junior Secondary 2", tier: "junior", color: "#0ea5e9" },
  { level: "JSS3", label: "JSS 3", sub: "JSCE · BECE Prep",   tier: "junior", color: "#0284c7" },
  { level: "SS1",  label: "SS 1",  sub: "Senior Secondary 1", tier: "senior", color: "#0d9488" },
  { level: "SS2",  label: "SS 2",  sub: "Senior Secondary 2", tier: "senior", color: "#0d9488" },
  { level: "SS3",  label: "SS 3",  sub: "WAEC · NECO · JAMB", tier: "senior", color: "#0f766e" },
];

const NEXT_CLASS = { JSS1: "JSS2", JSS2: "JSS3", JSS3: null, SS1: "SS2", SS2: "SS3", SS3: null };

const JUNIOR_SUBJECTS = [
  { id: "eng_j",    name: "English Language",        icon: "📖" },
  { id: "mth_j",    name: "Mathematics",             icon: "📐" },
  { id: "bsc",      name: "Basic Science",           icon: "🔬" },
  { id: "btech",    name: "Basic Technology",        icon: "⚙️" },
  { id: "civic_j",  name: "Civic Education",         icon: "🏛️" },
  { id: "sst",      name: "Social Studies",          icon: "🌍" },
  { id: "cca",      name: "Cultural & Creative Arts",icon: "🎨" },
  { id: "comp_j",   name: "Computer Studies",        icon: "💻" },
  { id: "agric_j",  name: "Agricultural Science",    icon: "🌾" },
  { id: "home_j",   name: "Home Economics",          icon: "🏠" },
  { id: "phe_j",    name: "Physical Education",      icon: "⚽" },
  { id: "crs_j",    name: "C.R.S / I.R.S",           icon: "✝️" },
  { id: "bus_j",    name: "Business Studies",        icon: "💼" },
  { id: "french_j", name: "French",                  icon: "🇫🇷" },
];

const SENIOR_SUBJECTS = [
  { id: "mathematics",     name: "Mathematics",           icon: "📐" },
  { id: "english",         name: "English Language",      icon: "📖" },
  { id: "economics",       name: "Economics",             icon: "📊" },
  { id: "data_processing", name: "Data Processing",       icon: "💻" },
  { id: "biology",         name: "Biology",               icon: "🧬" },
  { id: "chemistry",       name: "Chemistry",             icon: "⚗️" },
  { id: "physics",         name: "Physics",               icon: "⚛️" },
  { id: "geography",       name: "Geography",             icon: "🌍" },
  { id: "crs",             name: "C.R.S",                 icon: "✝️" },
  { id: "civic",           name: "Civic Education",       icon: "🏛️" },
  { id: "government",      name: "Government",            icon: "⚖️" },
  { id: "literature",      name: "Literature in English", icon: "🎭" },
  { id: "food",            name: "Food & Nutrition",      icon: "🥗" },
  { id: "agric",           name: "Agricultural Science",  icon: "🌾" },
  { id: "commerce",        name: "Commerce",              icon: "🏪" },
  { id: "accounting",      name: "Accounting",            icon: "📒" },
  { id: "further_maths",   name: "Further Mathematics",   icon: "➕" },
];

const LOADING_STEPS_EXAM  = ["🔍 Scanning past question archives…","📊 Detecting repeated patterns…","🧩 Identifying question formats…","📈 Ranking high-frequency topics…","🔥 Generating predictions…","📝 Assembling compendium…"];
const LOADING_STEPS_STUDY = ["📚 Loading Nigerian curriculum…","📅 Mapping First Term topics…","📅 Mapping Second Term topics…","📅 Mapping Third Term topics…","✍️ Writing detailed explanations…","✅ Finalising your study guide…"];

const SECTION_DEFS = [
  { key: "overview",   emoji: "📌", label: "Overview" },
  { key: "first",      emoji: "📅", label: "First Term Topics", studyOnly: true },
  { key: "second",     emoji: "📅", label: "Second Term Topics", studyOnly: true },
  { key: "third",      emoji: "📅", label: "Third Term Topics", studyOnly: true },
  { key: "practice",   emoji: "📝", label: "Practice Questions", studyOnly: true },
  { key: "keyfacts",   emoji: "⚡", label: "Key Facts to Remember", studyOnly: true },
  { key: "repeated",   emoji: "🔁", label: "Repeated Questions" },
  { key: "topics",     emoji: "🗂️", label: "Top Recurring Topics" },
  { key: "patterns",   emoji: "🧩", label: "Question Pattern Guide" },
  { key: "questions",  emoji: "📝", label: "High-Probability Questions With Model Answers" },
  { key: "mustknow",   emoji: "📐", label: "Key Must-Knows" },
  { key: "predicted",  emoji: "🔥", label: "Predicted Hot Topics" },
  { key: "lastminute", emoji: "⚡", label: "Last-Minute Focus List" },
];

function parseSections(text, isStudy) {
  const defs = isStudy
    ? SECTION_DEFS.filter(d => d.studyOnly || d.key === "overview")
    : SECTION_DEFS.filter(d => !d.studyOnly);

  const results = [];
  defs.forEach((def, i) => {
    const startIdx = text.indexOf(def.emoji);
    if (startIdx === -1) return;
    const rest     = defs.slice(i + 1);
    const nextDef  = rest.find(d => text.indexOf(d.emoji, startIdx + 1) !== -1);
    const endIdx   = nextDef ? text.indexOf(nextDef.emoji, startIdx + 1) : text.length;
    const content  = text.slice(startIdx, endIdx).split("\n").slice(1).join("\n").trim();
    results.push({ ...def, content });
  });
  if (results.length === 0) results.push({ key: "full", emoji: "📋", label: "Content", content: text });
  return results;
}

function getTrialDaysLeft(ts) {
  if (!ts) return TRIAL_DAYS;
  const start = ts?.toDate ? ts.toDate() : new Date(ts);
  return Math.max(0, Math.floor(TRIAL_DAYS - (Date.now() - start.getTime()) / 86400000));
}

// ── Bot SVG ───────────────────────────────────────────────────
const BotIcon = ({ size = 24, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="6" y="10" width="20" height="16" rx="4" fill={color} fillOpacity="0.95"/>
    <line x1="16" y1="10" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="4" r="2" fill={color}/>
    <circle cx="11.5" cy="17" r="2.5" fill="#0c4a6e"/>
    <circle cx="20.5" cy="17" r="2.5" fill="#0c4a6e"/>
    <circle cx="12.3" cy="16.2" r="0.8" fill={color} fillOpacity="0.5"/>
    <circle cx="21.3" cy="16.2" r="0.8" fill={color} fillOpacity="0.5"/>
    <rect x="10" y="21" width="12" height="2.5" rx="1.25" fill="#0c4a6e" fillOpacity="0.6"/>
    <rect x="3" y="14" width="3" height="6" rx="1.5" fill={color} fillOpacity="0.7"/>
    <rect x="26" y="14" width="3" height="6" rx="1.5" fill={color} fillOpacity="0.7"/>
  </svg>
);

// ── Ariel AI Chatbot ──────────────────────────────────────────
function Chatbot({ subject, classLevel, onClose }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: `Hey! I'm Ariel AI ✦ — your intelligent study companion.\n\nI help with every subject from JSS1 to SS3:\n• Homework, assignments and classwork\n• Topic explanations and problem solving\n• WAEC, NECO, JSCE/BECE, JAMB prep\n• Upload a photo or PDF for instant analysis 📸\n\nWhat do you need help with today? 🎯` }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [upFile,  setUpFile]  = useState(null);
  const [upB64,   setUpB64]   = useState("");
  const [upType,  setUpType]  = useState("");
  const [upName,  setUpName]  = useState("");
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const isImg = f.type.startsWith("image/"), isPdf = f.type === "application/pdf";
    if (!isImg && !isPdf) { alert("Please upload an image or PDF."); return; }
    if (f.size > 5 * 1024 * 1024) { alert("File must be under 5MB."); return; }
    setUpFile(f); setUpName(f.name); setUpType(isImg ? "image" : "pdf");
    const r = new FileReader(); r.onload = () => setUpB64(r.result.split(",")[1]); r.readAsDataURL(f);
  };
  const clearUp = () => { setUpFile(null); setUpB64(""); setUpType(""); setUpName(""); if (fileRef.current) fileRef.current.value = ""; };

  const send = async () => {
    if ((!input.trim() && !upFile) || loading) return;
    const content = upFile ? `${input.trim() || "Please explain this file."} [File: ${upName}]` : input.trim();
    const userMsg = { role: "user", content };
    setMessages(p => [...p, userMsg]);
    const txt = input.trim(); setInput(""); const b64 = upB64, type = upType, name = upName; clearUp();
    setLoading(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), subject: subject?.name, classLevel, uploadB64: b64, uploadType: type, uploadName: name, userText: txt || "Please explain this file." }) });
      const d = await r.json();
      setMessages(p => [...p, { role: "assistant", content: d.reply || "Sorry, please try again." }]);
    } catch { setMessages(p => [...p, { role: "assistant", content: "Connection error. Please try again." }]); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", bottom: 88, right: 24, width: 380, maxWidth: "calc(100vw - 48px)", background: "white", borderRadius: 20, boxShadow: "0 20px 60px rgba(14,165,233,0.2), 0 0 0 1px rgba(14,165,233,0.1)", zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "72vh" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0284c7,#0ea5e9)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}><BotIcon size={22} color="white" /></div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "0.92rem", display: "flex", alignItems: "center", gap: 6 }}>Ariel AI<span style={{ background: "rgba(255,255,255,0.25)", fontSize: "0.6rem", padding: "1px 7px", borderRadius: 999, fontWeight: 800 }}>AI</span></div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "inline-block" }}></span>JSS1 — SS3 · All subjects</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "#f0f9ff", minHeight: 200 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
            {m.role === "assistant" && <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BotIcon size={15} color="white" /></div>}
            <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : "white", color: m.role === "user" ? "white" : "#0c4a6e", fontSize: "0.86rem", lineHeight: 1.65, whiteSpace: "pre-wrap", boxShadow: m.role === "user" ? "0 4px 12px rgba(14,165,233,0.3)" : "0 2px 8px rgba(14,165,233,0.1)", border: m.role === "assistant" ? "1px solid rgba(14,165,233,0.15)" : "none" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><BotIcon size={15} color="white" /></div><div style={{ padding: "10px 14px", background: "white", borderRadius: "16px 16px 16px 4px", border: "1px solid rgba(14,165,233,0.15)", display: "flex", gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, background: "#0ea5e9", borderRadius: "50%", animation: `bounce 1s infinite ${i*0.15}s` }} />)}</div></div>}
        <div ref={bottomRef} />
      </div>
      {upFile && <div style={{ background: "#e0f2fe", borderTop: "1px solid #bae6fd", padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}><span>{upType === "image" ? "🖼️" : "📄"}</span><span style={{ fontSize: "0.82rem", color: "#0c4a6e", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upName}</span><button onClick={clearUp} style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>✕</button></div>}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #e0f2fe", background: "white" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask anything or upload a file…" style={{ flex: 1, border: "1.5px solid #bae6fd", borderRadius: 12, padding: "10px 14px", fontSize: "0.87rem", outline: "none", background: "#f0f9ff", fontFamily: "sans-serif", color: "#0c4a6e" }} />
          <button onClick={send} disabled={loading || (!input.trim() && !upFile)} style={{ background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 12, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading || (!input.trim() && !upFile) ? 0.5 : 1, flexShrink: 0, boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.78rem", color: "#0284c7", fontWeight: 600 }}>
          <span>📎</span>Upload photo or PDF for Ariel to analyse
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}

// ── Subscription Screen ───────────────────────────────────────
function SubscriptionScreen({ user, userRecord, onSuccess, onSignOut }) {
  const [tab,      setTab]      = useState("code");
  const [code,     setCode]     = useState("");
  const [codeErr,  setCodeErr]  = useState("");
  const [codeLoad, setCodeLoad] = useState(false);
  const [bankRef,  setBankRef]  = useState("");
  const [bankTier, setBankTier] = useState("junior");
  const [bankSaved,setBankSaved]= useState(false);
  const trialDays = getTrialDaysLeft(userRecord?.trialStarted);

  const startTrial = async () => {
    await updateDoc(doc(db, "users", user.uid), { trialStarted: serverTimestamp(), status: "approved", subscriptionTier: "trial", updatedAt: serverTimestamp() });
    onSuccess("trial");
  };

  const validateCode = async () => {
    if (!code.trim()) { setCodeErr("Please enter your access code."); return; }
    setCodeLoad(true); setCodeErr("");
    try {
      const r = await fetch("/api/codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "validate", code: code.trim(), email: user?.email }) });
      const d = await r.json();
      if (!r.ok || !d.valid) { setCodeErr(d.error || "Invalid code."); setCodeLoad(false); return; }
      await updateDoc(doc(db, "users", user.uid), { subscriptionTier: d.tier, status: "approved", accessCode: code.trim().toUpperCase(), updatedAt: serverTimestamp() });
      onSuccess(d.tier);
    } catch (e) { setCodeErr("Connection error. Please try again."); }
    setCodeLoad(false);
  };

  const saveBankTransfer = async () => {
    if (!bankRef.trim()) return;
    await updateDoc(doc(db, "users", user.uid), { paymentRef: bankRef.trim(), bankTransferTier: bankTier, updatedAt: serverTimestamp() });
    setBankSaved(true);
  };

  const BtnTab = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{ flex: 1, background: tab === id ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : "white", color: tab === id ? "white" : "#0c4a6e", border: `1.5px solid ${tab === id ? "transparent" : "#bae6fd"}`, borderRadius: 10, padding: "10px 6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", boxShadow: tab === id ? "0 4px 12px rgba(14,165,233,0.3)" : "none" }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f9ff,#e0f2fe,#f0fdfa)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0284c7)", borderRadius: "50%", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 8px 24px rgba(14,165,233,0.3)" }}>
        <img src="/logo.png" alt="" style={{ height: 54, width: 54, objectFit: "contain" }} />
      </div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.9rem", color: "#0c4a6e", marginBottom: 8, textAlign: "center" }}>Unlock Full Access</h2>
      <p style={{ color: "#0369a1", maxWidth: 440, lineHeight: 1.7, marginBottom: 24, textAlign: "center", fontSize: "0.9rem" }}>Welcome, <strong>{user?.displayName?.split(" ")[0]}</strong>! Choose how to access ExamEdge NG.</p>

      {trialDays > 0 && !userRecord?.trialUsed && (
        <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0284c7)", borderRadius: 16, padding: "20px 28px", marginBottom: 24, textAlign: "center", width: "100%", maxWidth: 480, boxShadow: "0 8px 24px rgba(14,165,233,0.25)" }}>
          <p style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>🎁 {trialDays}-Day Free Trial Available!</p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", marginBottom: 14 }}>Try ExamEdge NG free for {TRIAL_DAYS} days. No payment required.</p>
          <button onClick={startTrial} style={{ background: "white", color: "#0c4a6e", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>Start Free Trial →</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, width: "100%", maxWidth: 480 }}>
        <BtnTab id="code" label="🔑 I have a code" />
        <BtnTab id="bank" label="🏦 Bank transfer" />
      </div>

      <div style={{ background: "white", border: "1px solid #bae6fd", borderRadius: 20, padding: 24, width: "100%", maxWidth: 480, boxShadow: "0 8px 32px rgba(14,165,233,0.1)" }}>
        {tab === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontWeight: 700, color: "#0c4a6e", marginBottom: 4 }}>🔑 Enter Your Access Code</p>
            <p style={{ fontSize: "0.83rem", color: "#0369a1" }}>You received this code via email after payment or from your administrator.</p>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. JNR-A1B2C3D4 or SNR-E5F6G7H8" style={{ border: "1.5px solid #bae6fd", borderRadius: 10, padding: "12px 16px", fontSize: "0.95rem", outline: "none", fontFamily: "monospace", letterSpacing: 2, textAlign: "center", color: "#0c4a6e" }} onKeyDown={e => e.key === "Enter" && validateCode()} />
            {codeErr && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", border: "1px solid #fecaca" }}>❌ {codeErr}</div>}
            <button onClick={validateCode} disabled={codeLoad} style={{ background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 700, cursor: codeLoad ? "not-allowed" : "pointer", opacity: codeLoad ? 0.7 : 1, boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
              {codeLoad ? "⏳ Validating…" : "✅ Activate Access"}
            </button>
          </div>
        )}

        {tab === "bank" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontWeight: 700, color: "#0c4a6e", marginBottom: 4 }}>🏦 Manual Bank Transfer</p>
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "16px" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0c4a6e", marginBottom: 10 }}>Transfer to:</p>
              {[["Account Name", BANK.name],["Bank", BANK.bank],["Account Number", BANK.account],["Junior Category", "₦20,000 (JSS1–JSS3)"],["Senior Category", "₦30,000 (SS1–SS3)"]].map(([l,v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 6 }}>
                  <span style={{ color: "#0369a1" }}>{l}</span>
                  <span style={{ fontWeight: 700, color: "#0c4a6e" }}>{v}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.82rem", color: "#0369a1" }}>After payment, select your category, enter your transfer reference below, and submit. The admin will verify and send your access code to <strong>{user?.email}</strong>.</p>
            <select value={bankTier} onChange={e => setBankTier(e.target.value)} style={{ border: "1.5px solid #bae6fd", borderRadius: 8, padding: "10px 14px", fontSize: "0.88rem", outline: "none", color: "#0c4a6e" }}>
              <option value="junior">Junior Category — ₦20,000 (JSS1–JSS3)</option>
              <option value="senior">Senior Category — ₦30,000 (SS1–SS3)</option>
            </select>
            <input value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="Transfer reference / teller number" style={{ border: "1.5px solid #bae6fd", borderRadius: 8, padding: "10px 14px", fontSize: "0.88rem", outline: "none", color: "#0c4a6e", fontFamily: "sans-serif" }} />
            {!bankSaved ? (
              <button onClick={saveBankTransfer} disabled={!bankRef.trim()} style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", opacity: !bankRef.trim() ? 0.6 : 1, boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                📨 Submit Transfer Reference
              </button>
            ) : (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", color: "#166534", fontWeight: 600, fontSize: "0.88rem" }}>
                ✅ Reference submitted! Admin will verify and send your access code to <strong>{user?.email}</strong> within 24 hours.
              </div>
            )}
          </div>
        )}
      </div>
      <button onClick={onSignOut} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.82rem", marginTop: 20 }}>← Sign Out</button>
    </div>
  );
}

// ── Admin Code Generator ──────────────────────────────────────
function AdminCodeGenerator() {
  const [tier,     setTier]    = useState("junior");
  const [count,    setCount]   = useState(1);
  const [email,    setEmail]   = useState("");
  const [codes,    setCodes]   = useState([]);
  const [loading,  setLoading] = useState(false);
  const [open,     setOpen]    = useState(false);
  const [allCodes, setAll]     = useState([]);
  const [copied,   setCopied]  = useState("");

  useEffect(() => { if (open) loadAll(); }, [open]);

  const loadAll = async () => {
    const s = await getDocs(collection(db, "accessCodes"));
    setAll(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
  };

  const generate = async () => {
    setLoading(true); setCodes([]);
    try {
      const nc = [];
      for (let i = 0; i < count; i++) {
        const prefix = tier === "junior" ? "JNR" : "SNR";
        const chars  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const rand   = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        const code   = `${prefix}-${rand}`;
        await addDoc(collection(db, "accessCodes"), { code, tier, plan: "term", used: false, email: email || "", createdAt: serverTimestamp(), createdBy: "admin" });
        nc.push(code);
      }
      setCodes(nc); await loadAll();
    } catch (e) {
      console.error(e);
      alert(`Failed: ${e.message}\n\nMake sure Firestore rules are updated in Firebase Console.`);
    }
    setLoading(false);
  };

  const copyCode = (c) => { navigator.clipboard.writeText(c); setCopied(c); setTimeout(() => setCopied(""), 2000); };
  const deleteCode = async (id) => { await deleteDoc(doc(db, "accessCodes", id)); setAll(p => p.filter(c => c.id !== id)); };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", color: "#0c4a6e", marginBottom: 2 }}>🔑 Access Code Manager</h2>
          <p style={{ color: "#0369a1", fontSize: "0.82rem" }}>Generate and manage subscription codes for students.</p>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: open ? "#0c4a6e" : "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(14,165,233,0.25)" }}>
          {open ? "▲ Collapse" : "▼ Manage Codes"}
        </button>
      </div>
      {open && (
        <div style={{ background: "white", border: "1px solid #bae6fd", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(14,165,233,0.1)" }}>
          <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <p style={{ fontWeight: 700, color: "#0c4a6e", marginBottom: 14 }}>➕ Generate New Codes</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <select value={tier} onChange={e => setTier(e.target.value)} style={{ border: "1.5px solid #bae6fd", borderRadius: 8, padding: "10px 12px", fontSize: "0.88rem", outline: "none", color: "#0c4a6e" }}>
                <option value="junior">Junior (JSS1–JSS3) — ₦20,000</option>
                <option value="senior">Senior (SS1–SS3) — ₦30,000</option>
              </select>
              <select value={count} onChange={e => setCount(parseInt(e.target.value))} style={{ border: "1.5px solid #bae6fd", borderRadius: 8, padding: "10px 12px", fontSize: "0.88rem", outline: "none", color: "#0c4a6e" }}>
                {[1,2,3,5,10,20].map(n => <option key={n} value={n}>{n} code{n>1?"s":""}</option>)}
              </select>
            </div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Student email (optional)" style={{ border: "1.5px solid #bae6fd", borderRadius: 8, padding: "10px 12px", fontSize: "0.88rem", outline: "none", width: "100%", marginBottom: 10, fontFamily: "sans-serif", color: "#0c4a6e" }} />
            <button onClick={generate} disabled={loading} style={{ background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 12px rgba(14,165,233,0.25)" }}>
              {loading ? "⏳ Generating…" : `🔑 Generate ${count} Code${count>1?"s":""}`}
            </button>
            {codes.length > 0 && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px", marginTop: 14 }}>
                <p style={{ fontWeight: 700, color: "#166534", marginBottom: 10 }}>✅ Generated — Copy and send to students:</p>
                {codes.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <code style={{ background: "white", border: "1px solid #bbf7d0", borderRadius: 6, padding: "7px 14px", fontFamily: "monospace", fontSize: "1rem", letterSpacing: 2, fontWeight: 700, color: "#0c4a6e", flex: 1 }}>{c}</code>
                    <button onClick={() => copyCode(c)} style={{ background: copied === c ? "#166534" : "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {copied === c ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p style={{ fontWeight: 700, color: "#0c4a6e", marginBottom: 12 }}>📋 All Codes ({allCodes.length})</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead><tr>{["Code","Tier","Status","Email",""].map(h => <th key={h} style={{ background: "#0c4a6e", color: "white", padding: "10px 14px", textAlign: "left", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {allCodes.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No codes yet</td></tr>
                : allCodes.slice(0, 50).map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f0f9ff" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem", color: "#0c4a6e" }}>{c.code}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: c.tier==="senior"?"#f0fdf4":"#f0f9ff", color: c.tier==="senior"?"#166534":"#0369a1", borderRadius: 999, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>{c.tier}</span></td>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: c.used?"#fef2f2":"#f0fdf4", color: c.used?"#dc2626":"#166534", borderRadius: 999, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>{c.used?"Used":"Available"}</span></td>
                    <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "#64748b" }}>{c.email||"—"}</td>
                    <td style={{ padding: "10px 14px" }}>{!c.used && <button onClick={() => deleteCode(c.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>Delete</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Refs Panel ──────────────────────────────────────────
function AdminRefsPanel() {
  const [refs,setRefs]=useState([]);const [loading,setL]=useState(true);const [saving,setSav]=useState(false);const [open,setOpen]=useState(false);const [tab,setTab]=useState("url");const [name,setName]=useState("");const [url,setUrl]=useState("");const [desc,setDesc]=useState("");const [pf,setPf]=useState(null);const [pb,setPb]=useState("");const [err,setErr]=useState("");const [suc,setSuc]=useState("");
  useEffect(()=>{if(open)fetch_();},[ open]);
  const fetch_=async()=>{setL(true);try{const s=await getDocs(collection(db,"adminRefs"));setRefs(s.docs.map(d=>({id:d.id,...d.data()})));}catch{setErr("Failed to load.");}setL(false);};
  const handlePdf=e=>{const f=e.target.files[0];if(!f)return;if(f.size>4*1024*1024){setErr("PDF must be under 4MB.");return;}setPf(f);const r=new FileReader();r.onload=()=>setPb(r.result.split(",")[1]);r.readAsDataURL(f);};
  const save=async()=>{if(!name.trim()){setErr("Enter a name.");return;}if(tab==="url"&&!url.trim()){setErr("Enter a URL.");return;}if(tab==="pdf"&&!pb){setErr("Upload a PDF.");return;}setErr("");setSav(true);try{const d={name:name.trim(),description:desc.trim(),type:tab,createdAt:serverTimestamp()};if(tab==="url")d.url=url.trim();if(tab==="pdf"){d.pdfBase64=pb;d.pdfName=pf?.name||"doc.pdf";}await addDoc(collection(db,"adminRefs"),d);setSuc(`✅ "${name.trim()}" saved!`);setName("");setUrl("");setDesc("");setPf(null);setPb("");await fetch_();setTimeout(()=>setSuc(""),3000);}catch{setErr("Failed to save.");}setSav(false);};
  const del=async(id,n)=>{if(!window.confirm(`Delete "${n}"?`))return;try{await deleteDoc(doc(db,"adminRefs",id));setRefs(p=>p.filter(r=>r.id!==id));}catch{setErr("Failed.");}};
  return(
    <div style={{marginTop:32}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:14}}>
        <div><h2 style={{fontFamily:"Georgia,serif",fontSize:"1.3rem",color:"#0c4a6e",marginBottom:2}}>🌐 Global AI Reference Materials</h2><p style={{color:"#0369a1",fontSize:"0.82rem"}}>Automatically used in all compendium generations.</p></div>
        <button onClick={()=>setOpen(!open)} style={{background:open?"#0c4a6e":"linear-gradient(135deg,#0d9488,#14b8a6)",color:"white",border:"none",borderRadius:10,padding:"10px 20px",fontSize:"0.85rem",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(13,148,136,0.25)",flexShrink:0}}>
          {open?"▲ Collapse":"▼ Manage References"}{refs.length>0&&!open?` (${refs.length})`:""}</button>
      </div>
      {open&&(
        <div style={{background:"white",border:"1px solid #bae6fd",borderRadius:16,padding:24,boxShadow:"0 4px 20px rgba(14,165,233,0.1)"}}>
          <div style={{background:"#f0f9ff",borderRadius:12,padding:18,marginBottom:20}}>
            <p style={{fontWeight:700,color:"#0c4a6e",marginBottom:12}}>➕ Add New Reference</p>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["url","🔗 URL"],["pdf","📄 PDF"]].map(([t,l])=><button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?"linear-gradient(135deg,#0284c7,#0ea5e9)":"white",color:tab===t?"white":"#0c4a6e",border:`1.5px solid ${tab===t?"transparent":"#bae6fd"}`,borderRadius:8,padding:"8px",fontSize:"0.83rem",fontWeight:700,cursor:"pointer"}}>{l}</button>)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Reference name" style={{border:"1.5px solid #bae6fd",borderRadius:8,padding:"10px 14px",fontSize:"0.88rem",outline:"none",fontFamily:"sans-serif",color:"#0c4a6e"}}/>
              {tab==="url"&&<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://waec.org.ng/resources" style={{border:"1.5px solid #bae6fd",borderRadius:8,padding:"10px 14px",fontSize:"0.88rem",outline:"none",fontFamily:"sans-serif",color:"#0c4a6e"}}/>}
              {tab==="pdf"&&<label style={{display:"flex",alignItems:"center",gap:10,background:"white",border:"2px dashed #0ea5e9",borderRadius:10,padding:"12px 14px",cursor:"pointer"}}><span style={{fontSize:"1.5rem"}}>{pf?"✅":"📂"}</span><div style={{fontSize:"0.85rem",fontWeight:600,color:"#0c4a6e"}}>{pf?pf.name:"Click to upload PDF (max 4MB)"}</div><input type="file" accept=".pdf" onChange={handlePdf} style={{display:"none"}}/></label>}
              <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description (optional)" style={{border:"1.5px solid #bae6fd",borderRadius:8,padding:"10px 14px",fontSize:"0.88rem",outline:"none",fontFamily:"sans-serif",color:"#0c4a6e"}}/>
              {err&&<div style={{background:"#fef2f2",color:"#dc2626",borderRadius:8,padding:"10px",fontSize:"0.85rem",border:"1px solid #fecaca"}}>❌ {err}</div>}
              {suc&&<div style={{background:"#f0fdf4",color:"#166534",borderRadius:8,padding:"10px",fontSize:"0.85rem",border:"1px solid #bbf7d0"}}>{suc}</div>}
              <button onClick={save} disabled={saving} style={{background:saving?"#94a3b8":"linear-gradient(135deg,#0d9488,#14b8a6)",color:"white",border:"none",borderRadius:10,padding:"12px",fontSize:"0.9rem",fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:"0 4px 12px rgba(13,148,136,0.25)"}}>{saving?"⏳ Saving…":"✅ Save Reference"}</button>
            </div>
          </div>
          <p style={{fontWeight:700,color:"#0c4a6e",marginBottom:12}}>📋 Active ({loading?"…":refs.length})</p>
          {loading?<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>Loading…</div>
          :refs.length===0?<div style={{textAlign:"center",padding:20,color:"#94a3b8",background:"#f0f9ff",borderRadius:10}}>No references yet.</div>
          :refs.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderBottom:"1px solid #f0f9ff"}}>
              <div style={{width:36,height:36,background:"#f0f9ff",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>{r.type==="pdf"?"📄":"🔗"}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:"0.88rem",color:"#0c4a6e"}}>{r.name}</div>{r.url&&<div style={{fontSize:"0.75rem",color:"#0ea5e9",wordBreak:"break-all",marginTop:2}}>{r.url}</div>}{r.pdfName&&<div style={{fontSize:"0.75rem",color:"#0ea5e9",marginTop:2}}>📄 {r.pdfName}</div>}</div>
              <button onClick={()=>del(r.id,r.name)} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:8,padding:"5px 10px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,flexShrink:0}}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [user,      setUser]      = useState(null);
  const [userRec,   setUserRec]   = useState(null);
  const [authLoad,  setAuthLoad]  = useState(true);
  const [screen,    setScreen]    = useState("landing");
  const [authErr,   setAuthErr]   = useState("");
  const [selSub,    setSelSub]    = useState(null);
  const [compendium,setComp]      = useState("");
  const [loadStep,  setLoadStep]  = useState(0);
  const [history,   setHistory]   = useState([]);
  const [genErr,    setGenErr]    = useState("");
  const [payRef,    setPayRef]    = useState("");
  const [paySaved,  setPaySaved]  = useState(false);
  const [admUsers,  setAdmUsers]  = useState([]);
  const [chatOpen,  setChatOpen]  = useState(false);
  const [admRefs,   setAdmRefs]   = useState([]);
  const [classLevel,setClass]     = useState("");
  const [jscMode,   setJscMode]   = useState(false);
  const [isStudy,   setIsStudy]   = useState(false);
  const [refs,      setRefs]      = useState({ pdfBase64:"", pdfName:"", referenceUrls:[] });

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',sans-serif;background:#f0f9ff}
      ::-webkit-scrollbar{width:5px}
      ::-webkit-scrollbar-thumb{background:linear-gradient(#0284c7,#0ea5e9);border-radius:3px}
      .card-3d{transition:transform 0.2s,box-shadow 0.2s}
      .card-3d:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 16px 40px rgba(14,165,233,0.2)!important}
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const loadAdmRefs = async () => { try { const s = await getDocs(collection(db,"adminRefs")); setAdmRefs(s.docs.map(d=>({id:d.id,...d.data()}))); } catch {} };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fu => {
      if (fu) { setUser(fu); await loadUserRec(fu); await loadAdmRefs(); }
      else    { setUser(null); setUserRec(null); setScreen("landing"); }
      setAuthLoad(false);
    });
    return unsub;
  }, []);

  const loadUserRec = async fu => {
    const isAdmin = fu.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const ref = doc(db,"users",fu.uid);
    const snap = await getDoc(ref);
    let rec;
    if (!snap.exists()) {
      rec = { uid:fu.uid, name:fu.displayName||"Student", email:fu.email, photoURL:fu.photoURL||"", status:"pending", isAdmin, paymentRef:"", trialStarted:serverTimestamp(), createdAt:serverTimestamp() };
      await setDoc(ref, rec);
    } else {
      rec = snap.data();
      if (isAdmin && rec.status!=="approved") { await updateDoc(ref,{status:"approved",isAdmin:true}); rec={...rec,status:"approved",isAdmin:true}; }
    }
    setUserRec(rec);
    if (rec.classLevel) setClass(rec.classLevel);
    if (isAdmin) { setScreen("admin"); return; }
    if (rec.subscriptionTier && rec.subscriptionTier!=="trial") { setScreen(rec.classLevel?"dashboard":"selectClass"); return; }
    if (rec.subscriptionTier==="trial" && getTrialDaysLeft(rec.trialStarted)>0) { setScreen(rec.classLevel?"dashboard":"selectClass"); return; }
    setChatOpen(false); setScreen("subscribe");
  };

  useEffect(() => {
    if (screen!=="admin") return;
    const unsub = onSnapshot(collection(db,"users"), snap => { const d=snap.docs.map(x=>({id:x.id,...x.data()})); d.sort((a,b)=>a.status==="pending"?-1:1); setAdmUsers(d); });
    return unsub;
  }, [screen]);

  const signIn   = async () => { setAuthErr(""); try{await signInWithPopup(auth,provider);}catch(e){if(e.code!=="auth/popup-closed-by-user")setAuthErr("Sign-in failed. Please try again.");} };
  const signOut_ = async () => { await signOut(auth); setScreen("landing"); };
  const updStatus = async (uid,status) => { await updateDoc(doc(db,"users",uid),{status,updatedAt:serverTimestamp()}); };

  const saveClass = async level => {
    const ci = CLASS_LEVELS.find(c=>c.level===level);
    const st = userRec?.subscriptionTier;
    if (st && st!=="trial" && ci?.tier!==st) { alert(`Your subscription covers the ${st} category only.`); return; }
    setClass(level);
    if (user) await updateDoc(doc(db,"users",user.uid),{classLevel:level,updatedAt:serverTimestamp()});
    setChatOpen(false); setScreen("dashboard");
  };

  const onSubSuccess = async tier => { setUserRec(r=>({...r,subscriptionTier:tier,status:"approved"})); setChatOpen(false); setScreen(userRec?.classLevel?"dashboard":"selectClass"); };

  const generate = async (sub, studyMode=false, jsce=false) => {
    setSelSub(sub); setIsStudy(studyMode); setJscMode(jsce);
    setScreen("generating"); setGenErr(""); setLoadStep(0);
    await loadAdmRefs();
    const steps = studyMode ? LOADING_STEPS_STUDY : LOADING_STEPS_EXAM;
    for (let i=0; i<steps.length; i++) { await new Promise(r=>setTimeout(r,700)); setLoadStep(i+1); }
    try {
      const examType = jsce?"JSCE/BECE":!studyMode?"WAEC/NECO":"Study Guide";
      const r = await fetch("/api/generate",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ subjectName:sub.name, examType, classLevel, pdfBase64:refs.pdfBase64||"", pdfName:refs.pdfName||"", referenceUrls:refs.referenceUrls||[], adminRefs:admRefs.map(x=>({name:x.name,url:x.url||"",description:x.description||"",type:x.type})) }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const text = d.compendium||"";
      if (!text) throw new Error("Empty response");
      setComp(text);
      if (user) await addDoc(collection(db,"compendiums"),{uid:user.uid,subjectId:sub.id,subjectName:sub.name,content:text,createdAt:serverTimestamp()});
      setHistory(p=>p.find(h=>h.id===sub.id)?p:[{...sub,generatedAt:new Date().toLocaleDateString(),...p}]);
      setScreen("compendium");
    } catch(e) { setGenErr(`Generation failed: ${e.message}. Please try again.`); setScreen("dashboard"); }
  };

  const ci        = CLASS_LEVELS.find(c=>c.level===classLevel);
  const isJunior  = ci?.tier==="junior";
  const isSS3     = classLevel==="SS3";
  const isJSS3    = classLevel==="JSS3";
  const subjects  = isJunior?JUNIOR_SUBJECTS:SENIOR_SUBJECTS;
  const nextClass = NEXT_CLASS[classLevel];
  const isTrial   = userRec?.subscriptionTier==="trial";
  const trialLeft = getTrialDaysLeft(userRec?.trialStarted);
  const subColor  = ci?.color||"#0ea5e9";

  // ── Shared UI components ──────────────────────────────────
  const Topbar = ({ minimal=false }) => (
    <nav style={{ background: "linear-gradient(135deg,#0c4a6e,#0284c7)", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 20px rgba(14,165,233,0.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>setScreen(userRec?.isAdmin?"admin":user?"dashboard":"landing")}>
        <img src="/logo.png" alt="" style={{ height:40, width:40, objectFit:"contain", filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
        <div style={{ fontFamily:"Georgia,serif", fontSize:"1.2rem", fontWeight:900, color:"white", lineHeight:1.1 }}>
          Exam<span style={{ color:"#7dd3fc" }}>Edge</span> <span style={{ fontSize:"0.85rem", opacity:0.8 }}>NG</span>
          {userRec?.isAdmin&&<span style={{ display:"inline-block", marginLeft:8, fontSize:"0.55rem", background:"rgba(255,255,255,0.2)", padding:"1px 8px", borderRadius:999, fontFamily:"sans-serif" }}>ADMIN</span>}
        </div>
      </div>
      {!minimal && user && (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isTrial&&trialLeft>0&&<div style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"white", borderRadius:999, padding:"4px 12px", fontSize:"0.72rem", fontWeight:600 }}>{trialLeft}d trial</div>}
          <div style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:999, padding:"5px 14px", fontSize:"0.82rem", color:"white", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", overflow:"hidden", background:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.75rem", color:"#0c4a6e" }}>
              {user.photoURL?<img src={user.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:user.displayName?.[0]??"U"}
            </div>
            {user.displayName?.split(" ")[0]}
          </div>
          <button onClick={signOut_} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"white", borderRadius:8, padding:"6px 14px", fontSize:"0.8rem", cursor:"pointer" }}>Sign Out</button>
        </div>
      )}
    </nav>
  );

  // Floating Ariel AI button — only on dashboard and compendium screens
  const FloatAriel = ({ show=true }) => {
    if (!show) return null;
    return (
      <>
        <button onClick={()=>setChatOpen(c=>!c)} title="Chat with Ariel AI" style={{ position:"fixed", bottom:24, right:24, width:58, height:58, borderRadius:16, background:chatOpen?"white":"linear-gradient(135deg,#0284c7,#0ea5e9)", color:chatOpen?"#0284c7":"white", border:chatOpen?"2px solid #0ea5e9":"none", cursor:"pointer", boxShadow:"0 8px 24px rgba(14,165,233,0.4)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
          {chatOpen?<span style={{ fontSize:"1.2rem", fontWeight:700 }}>✕</span>:<BotIcon size={26} color="white"/>}
        </button>
        {chatOpen&&<Chatbot subject={selSub} classLevel={classLevel} onClose={()=>setChatOpen(false)}/>}
      </>
    );
  };

  // ── SCREENS ───────────────────────────────────────────────

  if (authLoad) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0c4a6e,#0284c7,#0ea5e9)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:"50%", width:100, height:100, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 20px rgba(255,255,255,0.05)" }}>
        <img src="/logo.png" alt="" style={{ height:70, width:70, objectFit:"contain", animation:"spin 3s linear infinite" }}/>
      </div>
      <p style={{ color:"rgba(255,255,255,0.8)", fontFamily:"sans-serif", fontSize:"0.95rem" }}>Loading ExamEdge NG…</p>
    </div>
  );

  // ── Landing ───────────────────────────────────────────────
  if (screen==="landing") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0c4a6e 0%,#0284c7 45%,#0d9488 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"48px 24px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-100, right:-100, width:400, height:400, background:"rgba(255,255,255,0.03)", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.08)" }}></div>
      <div style={{ position:"absolute", bottom:-150, left:-150, width:500, height:500, background:"rgba(255,255,255,0.03)", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.06)" }}></div>
      <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:"50%", width:110, height:110, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, boxShadow:"0 0 0 16px rgba(255,255,255,0.05), 0 16px 40px rgba(0,0,0,0.2)" }}>
        <img src="/logo.png" alt="ExamEdge NG" style={{ height:76, width:76, objectFit:"contain" }}/>
      </div>
      <div style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", color:"white", borderRadius:999, padding:"6px 20px", fontSize:"0.78rem", fontWeight:700, letterSpacing:2, marginBottom:20 }}>🇳🇬 NIGERIA'S #1 EXAM INTELLIGENCE PLATFORM</div>
      <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(2.5rem,7vw,5rem)", fontWeight:900, color:"white", lineHeight:1.05, marginBottom:8, textShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>Exam<span style={{ color:"#7dd3fc" }}>Edge</span> NG</h1>
      <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.95rem", marginBottom:12, letterSpacing:3, fontWeight:600 }}>THE AI ADVANTAGE</p>
      <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.95rem", maxWidth:500, lineHeight:1.7, marginBottom:48 }}>Powered by Ariel AI — your intelligent companion from JSS1 all the way to SS3 and beyond.</p>
      <div style={{ display:"flex", gap:32, marginBottom:52, flexWrap:"wrap", justifyContent:"center" }}>
        {[["JSS1–SS3","Full Coverage"],["JSCE+WAEC","Exam Prep"],["95%+","Prediction Rate"],["A1","Your Target"]].map(([n,l])=>(
          <div key={l} style={{ textAlign:"center", background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"16px 20px", border:"1px solid rgba(255,255,255,0.12)", backdropFilter:"blur(10px)" }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:"1.8rem", fontWeight:900, color:"#7dd3fc" }}>{n}</div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.78rem", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
      {authErr&&<div style={{ background:"rgba(220,38,38,0.9)", color:"white", borderRadius:10, padding:"12px 24px", marginBottom:20, fontSize:"0.9rem" }}>{authErr}</div>}
      <button onClick={signIn} style={{ background:"white", color:"#0c4a6e", border:"none", borderRadius:14, padding:"16px 36px", fontSize:"1rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:12, boxShadow:"0 8px 32px rgba(0,0,0,0.25)", backdropFilter:"blur(10px)" }}>
        <svg viewBox="0 0 24 24" style={{ width:22, height:22 }}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", marginTop:16 }}>7-day free trial · No card required to start</p>
      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:6 }}>Powered by Ariel Academia · Built by UncleVictor</p>
    </div>
  );

  if (screen==="subscribe") return <SubscriptionScreen user={user} userRecord={userRec} onSuccess={onSubSuccess} onSignOut={signOut_}/>;

  // ── Select Class ──────────────────────────────────────────
  if (screen==="selectClass") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f9ff,#e0f2fe,#f0fdfa)" }}>
      <Topbar minimal/>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 64px)", padding:"48px 24px", textAlign:"center" }}>
        <div style={{ background:"linear-gradient(135deg,#0c4a6e,#0284c7)", borderRadius:"50%", width:80, height:80, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, boxShadow:"0 8px 24px rgba(14,165,233,0.3)" }}>
          <img src="/logo.png" alt="" style={{ height:54, width:54, objectFit:"contain" }}/>
        </div>
        <h2 style={{ fontFamily:"Georgia,serif", fontSize:"1.9rem", color:"#0c4a6e", marginBottom:10 }}>Which class are you in?</h2>
        <p style={{ color:"#0369a1", maxWidth:440, lineHeight:1.7, marginBottom:32, fontSize:"0.9rem" }}>
          Ariel AI personalises everything to your class — subjects, content, and exam prep.
          {userRec?.subscriptionTier&&userRec.subscriptionTier!=="trial"&&<span style={{ display:"block", marginTop:8, color:"#0d9488", fontWeight:600 }}>Your {userRec.subscriptionTier} subscription covers {userRec.subscriptionTier==="junior"?"JSS1–JSS3":"SS1–SS3"}.</span>}
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, width:"100%", maxWidth:520, marginBottom:20 }}>
          {CLASS_LEVELS.map(c => {
            const locked = userRec?.subscriptionTier && userRec.subscriptionTier!=="trial" && c.tier!==userRec.subscriptionTier;
            return (
              <button key={c.level} onClick={()=>!locked&&saveClass(c.level)} disabled={locked}
                style={{ background:locked?"#e2e8f0":c.color, border:"none", borderRadius:16, padding:"22px 12px", cursor:locked?"not-allowed":"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, boxShadow:locked?"none":`0 8px 20px ${c.color}40`, opacity:locked?0.4:1, transform:"translateY(0)", transition:"transform 0.15s,box-shadow 0.15s" }}
                onMouseEnter={e=>{ if(!locked){e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 32px ${c.color}50`;}}}
                onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=locked?"none":`0 8px 20px ${c.color}40`;}}>
                <span style={{ fontFamily:"Georgia,serif", fontSize:"1.7rem", fontWeight:900, color:"white" }}>{c.label}</span>
                <span style={{ fontSize:"0.72rem", color:locked?"#94a3b8":"rgba(255,255,255,0.85)", lineHeight:1.3, textAlign:"center" }}>{locked?"Locked":c.sub}</span>
              </button>
            );
          })}
        </div>
        {classLevel&&<button onClick={()=>setScreen("dashboard")} style={{ background:"transparent", border:"1.5px solid #bae6fd", color:"#0369a1", borderRadius:10, padding:"8px 20px", fontSize:"0.85rem", cursor:"pointer" }}>← Keep {classLevel}</button>}
      </div>
    </div>
  );

  // ── Admin ─────────────────────────────────────────────────
  if (screen==="admin") {
    const counts = { pending:admUsers.filter(u=>u.status==="pending").length, approved:admUsers.filter(u=>u.status==="approved").length, rejected:admUsers.filter(u=>u.status==="rejected").length };
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f9ff,#e0f2fe)" }}>
        <Topbar/>
        <div style={{ maxWidth:1000, margin:"0 auto", padding:"40px 24px" }}>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"2rem", color:"#0c4a6e", marginBottom:6 }}>Admin Dashboard</h1>
          <p style={{ color:"#0369a1", marginBottom:28 }}>Manage students, access codes, and AI reference materials</p>
          <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            {[["Pending",counts.pending,"#92400e","#fef9c3","#fde047"],["Approved",counts.approved,"#166534","#dcfce7","#86efac"],["Rejected",counts.rejected,"#991b1b","#fee2e2","#fca5a5"],["Total",admUsers.length,"#0c4a6e","#e0f2fe","#7dd3fc"]].map(([l,c,col,bg,border])=>(
              <div key={l} style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:"16px 24px", flex:1, minWidth:110, textAlign:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:"2rem", fontFamily:"Georgia,serif", fontWeight:900, color:col }}>{c}</div>
                <div style={{ fontSize:"0.78rem", color:col, fontWeight:600 }}>{l}</div>
              </div>
            ))}
          </div>
          {counts.pending>0&&<div style={{ background:"#fef9c3", border:"1px solid #fde047", borderRadius:12, padding:"14px 20px", marginBottom:20, color:"#92400e", fontWeight:600, display:"flex", alignItems:"center", gap:10 }}>🔔 {counts.pending} student{counts.pending>1?"s":""} waiting for approval</div>}
          <div style={{ background:"white", borderRadius:16, overflowX:"auto", boxShadow:"0 4px 20px rgba(14,165,233,0.1)", border:"1px solid #bae6fd" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
              <thead><tr>{["Student","Email","Class","Subscription","Status","Actions"].map(h=><th key={h} style={{ background:"linear-gradient(135deg,#0c4a6e,#0284c7)", color:"white", padding:"14px 20px", textAlign:"left", fontSize:"0.82rem", fontWeight:600, textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {admUsers.length===0?<tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No users yet</td></tr>
                :admUsers.map(u=>(
                  <tr key={u.id} style={{ borderBottom:"1px solid #f0f9ff" }}>
                    <td style={{ padding:"12px 20px", fontWeight:600, color:"#0c4a6e" }}>{u.name}</td>
                    <td style={{ padding:"12px 20px", color:"#64748b", fontSize:"0.85rem" }}>{u.email}</td>
                    <td style={{ padding:"12px 20px" }}><span style={{ background:"#e0f2fe", color:"#0369a1", borderRadius:999, padding:"2px 10px", fontSize:"0.78rem", fontWeight:700 }}>{u.classLevel||"—"}</span></td>
                    <td style={{ padding:"12px 20px" }}><span style={{ fontSize:"0.78rem", color:"#64748b" }}>{u.subscriptionTier||"none"}</span></td>
                    <td style={{ padding:"12px 20px" }}><span style={{ borderRadius:999, padding:"4px 12px", fontSize:"0.78rem", fontWeight:600, background:u.status==="approved"?"#dcfce7":u.status==="pending"?"#fef9c3":"#fee2e2", color:u.status==="approved"?"#166534":u.status==="pending"?"#92400e":"#991b1b" }}>{u.status==="approved"?"✅":u.status==="pending"?"⏳":"❌"} {u.status}</span></td>
                    <td style={{ padding:"12px 20px" }}>
                      {u.isAdmin?<span style={{ color:"#0ea5e9", fontWeight:700 }}>👑</span>:(
                        <>
                          {u.status==="pending"&&<><button style={{ background:"linear-gradient(135deg,#0d9488,#14b8a6)",color:"white",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:4,fontWeight:600,boxShadow:"0 2px 8px rgba(13,148,136,0.3)" }} onClick={()=>updStatus(u.id,"approved")}>✅ Approve</button><button style={{ background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600 }} onClick={()=>updStatus(u.id,"rejected")}>❌ Reject</button></>}
                          {u.status==="approved"&&<button style={{ background:"#fef9c3",color:"#92400e",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600 }} onClick={()=>updStatus(u.id,"rejected")}>🚫 Revoke</button>}
                          {u.status==="rejected"&&<button style={{ background:"linear-gradient(135deg,#0284c7,#0ea5e9)",color:"white",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600 }} onClick={()=>updStatus(u.id,"approved")}>↩️ Restore</button>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminCodeGenerator/>
          <AdminRefsPanel/>
        </div>
        <FloatAriel show={true}/>
      </div>
    );
  }

  // ── Generating ────────────────────────────────────────────
  if (screen==="generating") {
    const steps = isStudy?LOADING_STEPS_STUDY:LOADING_STEPS_EXAM;
    return (
      <div style={{ position:"fixed", inset:0, background:"linear-gradient(135deg,#0c4a6e,#0284c7,#0d9488)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:999, textAlign:"center", padding:24 }}>
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:"50%", width:90, height:90, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, boxShadow:"0 0 0 16px rgba(255,255,255,0.05)" }}>
          <img src="/logo.png" alt="" style={{ height:64, width:64, objectFit:"contain", animation:"spin 3s linear infinite" }}/>
        </div>
        <h2 style={{ fontFamily:"Georgia,serif", fontSize:"1.6rem", color:"white", marginBottom:8 }}>
          {isStudy?"Building Your Study Guide":"Generating Compendium"}
        </h2>
        <p style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.9rem", maxWidth:380, marginBottom:28 }}>
          {isStudy?"Mapping full curriculum for":"Analyzing past questions for"} <strong style={{ color:"#7dd3fc" }}>{selSub?.name}</strong>
          {jscMode&&<span style={{ display:"block", color:"#5eead4", marginTop:4, fontSize:"0.82rem" }}>📋 JSCE/BECE Mode</span>}
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:380 }}>
          {steps.map((step,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:"0.85rem", color:loadStep>i?"#4ade80":loadStep===i?"#7dd3fc":"rgba(255,255,255,0.3)", fontWeight:loadStep===i?600:400, transition:"color 0.4s" }}>
              <span style={{ width:22, height:22, borderRadius:"50%", background:loadStep>i?"#4ade80":loadStep===i?"#7dd3fc":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.65rem", flexShrink:0, color:loadStep>i||loadStep===i?"#0c4a6e":"transparent", fontWeight:700 }}>
                {loadStep>i?"✓":loadStep===i?"●":""}
              </span>
              {step}
            </div>
          ))}
        </div>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.78rem", marginTop:28 }}>This may take up to 60 seconds…</p>
      </div>
    );
  }

  // ── Compendium / Study Guide output ──────────────────────
  if (screen==="compendium"&&compendium) {
    const sections = parseSections(compendium, isStudy);
    const headerColor = jscMode?"linear-gradient(135deg,#0c4a6e,#0284c7)":isStudy?`linear-gradient(135deg,${subColor},${subColor}dd)`:"linear-gradient(135deg,#0c4a6e,#0284c7,#0d9488)";
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f9ff,#e0f2fe)" }}>
        <Topbar/>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"40px 24px" }}>
          <div style={{ background:headerColor, borderRadius:20, padding:"28px 32px", color:"white", marginBottom:24, boxShadow:"0 8px 32px rgba(14,165,233,0.25)", animation:"fadeIn 0.5s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:14, width:56, height:56, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", flexShrink:0 }}>{selSub?.icon}</div>
              <div>
                <div style={{ display:"inline-block", background:"rgba(255,255,255,0.2)", borderRadius:999, padding:"4px 14px", fontSize:"0.75rem", fontWeight:700, marginBottom:8, letterSpacing:1 }}>
                  {jscMode?"📋 JSCE/BECE Compendium":isStudy?`📚 ${classLevel} Study Guide`:"📋 WAEC/NECO Compendium"}
                </div>
                <h1 style={{ fontFamily:"Georgia,serif", fontSize:"1.7rem", marginBottom:4 }}>{selSub?.name}</h1>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem" }}>{classLevel} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
            {[["← Back","transparent",()=>setScreen("dashboard")],["🔄 Regenerate","linear-gradient(135deg,#0284c7,#0ea5e9)",()=>generate(selSub,isStudy,jscMode)],["🖨️ Print","transparent",()=>window.print()]].map(([l,bg,fn])=>(
              <button key={l} onClick={fn} style={{ background:bg, border:`1.5px solid ${bg==="transparent"?"#bae6fd":"transparent"}`, color:bg==="transparent"?"#0284c7":"white", borderRadius:10, padding:"10px 20px", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", boxShadow:bg!=="transparent"?"0 4px 12px rgba(14,165,233,0.25)":"none" }}>{l}</button>
            ))}
          </div>
          {genErr&&<div style={{ background:"#fef2f2", color:"#dc2626", borderRadius:10, padding:"12px 20px", marginBottom:20, border:"1px solid #fecaca" }}>{genErr}</div>}
          {sections.map((sec,i)=>(
            <div key={i} style={{ background:"white", border:"1px solid #bae6fd", borderRadius:16, padding:"24px 28px", marginBottom:16, boxShadow:"0 4px 16px rgba(14,165,233,0.08)", animation:`fadeIn 0.4s ease ${i*0.05}s both` }}>
              <h3 style={{ fontFamily:"Georgia,serif", fontSize:"1.05rem", color:"#0c4a6e", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:34, height:34, background:"linear-gradient(135deg,#e0f2fe,#f0f9ff)", borderRadius:8, display:"inline-flex", alignItems:"center", justifyContent:"center", border:"1px solid #bae6fd" }}>{sec.emoji}</span>
                {sec.label}
              </h3>
              {sec.key==="lastminute"||sec.key==="keyfacts"?(
                <div style={{ background:"linear-gradient(135deg,#fefce8,#fef9c3)", border:"1.5px solid #fde047", borderRadius:12, padding:"18px 22px" }}>
                  <p style={{ color:"#92400e", fontSize:"0.85rem", fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>⚡ Priority Focus</p>
                  <div style={{ color:"#78350f", fontSize:"0.9rem", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{sec.content}</div>
                </div>
              ):<div style={{ color:"#0c4a6e", lineHeight:1.9, fontSize:"0.92rem", whiteSpace:"pre-wrap" }}>{sec.content||compendium}</div>}
            </div>
          ))}
        </div>
        <FloatAriel show={true}/>
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f9ff,#e0f2fe,#f0fdfa)" }}>
      <Topbar/>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 24px" }}>

        {/* Trial banner */}
        {isTrial&&trialLeft>0&&(
          <div style={{ background:"linear-gradient(135deg,#0c4a6e,#0284c7)", border:"none", borderRadius:14, padding:"14px 24px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, boxShadow:"0 4px 16px rgba(14,165,233,0.25)" }}>
            <p style={{ color:"white", fontSize:"0.88rem" }}>🎁 <strong style={{ color:"#7dd3fc" }}>{trialLeft} days</strong> remaining on your free trial</p>
            <button onClick={()=>setScreen("subscribe")} style={{ background:"white", color:"#0c4a6e", border:"none", borderRadius:8, padding:"8px 20px", fontSize:"0.82rem", fontWeight:800, cursor:"pointer" }}>Subscribe Now →</button>
          </div>
        )}

        {/* Welcome Banner */}
        <div style={{ background:"linear-gradient(135deg,#0c4a6e,#0284c7)", borderRadius:20, padding:"28px 32px", color:"white", marginBottom:24, position:"relative", overflow:"hidden", boxShadow:"0 8px 32px rgba(14,165,233,0.25)" }}>
          <div style={{ position:"absolute", right:-20, top:-20, width:160, height:160, background:"rgba(255,255,255,0.05)", borderRadius:"50%" }}></div>
          <div style={{ position:"absolute", right:40, bottom:-40, width:100, height:100, background:"rgba(255,255,255,0.04)", borderRadius:"50%" }}></div>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16, position:"relative" }}>
            <div>
              <h2 style={{ fontFamily:"Georgia,serif", fontSize:"1.7rem", marginBottom:6 }}>Welcome, {user?.displayName?.split(" ")[0]}! 👋</h2>
              <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.88rem" }}>
                {isSS3?"Generate your AI-powered WAEC & NECO exam compendium below.":isJSS3?"JSS3 dashboard — study, ask Ariel AI, and prep for JSCE/BECE.":classLevel?`Your ${classLevel} after-school study companion. Ask Ariel AI anything!`:"Select a subject to get started."}
              </p>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              {classLevel&&<div style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", color:"white", borderRadius:999, padding:"6px 16px", fontWeight:700, fontSize:"0.82rem" }}>🎓 {classLevel}</div>}
              <button onClick={()=>setScreen("selectClass")} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"white", borderRadius:999, padding:"6px 14px", fontSize:"0.75rem", fontWeight:600, cursor:"pointer" }}>🔄 Switch Class</button>
              {nextClass&&CLASS_LEVELS.find(c=>c.level===nextClass)?.tier===ci?.tier&&(
                <button onClick={()=>setScreen("selectClass")} style={{ background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"white", border:"none", borderRadius:999, padding:"6px 16px", fontSize:"0.75rem", fontWeight:800, cursor:"pointer", boxShadow:"0 4px 12px rgba(245,158,11,0.4)" }}>🚀 Get Promoted</button>
              )}
            </div>
          </div>
        </div>

        {/* JSCE Banner for JSS3 */}
        {isJSS3&&(
          <div style={{ background:"linear-gradient(135deg,#0284c7,#0ea5e9)", borderRadius:16, padding:"18px 24px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14, boxShadow:"0 4px 16px rgba(14,165,233,0.2)" }}>
            <div>
              <p style={{ color:"white", fontWeight:700, fontSize:"0.95rem", marginBottom:3 }}>📋 JSCE / BECE Exam Preparation Mode</p>
              <p style={{ color:"rgba(255,255,255,0.75)", fontSize:"0.82rem" }}>Generate AI compendiums for your Junior Secondary Certificate Exam — just like SS3 for WAEC!</p>
            </div>
            <button onClick={()=>setJscMode(m=>!m)} style={{ background:jscMode?"white":"rgba(255,255,255,0.2)", color:jscMode?"#0284c7":"white", border:jscMode?"none":"1px solid rgba(255,255,255,0.4)", borderRadius:12, padding:"11px 22px", fontSize:"0.85rem", fontWeight:700, cursor:"pointer", flexShrink:0, boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
              {jscMode?"✓ JSCE Mode ON":"Open JSCE Prep Mode →"}
            </button>
          </div>
        )}

        {genErr&&<div style={{ background:"#fef2f2", color:"#dc2626", borderRadius:10, padding:"12px 20px", marginBottom:20, border:"1px solid #fecaca", fontWeight:600 }}>{genErr}</div>}

        {/* Section label */}
        <p style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#0284c7", marginBottom:18 }}>
          📚 {jscMode&&isJSS3?"JSCE Subjects":classLevel?""+classLevel+" Subjects":"Subjects"}
        </p>

        {/* Subject Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:40 }}>
          {subjects.map(sub=>(
            <div key={sub.id} className="card-3d" style={{ background:"white", border:"1px solid #bae6fd", borderRadius:16, padding:"20px 18px", display:"flex", flexDirection:"column", gap:10, boxShadow:"0 4px 16px rgba(14,165,233,0.08)", cursor:"default" }}>
              <div style={{ fontSize:"2rem" }}>{sub.icon}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:"0.92rem", color:"#0c4a6e" }}>{sub.name}</div>
                <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{classLevel} · Nigerian Curriculum</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                {/* Study Guide / Compendium button */}
                <button style={{ background:isSS3||isJSS3?"linear-gradient(135deg,#0284c7,#0ea5e9)":"linear-gradient(135deg,#0d9488,#14b8a6)", color:"white", border:"none", borderRadius:10, padding:"9px 0", fontSize:"0.82rem", fontWeight:700, cursor:"pointer", boxShadow:isSS3||isJSS3?"0 4px 12px rgba(14,165,233,0.25)":"0 4px 12px rgba(13,148,136,0.25)" }}
                  onClick={()=>generate(sub, !isSS3&&!jscMode, jscMode)}>
                  {jscMode&&isJSS3?"📋 JSCE Compendium":isSS3?"✨ Generate Compendium":"📖 Open Study Guide"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Previously generated */}
        {history.length>0&&(
          <>
            <div style={{ height:1, background:"linear-gradient(90deg,transparent,#bae6fd,transparent)", margin:"32px 0" }}/>
            <p style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#0284c7", marginBottom:18 }}>🕓 Previously Generated</p>
            <div style={{ background:"white", border:"1px solid #bae6fd", borderRadius:16, padding:20, boxShadow:"0 4px 16px rgba(14,165,233,0.08)" }}>
              {history.map((h,i)=>(
                <div key={i} onClick={()=>generate(h,!isSS3,false)} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 12px", borderBottom:i<history.length-1?"1px solid #f0f9ff":"none", cursor:"pointer", borderRadius:8, transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:"1.5rem" }}>{h.icon}</span>
                  <div><div style={{ fontWeight:600, fontSize:"0.88rem", color:"#0c4a6e" }}>{h.name}</div><div style={{ fontSize:"0.76rem", color:"#64748b" }}>Generated {h.generatedAt}</div></div>
                  <span style={{ marginLeft:"auto", color:"#0284c7", fontSize:"0.8rem", fontWeight:600 }}>Open →</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <FloatAriel show={true}/>
    </div>
  );
}
