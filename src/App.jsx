// ============================================================
//  App.jsx — ExamEdge NG | Subscription + Codes + JSCE + Full
// ============================================================

import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, onSnapshot, addDoc, getDocs,
  deleteDoc, serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);
const provider    = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const ADMIN_EMAIL     = "Veekthormichael@gmail.com";
const TRIAL_DAYS      = 7;
const PAYSTACK_PUBLIC = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || "";

// ── Subscription plans ────────────────────────────────────────
const PLANS = {
  junior: { name: "Junior Category", desc: "JSS1 — JSS3 · Full Access", price: 20000, tier: "junior", color: "#3b82f6" },
  senior: { name: "Senior Category", desc: "SS1 — SS3 · Full Access + ExamEdge", price: 30000, tier: "senior", color: "#00843D" },
};

const BANK_DETAILS = {
  name:    "UncleVictor ExamEdge",
  bank:    "Your Bank Name",
  account: "0000000000",
};

// ── Class levels ──────────────────────────────────────────────
const CLASS_LEVELS = [
  { level: "JSS1", label: "JSS 1", sub: "Junior Secondary 1", color: "#3b82f6", tier: "junior" },
  { level: "JSS2", label: "JSS 2", sub: "Junior Secondary 2", color: "#3b82f6", tier: "junior" },
  { level: "JSS3", label: "JSS 3", sub: "JSCE · BECE Prep",   color: "#0ea5e9", tier: "junior" },
  { level: "SS1",  label: "SS 1",  sub: "Senior Secondary 1", color: "#8b5cf6", tier: "senior" },
  { level: "SS2",  label: "SS 2",  sub: "Senior Secondary 2", color: "#8b5cf6", tier: "senior" },
  { level: "SS3",  label: "SS 3",  sub: "WAEC · NECO · JAMB", color: "#00843D", tier: "senior" },
];

const NEXT_CLASS = { JSS1: "JSS2", JSS2: "JSS3", JSS3: null, SS1: "SS2", SS2: "SS3", SS3: null };

// ── Subjects ──────────────────────────────────────────────────
const JUNIOR_SUBJECTS = [
  { id: "eng_j",   name: "English Language",       icon: "📖" },
  { id: "mth_j",   name: "Mathematics",            icon: "📐" },
  { id: "bsc",     name: "Basic Science",          icon: "🔬" },
  { id: "btech",   name: "Basic Technology",       icon: "⚙️" },
  { id: "civic_j", name: "Civic Education",        icon: "🏛️" },
  { id: "sst",     name: "Social Studies",         icon: "🌍" },
  { id: "cca",     name: "Cultural & Creative Arts",icon: "🎨" },
  { id: "comp_j",  name: "Computer Studies",       icon: "💻" },
  { id: "agric_j", name: "Agricultural Science",   icon: "🌾" },
  { id: "home_j",  name: "Home Economics",         icon: "🏠" },
  { id: "phe_j",   name: "Physical Education",     icon: "⚽" },
  { id: "crs_j",   name: "C.R.S / I.R.S",          icon: "✝️" },
  { id: "bus_j",   name: "Business Studies",       icon: "💼" },
  { id: "french_j",name: "French",                 icon: "🇫🇷" },
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

const JSCE_SUBJECTS = [
  { id: "eng_jsce",   name: "English Language",    icon: "📖" },
  { id: "mth_jsce",   name: "Mathematics",         icon: "📐" },
  { id: "bsc_jsce",   name: "Basic Science",       icon: "🔬" },
  { id: "btech_jsce", name: "Basic Technology",    icon: "⚙️" },
  { id: "civic_jsce", name: "Civic Education",     icon: "🏛️" },
  { id: "sst_jsce",   name: "Social Studies",      icon: "🌍" },
  { id: "cca_jsce",   name: "Cultural & Creative Arts", icon: "🎨" },
  { id: "agric_jsce", name: "Agricultural Science",icon: "🌾" },
  { id: "home_jsce",  name: "Home Economics",      icon: "🏠" },
  { id: "crs_jsce",   name: "C.R.S / I.R.S",       icon: "✝️" },
  { id: "bus_jsce",   name: "Business Studies",    icon: "💼" },
  { id: "french_jsce",name: "French",              icon: "🇫🇷" },
];

const LOADING_STEPS = [
  "🔍 Scanning past question archives…",
  "📊 Detecting repeated question patterns…",
  "🧩 Identifying structural question formats…",
  "📈 Cross-referencing reference materials…",
  "📋 Ranking high-frequency topics…",
  "🔥 Generating high-accuracy predictions…",
  "📝 Assembling your compendium…",
];

const SECTION_DEFS = [
  { key: "overview",   emoji: "📌", label: "Overview" },
  { key: "repeated",   emoji: "🔁", label: "Repeated Questions" },
  { key: "topics",     emoji: "🗂️", label: "Top 15 Recurring Topics" },
  { key: "patterns",   emoji: "🧩", label: "Question Pattern Guide" },
  { key: "questions",  emoji: "📝", label: "30 High-Probability Questions With Model Answers" },
  { key: "mustknow",   emoji: "📐", label: "Key Must-Knows" },
  { key: "predicted",  emoji: "🔥", label: "Predicted Hot Topics" },
  { key: "lastminute", emoji: "⚡", label: "Last-Minute Focus List (Top 5)" },
];

function parseSections(text) {
  const results = [];
  SECTION_DEFS.forEach((def, i) => {
    const startIdx = text.indexOf(def.emoji);
    if (startIdx === -1) return;
    const nextDef = SECTION_DEFS.slice(i + 1).find(d => text.indexOf(d.emoji, startIdx + 1) !== -1);
    const endIdx  = nextDef ? text.indexOf(nextDef.emoji, startIdx + 1) : text.length;
    const content = text.slice(startIdx, endIdx).split("\n").slice(1).join("\n").trim();
    results.push({ ...def, content });
  });
  if (results.length === 0) results.push({ key: "full", emoji: "📋", label: "Full Compendium", content: text });
  return results;
}

// ── Trial helpers ─────────────────────────────────────────────
function getTrialDaysLeft(trialStarted) {
  if (!trialStarted) return TRIAL_DAYS;
  const start   = trialStarted?.toDate ? trialStarted.toDate() : new Date(trialStarted);
  const elapsed = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(TRIAL_DAYS - elapsed));
}
function isTrialActive(trialStarted) { return getTrialDaysLeft(trialStarted) > 0; }
function isSubscribed(record) { return record?.status === "approved" && record?.subscriptionTier; }

// ── Bot Icon ──────────────────────────────────────────────────
const BotIcon = ({ size = 24, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="6" y="10" width="20" height="16" rx="4" fill={color} fillOpacity="0.95"/>
    <line x1="16" y1="10" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="4" r="2" fill={color}/>
    <circle cx="11.5" cy="17" r="2.5" fill="#003d1f"/>
    <circle cx="20.5" cy="17" r="2.5" fill="#003d1f"/>
    <circle cx="12.3" cy="16.2" r="0.8" fill={color} fillOpacity="0.5"/>
    <circle cx="21.3" cy="16.2" r="0.8" fill={color} fillOpacity="0.5"/>
    <rect x="10" y="21" width="12" height="2.5" rx="1.25" fill="#003d1f" fillOpacity="0.6"/>
    <rect x="3" y="14" width="3" height="6" rx="1.5" fill={color} fillOpacity="0.7"/>
    <rect x="26" y="14" width="3" height="6" rx="1.5" fill={color} fillOpacity="0.7"/>
  </svg>
);

// ── Ariel AI Chatbot ──────────────────────────────────────────
function Chatbot({ subject, classLevel, onClose }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Hey! I'm Ariel AI ✦ — your intelligent study companion.\n\nI can help with any subject from JSS1 to SS3:\n• Homework, assignments and classwork\n• Topic explanations and problem solving\n• WAEC, NECO, JSCE/BECE, JAMB preparation\n• Upload a photo or PDF for instant analysis 📸\n\nWhat do you need help with today? 🎯`,
  }]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadB64,  setUploadB64]  = useState("");
  const [uploadType, setUploadType] = useState("");
  const [uploadName, setUploadName] = useState("");
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf   = file.type === "application/pdf";
    if (!isImage && !isPdf) { alert("Please upload an image or PDF."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5MB."); return; }
    setUploadFile(file); setUploadName(file.name); setUploadType(isImage ? "image" : "pdf");
    const reader = new FileReader();
    reader.onload = () => setUploadB64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const clearUpload = () => { setUploadFile(null); setUploadB64(""); setUploadType(""); setUploadName(""); if (fileRef.current) fileRef.current.value = ""; };

  const send = async () => {
    if ((!input.trim() && !uploadFile) || loading) return;
    const userContent = uploadFile ? `${input.trim() || "Please explain this file."} [Uploaded: ${uploadName}]` : input.trim();
    const userMsg = { role: "user", content: userContent };
    setMessages(p => [...p, userMsg]);
    const savedText = input.trim(); setInput("");
    const b64 = uploadB64; const type = uploadType; const name = uploadName; clearUpload();
    setLoading(true);
    try {
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), subject: subject?.name, classLevel, uploadB64: b64, uploadType: type, uploadName: name, userText: savedText || "Please explain this file." }) });
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", content: data.reply || "Sorry, please try again." }]);
    } catch { setMessages(p => [...p, { role: "assistant", content: "Connection error. Please try again." }]); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", bottom: 90, right: 24, width: 390, maxWidth: "calc(100vw - 48px)", background: "white", borderRadius: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e8f5ee", maxHeight: "75vh" }}>
      <div style={{ background: "linear-gradient(135deg,#001a0d 0%,#00843D 100%)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.12)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><BotIcon size={22} color="#FFD700" /></div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "0.92rem", display: "flex", alignItems: "center", gap: 6 }}>Ariel AI <span style={{ background: "#FFD700", color: "#001a0d", fontSize: "0.58rem", padding: "1px 6px", borderRadius: 999, fontWeight: 800 }}>AI</span></div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}>JSS1 — SS3 · All subjects</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "#fafffe", minHeight: 200 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
            {m.role === "assistant" && <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#001a0d,#00843D)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BotIcon size={15} color="#FFD700" /></div>}
            <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "linear-gradient(135deg,#00843D,#005a29)" : "white", color: m.role === "user" ? "white" : "#1a1a1a", fontSize: "0.86rem", lineHeight: 1.65, whiteSpace: "pre-wrap", boxShadow: m.role === "user" ? "0 2px 10px rgba(0,132,61,0.25)" : "0 2px 6px rgba(0,0,0,0.05)", border: m.role === "assistant" ? "1px solid #e8f5ee" : "none" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#001a0d,#00843D)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><BotIcon size={15} color="#FFD700" /></div><div style={{ padding: "10px 14px", background: "white", borderRadius: "16px 16px 16px 4px", border: "1px solid #e8f5ee", display: "flex", gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, background: "#00843D", borderRadius: "50%", animation: `bounce 1s infinite ${i*0.15}s` }} />)}</div></div>}
        <div ref={bottomRef} />
      </div>
      {uploadFile && <div style={{ background: "#f0fdf4", borderTop: "1px solid #d1fae5", padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}><span>{uploadType === "image" ? "🖼️" : "📄"}</span><span style={{ fontSize: "0.82rem", color: "#005a29", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadName}</span><button onClick={clearUpload} style={{ background: "transparent", border: "none", color: "#991b1b", cursor: "pointer", fontWeight: 700 }}>✕</button></div>}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #f0fdf4", background: "white" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask anything or upload a file…" style={{ flex: 1, border: "1.5px solid #e8f5ee", borderRadius: 12, padding: "10px 14px", fontSize: "0.87rem", outline: "none", fontFamily: "sans-serif" }} />
          <button onClick={send} disabled={loading || (!input.trim() && !uploadFile)} style={{ background: "linear-gradient(135deg,#00843D,#005a29)", color: "white", border: "none", borderRadius: 12, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading || (!input.trim() && !uploadFile) ? 0.5 : 1, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.78rem", color: "#00843D", fontWeight: 600 }}>
          <span>📎</span> Upload photo or PDF for Ariel to analyse
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}

// ── Subscription / Payment Screen ─────────────────────────────
function SubscriptionScreen({ user, userRecord, onSuccess, onSignOut }) {
  const [tab,        setTab]        = useState("code"); // "code" | "paystack" | "bank"
  const [code,       setCode]       = useState("");
  const [codeError,  setCodeError]  = useState("");
  const [codeLoading,setCodeLoading]= useState(false);
  const [bankRef,    setBankRef]    = useState("");
  const [bankTier,   setBankTier]   = useState("junior");
  const [bankSaved,  setBankSaved]  = useState(false);
  const trialDays = getTrialDaysLeft(userRecord?.trialStarted);
  const trialActive = trialDays > 0 && !userRecord?.trialUsed;

  const validateCode = async () => {
    if (!code.trim()) { setCodeError("Please enter your access code."); return; }
    setCodeLoading(true); setCodeError("");
    try {
      const res  = await fetch("/api/codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "validate", code: code.trim(), email: user?.email }) });
      const data = await res.json();
      if (!res.ok || !data.valid) { setCodeError(data.error || "Invalid code."); setCodeLoading(false); return; }
      // Update user record with subscription tier
      await updateDoc(doc(db, "users", user.uid), { subscriptionTier: data.tier, status: "approved", accessCode: code.trim().toUpperCase(), updatedAt: serverTimestamp() });
      onSuccess(data.tier);
    } catch { setCodeError("Connection error. Please try again."); }
    setCodeLoading(false);
  };

  const startTrial = async () => {
    await updateDoc(doc(db, "users", user.uid), { trialStarted: serverTimestamp(), status: "approved", subscriptionTier: "trial", updatedAt: serverTimestamp() });
    onSuccess("trial");
  };

  const handlePaystack = (planTier) => {
    const plan  = PLANS[planTier];
    const handler = window.PaystackPop?.setup({
      key:       PAYSTACK_PUBLIC,
      email:     user?.email,
      amount:    plan.price * 100,
      currency:  "NGN",
      metadata:  { tier: planTier, name: user?.displayName },
      callback:  (response) => {
        // Payment successful — show user to check their email for code
        alert(`✅ Payment successful! Reference: ${response.reference}\n\nYour access code has been sent to ${user?.email}. Please check your email and enter the code on the next screen.`);
      },
      onClose: () => {},
    });
    handler?.openIframe();
  };

  const saveBankTransfer = async () => {
    if (!bankRef.trim()) return;
    await updateDoc(doc(db, "users", user.uid), { paymentRef: bankRef.trim(), bankTransferTier: bankTier, updatedAt: serverTimestamp() });
    setBankSaved(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9F7F0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <img src="/logo.png" alt="" style={{ height: 72, width: 72, objectFit: "contain", marginBottom: 20 }} />
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.9rem", color: "#001a0d", marginBottom: 8, textAlign: "center" }}>Unlock Full Access</h2>
      <p style={{ color: "#6b7280", maxWidth: 440, lineHeight: 1.7, marginBottom: 28, textAlign: "center" }}>
        Welcome, <strong>{user?.displayName?.split(" ")[0]}</strong>! Choose how you want to access ExamEdge NG.
      </p>

      {/* Trial offer */}
      {trialActive && (
        <div style={{ background: "linear-gradient(135deg,#001a0d,#003d1f)", border: "none", borderRadius: 16, padding: "20px 28px", marginBottom: 24, textAlign: "center", width: "100%", maxWidth: 480 }}>
          <p style={{ color: "#FFD700", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>🎁 {trialDays}-Day Free Trial Available!</p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginBottom: 14 }}>Try ExamEdge NG free for {TRIAL_DAYS} days. No payment required.</p>
          <button onClick={startTrial} style={{ background: "#FFD700", color: "#001a0d", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer" }}>
            Start Free Trial →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, width: "100%", maxWidth: 480 }}>
        {[["code","🔑 I have a code"],["paystack","💳 Pay online"],["bank","🏦 Bank transfer"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? "#001a0d" : "white", color: tab === t ? "white" : "#001a0d", border: `1.5px solid ${tab === t ? "#001a0d" : "#d1fae5"}`, borderRadius: 10, padding: "10px 8px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      <div style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, boxShadow: "0 4px 20px rgba(0,132,61,0.08)" }}>

        {/* Tab: Access Code */}
        {tab === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontWeight: 700, color: "#001a0d", marginBottom: 4 }}>🔑 Enter Your Access Code</p>
            <p style={{ fontSize: "0.83rem", color: "#6b7280" }}>You received this code via email after payment, or from your administrator.</p>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. JNR-A1B2C3D4 or SNR-E5F6G7H8" style={{ border: "1.5px solid #d1fae5", borderRadius: 10, padding: "12px 16px", fontSize: "0.95rem", outline: "none", fontFamily: "monospace", letterSpacing: 2, textAlign: "center" }} />
            {codeError && <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem" }}>❌ {codeError}</div>}
            <button onClick={validateCode} disabled={codeLoading} style={{ background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "13px", fontSize: "0.95rem", fontWeight: 700, cursor: codeLoading ? "not-allowed" : "pointer", opacity: codeLoading ? 0.6 : 1 }}>
              {codeLoading ? "Validating…" : "✅ Activate Access"}
            </button>
          </div>
        )}

        {/* Tab: Paystack */}
        {tab === "paystack" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontWeight: 700, color: "#001a0d", marginBottom: 4 }}>💳 Pay Online with Paystack</p>
            <p style={{ fontSize: "0.83rem", color: "#6b7280", marginBottom: 8 }}>After payment, your access code will be sent to <strong>{user?.email}</strong> automatically.</p>
            {Object.values(PLANS).map(plan => (
              <div key={plan.tier} style={{ border: `2px solid ${plan.color}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, color: plan.color, fontSize: "0.95rem", marginBottom: 2 }}>{plan.name}</p>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>{plan.desc}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", fontWeight: 900, color: plan.color }}>₦{plan.price.toLocaleString()}</p>
                  <button onClick={() => handlePaystack(plan.tier)} style={{ background: plan.color, color: "white", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", marginTop: 6 }}>Pay Now</button>
                </div>
              </div>
            ))}
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", fontSize: "0.78rem", color: "#005a29" }}>
              🔒 Secured by Paystack · Card, Bank Transfer, USSD supported
            </div>
          </div>
        )}

        {/* Tab: Bank Transfer */}
        {tab === "bank" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontWeight: 700, color: "#001a0d", marginBottom: 4 }}>🏦 Manual Bank Transfer</p>
            <div style={{ background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 12, padding: "16px" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#001a0d", marginBottom: 10 }}>Transfer to:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[["Account Name", BANK_DETAILS.name],["Bank", BANK_DETAILS.bank],["Account Number", BANK_DETAILS.account],["Junior Category", "₦20,000"],["Senior Category", "₦30,000"]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "#6b7280" }}>{l}</span>
                    <span style={{ fontWeight: 700, color: "#001a0d" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#6b7280" }}>After payment, enter your transfer reference and the category you paid for. The admin will verify and send your access code.</p>
            <select value={bankTier} onChange={e => setBankTier(e.target.value)} style={{ border: "1.5px solid #d1fae5", borderRadius: 8, padding: "10px 14px", fontSize: "0.88rem", outline: "none", fontFamily: "sans-serif" }}>
              <option value="junior">Junior Category — ₦20,000 (JSS1–JSS3)</option>
              <option value="senior">Senior Category — ₦30,000 (SS1–SS3)</option>
            </select>
            <input value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="Transfer reference / teller number" style={{ border: "1.5px solid #d1fae5", borderRadius: 8, padding: "10px 14px", fontSize: "0.88rem", outline: "none", fontFamily: "sans-serif" }} />
            {!bankSaved ? (
              <button onClick={saveBankTransfer} disabled={!bankRef.trim()} style={{ background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", opacity: !bankRef.trim() ? 0.6 : 1 }}>
                📨 Submit Transfer Reference
              </button>
            ) : (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", color: "#166534", fontWeight: 600, fontSize: "0.88rem" }}>
                ✅ Reference submitted! The admin will verify your payment and send your access code to <strong>{user?.email}</strong> within 24 hours.
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={onSignOut} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.82rem", marginTop: 20 }}>← Sign Out</button>
    </div>
  );
}

// ── Admin Code Generator ──────────────────────────────────────
function AdminCodeGenerator() {
  const [tier,    setTier]    = useState("junior");
  const [count,   setCount]   = useState(1);
  const [email,   setEmail]   = useState("");
  const [codes,   setCodes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [allCodes,setAllCodes]= useState([]);

  useEffect(() => { if (open) loadCodes(); }, [open]);

  const loadCodes = async () => {
    const snap = await getDocs(collection(db, "accessCodes"));
    setAllCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  };

  const generateCodes = async () => {
    setLoading(true); setCodes([]);
    try {
      const newCodes = [];
      for (let i = 0; i < count; i++) {
        const prefix = tier === "junior" ? "JNR" : "SNR";
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        const code   = `${prefix}-${random}`;
        await addDoc(collection(db, "accessCodes"), { code, tier, plan: "term", used: false, email, createdAt: serverTimestamp(), createdBy: "admin" });
        newCodes.push(code);
      }
      setCodes(newCodes);
      await loadCodes();
    } catch (e) { alert("Failed to generate codes."); }
    setLoading(false);
  };

  const deleteCode = async (id) => {
    await deleteDoc(doc(db, "accessCodes", id));
    setAllCodes(p => p.filter(c => c.id !== id));
  };

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "#001a0d", marginBottom: 4 }}>🔑 Access Code Manager</h2>
          <p style={{ color: "#6b7280", fontSize: "0.83rem" }}>Generate and manage subscription access codes for students.</p>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: open ? "#001a0d" : "#00843D", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
          {open ? "▲ Collapse" : "▼ Manage Codes"}
        </button>
      </div>

      {open && (
        <div style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,132,61,0.08)" }}>

          {/* Generate */}
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 18, marginBottom: 24 }}>
            <p style={{ fontWeight: 700, color: "#001a0d", marginBottom: 14 }}>➕ Generate New Codes</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <select value={tier} onChange={e => setTier(e.target.value)} style={{ border: "1.5px solid #d1fae5", borderRadius: 8, padding: "10px 12px", fontSize: "0.88rem", outline: "none" }}>
                <option value="junior">Junior (JSS1–JSS3) — ₦20,000</option>
                <option value="senior">Senior (SS1–SS3) — ₦30,000</option>
              </select>
              <select value={count} onChange={e => setCount(parseInt(e.target.value))} style={{ border: "1.5px solid #d1fae5", borderRadius: 8, padding: "10px 12px", fontSize: "0.88rem", outline: "none" }}>
                {[1,2,3,5,10,20].map(n => <option key={n} value={n}>{n} code{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Student email (optional — for bank transfer students)" style={{ border: "1.5px solid #d1fae5", borderRadius: 8, padding: "10px 12px", fontSize: "0.88rem", outline: "none", width: "100%", marginBottom: 10, fontFamily: "sans-serif" }} />
            <button onClick={generateCodes} disabled={loading} style={{ background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Generating…" : `🔑 Generate ${count} Code${count > 1 ? "s" : ""}`}
            </button>

            {codes.length > 0 && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "14px 16px", marginTop: 14 }}>
                <p style={{ fontWeight: 700, color: "#166534", marginBottom: 8 }}>✅ Generated Codes — Copy and send to students:</p>
                {codes.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <code style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 6, padding: "6px 12px", fontFamily: "monospace", fontSize: "1rem", letterSpacing: 2, fontWeight: 700, color: "#001a0d" }}>{c}</code>
                    <button onClick={() => navigator.clipboard.writeText(c)} style={{ background: "#00843D", color: "white", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: "0.78rem", cursor: "pointer" }}>Copy</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All codes table */}
          <p style={{ fontWeight: 700, color: "#001a0d", marginBottom: 12 }}>📋 All Codes ({allCodes.length})</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead><tr>{["Code","Tier","Status","Email","Date",""].map(h => <th key={h} style={{ background: "#001a0d", color: "#FFD700", padding: "10px 14px", textAlign: "left", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {allCodes.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>No codes yet</td></tr>
                : allCodes.slice(0, 50).map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f0fdf4" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, fontSize: "0.88rem" }}>{c.code}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: c.tier === "senior" ? "#dcfce7" : "#dbeafe", color: c.tier === "senior" ? "#166534" : "#1e40af", borderRadius: 999, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>{c.tier}</span></td>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: c.used ? "#fee2e2" : "#dcfce7", color: c.used ? "#991b1b" : "#166534", borderRadius: 999, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>{c.used ? "Used" : "Available"}</span></td>
                    <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "#6b7280" }}>{c.email || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: "#6b7280" }}>{c.createdAt?.toDate?.()?.toLocaleDateString("en-GB") ?? "—"}</td>
                    <td style={{ padding: "10px 14px" }}>{!c.used && <button onClick={() => deleteCode(c.id)} style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer" }}>Delete</button>}</td>
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

// ── Admin References Panel ────────────────────────────────────
function AdminRefsPanel() {
  const [refs, setRefs]   = useState([]);
  const [loading, setL]   = useState(true);
  const [saving, setSav]  = useState(false);
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState("url");
  const [newName, setNN]  = useState("");
  const [newUrl, setNU]   = useState("");
  const [newDesc, setND]  = useState("");
  const [pdfFile, setPF]  = useState(null);
  const [pdfB64, setPB]   = useState("");
  const [error, setErr]   = useState("");
  const [success, setSuc] = useState("");

  useEffect(() => { if (open) fetchRefs(); }, [open]);
  const fetchRefs = async () => { setL(true); try { const snap = await getDocs(collection(db, "adminRefs")); setRefs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch { setErr("Failed to load."); } setL(false); };
  const handlePdf = (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 4*1024*1024) { setErr("PDF must be under 4MB."); return; } setPF(f); const r = new FileReader(); r.onload = () => setPB(r.result.split(",")[1]); r.readAsDataURL(f); };
  const saveRef = async () => {
    if (!newName.trim()) { setErr("Please enter a name."); return; }
    if (tab === "url" && !newUrl.trim()) { setErr("Please enter a URL."); return; }
    if (tab === "pdf" && !pdfB64) { setErr("Please upload a PDF."); return; }
    setErr(""); setSav(true);
    try {
      const data = { name: newName.trim(), description: newDesc.trim(), type: tab, createdAt: serverTimestamp() };
      if (tab === "url") data.url = newUrl.trim();
      if (tab === "pdf") { data.pdfBase64 = pdfB64; data.pdfName = pdfFile?.name || "doc.pdf"; }
      await addDoc(collection(db, "adminRefs"), data);
      setSuc(`✅ "${newName.trim()}" saved!`); setNN(""); setNU(""); setND(""); setPF(null); setPB("");
      await fetchRefs(); setTimeout(() => setSuc(""), 3000);
    } catch { setErr("Failed to save."); }
    setSav(false);
  };
  const deleteRef = async (id, name) => { if (!window.confirm(`Delete "${name}"?`)) return; try { await deleteDoc(doc(db, "adminRefs", id)); setRefs(p => p.filter(r => r.id !== id)); } catch { setErr("Failed."); } };

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "#001a0d", marginBottom: 4 }}>🌐 Global AI Reference Materials</h2>
          <p style={{ color: "#6b7280", fontSize: "0.83rem" }}>Automatically used in all compendium generations to boost accuracy.</p>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: open ? "#001a0d" : "#00843D", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          {open ? "▲ Collapse" : "▼ Manage References"} {refs.length > 0 && !open ? `(${refs.length})` : ""}
        </button>
      </div>
      {open && (
        <div style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,132,61,0.08)" }}>
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <p style={{ fontWeight: 700, color: "#001a0d", marginBottom: 12 }}>➕ Add New Reference</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[["url","🔗 URL"],["pdf","📄 PDF"]].map(([t,l]) => <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab===t?"#001a0d":"white", color: tab===t?"white":"#001a0d", border:`1.5px solid ${tab===t?"#001a0d":"#d1fae5"}`, borderRadius:8, padding:"8px", fontSize:"0.83rem", fontWeight:700, cursor:"pointer" }}>{l}</button>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={newName} onChange={e => setNN(e.target.value)} placeholder="Reference name" style={{ border:"1.5px solid #d1fae5", borderRadius:8, padding:"10px 14px", fontSize:"0.88rem", outline:"none", fontFamily:"sans-serif" }} />
              {tab==="url" && <input value={newUrl} onChange={e => setNU(e.target.value)} placeholder="https://waec.org.ng/resources" style={{ border:"1.5px solid #d1fae5", borderRadius:8, padding:"10px 14px", fontSize:"0.88rem", outline:"none", fontFamily:"sans-serif" }} />}
              {tab==="pdf" && <label style={{ display:"flex", alignItems:"center", gap:10, background:"white", border:"2px dashed #00843D", borderRadius:10, padding:"12px 14px", cursor:"pointer" }}><span style={{ fontSize:"1.5rem" }}>{pdfFile?"✅":"📂"}</span><div style={{ fontSize:"0.85rem", fontWeight:600, color:"#001a0d" }}>{pdfFile?pdfFile.name:"Click to upload PDF (max 4MB)"}</div><input type="file" accept=".pdf" onChange={handlePdf} style={{ display:"none" }} /></label>}
              <input value={newDesc} onChange={e => setND(e.target.value)} placeholder="Brief description (optional)" style={{ border:"1.5px solid #d1fae5", borderRadius:8, padding:"10px 14px", fontSize:"0.88rem", outline:"none", fontFamily:"sans-serif" }} />
              {error   && <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"10px 14px", fontSize:"0.85rem" }}>❌ {error}</div>}
              {success && <div style={{ background:"#dcfce7", color:"#166534", borderRadius:8, padding:"10px 14px", fontSize:"0.85rem" }}>{success}</div>}
              <button onClick={saveRef} disabled={saving} style={{ background:saving?"#6b7280":"#00843D", color:"white", border:"none", borderRadius:10, padding:"12px", fontSize:"0.9rem", fontWeight:700, cursor:saving?"not-allowed":"pointer" }}>{saving?"⏳ Saving…":"✅ Save Reference"}</button>
            </div>
          </div>
          <p style={{ fontWeight:700, color:"#001a0d", marginBottom:12, fontSize:"0.92rem" }}>📋 Active ({loading?"…":refs.length})</p>
          {loading ? <div style={{ textAlign:"center", padding:20, color:"#6b7280" }}>Loading…</div>
          : refs.length===0 ? <div style={{ textAlign:"center", padding:20, color:"#6b7280", background:"#f9f9f9", borderRadius:10 }}>No references yet.</div>
          : refs.map(r => (
            <div key={r.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:"1px solid #f0fdf4" }}>
              <div style={{ width:36, height:36, background:"#e6f4ec", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>{r.type==="pdf"?"📄":"🔗"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:"0.88rem" }}>{r.name}</div>
                {r.url && <div style={{ fontSize:"0.75rem", color:"#00843D", wordBreak:"break-all" }}>{r.url}</div>}
                {r.pdfName && <div style={{ fontSize:"0.75rem", color:"#00843D" }}>📄 {r.pdfName}</div>}
              </div>
              <button onClick={() => deleteRef(r.id, r.name)} style={{ background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:8, padding:"5px 10px", fontSize:"0.78rem", cursor:"pointer", fontWeight:600 }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reference Manager (Student) ───────────────────────────────
function ReferenceManager({ onRefsChange }) {
  const [urls, setUrls]         = useState([""]);
  const [pdfFile, setPdfFile]   = useState(null);
  const [pdfBase64, setPdfB64]  = useState("");
  const [open, setOpen]         = useState(false);
  const refCount = (pdfFile ? 1 : 0) + urls.filter(u => u.trim()).length;

  const handlePdf = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setPdfFile(f); const r = new FileReader(); r.onload = () => { const b = r.result.split(",")[1]; setPdfB64(b); onRefsChange({ pdfBase64: b, pdfName: f.name, referenceUrls: urls.filter(u => u.trim()) }); }; r.readAsDataURL(f);
  };
  const applyRefs = () => { onRefsChange({ pdfBase64, pdfName: pdfFile?.name || "", referenceUrls: urls.filter(u => u.trim()) }); setOpen(false); };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: refCount > 0 ? "#FFD700" : "#003d1f", color: refCount > 0 ? "#003d1f" : "white", border: "none", borderRadius: 999, padding: "10px 18px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(0,61,31,0.3)", whiteSpace: "nowrap" }}>
        📎 My References {refCount > 0 ? `(${refCount})` : ""}
      </button>
      {open && (
        <div style={{ position: "fixed", bottom: 170, right: 24, background: "white", border: "1px solid #d1fae5", borderRadius: 20, padding: 20, boxShadow: "0 16px 48px rgba(0,132,61,0.2)", zIndex: 600, width: 400, maxWidth: "calc(100vw - 48px)", maxHeight: "65vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><h4 style={{ color: "#001a0d", fontSize: "0.95rem", fontWeight: 700 }}>📚 Add Reference Materials</h4><button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280" }}>✕</button></div>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#001a0d", marginBottom: 8 }}>📄 Upload a PDF</p>
          <label style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "2px dashed #00843D", borderRadius: 12, padding: "12px 14px", cursor: "pointer", marginBottom: 14 }}>
            <span style={{ fontSize: "1.6rem" }}>{pdfFile ? "✅" : "📂"}</span>
            <div><div style={{ fontSize: "0.87rem", fontWeight: 600, color: "#001a0d" }}>{pdfFile ? pdfFile.name : "Click to upload PDF"}</div></div>
            <input type="file" accept=".pdf" onChange={handlePdf} style={{ display: "none" }} />
          </label>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#001a0d", marginBottom: 8 }}>🔗 Website URLs</p>
          {urls.map((url, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={url} onChange={e => setUrls(p => p.map((u, idx) => idx === i ? e.target.value : u))} placeholder="https://example.com" style={{ flex: 1, border: "1.5px solid #d1fae5", borderRadius: 8, padding: "8px 12px", fontSize: "0.83rem", outline: "none", fontFamily: "sans-serif" }} />
              {urls.length > 1 && <button onClick={() => setUrls(p => p.filter((_, idx) => idx !== i))} style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer" }}>✕</button>}
            </div>
          ))}
          <button onClick={() => setUrls(p => [...p, ""])} style={{ background: "transparent", border: "1px dashed #00843D", color: "#00843D", borderRadius: 8, padding: "7px 14px", fontSize: "0.8rem", cursor: "pointer", width: "100%", marginBottom: 14 }}>+ Add URL</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={applyRefs} style={{ flex: 1, background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>✅ Apply</button>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "1.5px solid #e5e7eb", color: "#6b7280", borderRadius: 10, padding: "11px 14px", fontSize: "0.88rem", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [user,            setUser]            = useState(null);
  const [userRecord,      setUserRecord]      = useState(null);
  const [authLoading,     setAuthLoading]     = useState(true);
  const [screen,          setScreen]          = useState("landing");
  const [authError,       setAuthError]       = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [compendium,      setCompendium]      = useState("");
  const [loadingStep,     setLoadingStep]     = useState(0);
  const [history,         setHistory]         = useState([]);
  const [genError,        setGenError]        = useState("");
  const [paymentRef,      setPaymentRef]      = useState("");
  const [paymentSaved,    setPaymentSaved]    = useState(false);
  const [adminUsers,      setAdminUsers]      = useState([]);
  const [chatOpen,        setChatOpen]        = useState(false);
  const [refs,            setRefs]            = useState({ pdfBase64: "", pdfName: "", referenceUrls: [] });
  const [adminRefs,       setAdminRefs]       = useState([]);
  const [classLevel,      setClassLevel]      = useState("");
  const [jscMode,         setJscMode]         = useState(false);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@keyframes spin{to{transform:rotate(360deg)}} @keyframes bounce{0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)}} *{box-sizing:border-box;margin:0;padding:0} body{font-family:sans-serif} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#00843D;border-radius:3px}`;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const loadAdminRefs = async () => {
    try { const snap = await getDocs(collection(db, "adminRefs")); setAdminRefs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch {}
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      if (fu) { setUser(fu); await loadUserRecord(fu); await loadAdminRefs(); }
      else    { setUser(null); setUserRecord(null); setScreen("landing"); }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const loadUserRecord = async (fu) => {
    const isAdmin = fu.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const ref     = doc(db, "users", fu.uid);
    const snap    = await getDoc(ref);
    let record;
    if (!snap.exists()) {
      record = { uid: fu.uid, name: fu.displayName || "Student", email: fu.email, photoURL: fu.photoURL || "", status: "pending", isAdmin, paymentRef: "", trialStarted: serverTimestamp(), createdAt: serverTimestamp() };
      await setDoc(ref, record);
    } else {
      record = snap.data();
      if (isAdmin && record.status !== "approved") { await updateDoc(ref, { status: "approved", isAdmin: true }); record = { ...record, status: "approved", isAdmin: true }; }
    }
    setUserRecord(record);
    if (record.classLevel) setClassLevel(record.classLevel);

    if (isAdmin) { setScreen("admin"); return; }

    // Check subscription or trial
    if (record.subscriptionTier && record.subscriptionTier !== "trial") {
      // Has valid subscription
      if (!record.classLevel) setScreen("selectClass");
      else setScreen("dashboard");
      return;
    }
    if (record.subscriptionTier === "trial" && isTrialActive(record.trialStarted)) {
      if (!record.classLevel) setScreen("selectClass");
      else setScreen("dashboard");
      return;
    }
    // No valid subscription
    setScreen("subscribe");
  };

  useEffect(() => {
    if (screen !== "admin") return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.status === "pending" ? -1 : 1);
      setAdminUsers(data);
    });
    return unsub;
  }, [screen]);

  const handleSignIn  = async () => { setAuthError(""); try { await signInWithPopup(auth, provider); } catch (e) { if (e.code !== "auth/popup-closed-by-user") setAuthError("Sign-in failed. Please try again."); } };
  const handleSignOut = async () => { await signOut(auth); setScreen("landing"); };
  const updateStatus  = async (uid, status) => { await updateDoc(doc(db, "users", uid), { status, updatedAt: serverTimestamp() }); };

  const saveClassLevel = async (level) => {
    // Check tier permission
    const classInfo = CLASS_LEVELS.find(c => c.level === level);
    const subTier   = userRecord?.subscriptionTier;
    if (subTier !== "trial" && subTier && subTier !== classInfo?.tier) {
      alert(`Your subscription covers the ${subTier} category only. Please subscribe to the ${classInfo?.tier} category to access ${level}.`);
      return;
    }
    setClassLevel(level);
    if (user) await updateDoc(doc(db, "users", user.uid), { classLevel: level, updatedAt: serverTimestamp() });
    setScreen("dashboard");
  };

  const onSubscriptionSuccess = async (tier) => {
    const updated = { ...userRecord, subscriptionTier: tier, status: "approved" };
    setUserRecord(updated);
    if (!updated.classLevel) setScreen("selectClass");
    else setScreen("dashboard");
  };

  const generateCompendium = async (subject, isJsce = false) => {
    setSelectedSubject(subject);
    setScreen("generating");
    setGenError("");
    setLoadingStep(0);
    await loadAdminRefs();
    for (let i = 0; i < LOADING_STEPS.length; i++) { await new Promise(r => setTimeout(r, 700)); setLoadingStep(i + 1); }
    try {
      const examType = isJsce ? "JSCE/BECE" : (classLevel === "SS3" ? "WAEC/NECO" : "Study Guide");
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectName: subject.name, examType, classLevel, pdfBase64: refs.pdfBase64 || "", pdfName: refs.pdfName || "", referenceUrls: refs.referenceUrls || [], adminRefs: adminRefs.map(r => ({ name: r.name, url: r.url || "", description: r.description || "", type: r.type })) }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data.compendium || "";
      if (!text) throw new Error("Empty response");
      setCompendium(text);
      if (user) await addDoc(collection(db, "compendiums"), { uid: user.uid, subjectId: subject.id, subjectName: subject.name, content: text, createdAt: serverTimestamp() });
      setHistory(prev => prev.find(h => h.id === subject.id) ? prev : [{ ...subject, generatedAt: new Date().toLocaleDateString() }, ...prev]);
      setScreen("compendium");
    } catch (err) { setGenError(`Generation failed: ${err.message}. Please try again.`); setScreen("dashboard"); }
  };

  // ── Helpers ───────────────────────────────────────────────
  const classInfo    = CLASS_LEVELS.find(c => c.level === classLevel);
  const isJunior     = classInfo?.tier === "junior";
  const isSS3        = classLevel === "SS3";
  const isJSS3       = classLevel === "JSS3";
  const subjects     = isJunior ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS;
  const nextClass    = NEXT_CLASS[classLevel];
  const subTier      = userRecord?.subscriptionTier;
  const trialDaysLeft = getTrialDaysLeft(userRecord?.trialStarted);
  const isTrial      = subTier === "trial";

  const Logo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setScreen(userRecord?.isAdmin ? "admin" : user ? "dashboard" : "landing")}>
      <img src="/logo.png" alt="ExamEdge NG" style={{ height: 44, width: 44, objectFit: "contain" }} />
      <div style={{ fontFamily: "Georgia, serif", fontSize: "1.25rem", fontWeight: 900, color: "#FFD700" }}>
        ExamEdge <span style={{ color: "white", fontSize: "0.9rem" }}>NG</span>
        {userRecord?.isAdmin && <span style={{ display: "inline-block", marginLeft: 8, fontSize: "0.55rem", background: "rgba(255,215,0,0.2)", padding: "1px 8px", borderRadius: 999, fontFamily: "sans-serif" }}>ADMIN</span>}
      </div>
    </div>
  );

  const Topbar = () => (
    <div style={{ background: "#001a0d", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
      <Logo />
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isTrial && trialDaysLeft > 0 && <div style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700", borderRadius: 999, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600 }}>{trialDaysLeft}d trial left</div>}
          <div style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 999, padding: "5px 14px", fontSize: "0.82rem", color: "#FFD700", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", background: "#FFD700", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", color: "#001a0d" }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.displayName?.[0] ?? "U"}
            </div>
            {user.displayName?.split(" ")[0]}
          </div>
          <button onClick={() => setChatOpen(c => !c)} style={{ background: chatOpen ? "#FFD700" : "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)", color: chatOpen ? "#001a0d" : "#FFD700", borderRadius: 10, padding: "7px 12px", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <BotIcon size={15} color={chatOpen ? "#001a0d" : "#FFD700"} /> Ariel AI
          </button>
          <button onClick={handleSignOut} style={{ background: "transparent", border: "1px solid rgba(255,215,0,0.2)", color: "#FFD700", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer" }}>Sign Out</button>
        </div>
      )}
    </div>
  );

  const FloatingButtons = () => (
    <>
      <div style={{ position: "fixed", bottom: 96, right: 24, zIndex: 998 }}>
        <ReferenceManager onRefsChange={setRefs} />
      </div>
      <button onClick={() => setChatOpen(c => !c)} style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 14, background: chatOpen ? "#FFD700" : "linear-gradient(135deg,#001a0d,#00843D)", color: chatOpen ? "#001a0d" : "white", border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,26,13,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {chatOpen ? <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>✕</span> : <BotIcon size={24} color="white" />}
      </button>
      {chatOpen && <Chatbot subject={selectedSubject} classLevel={classLevel} onClose={() => setChatOpen(false)} />}
    </>
  );

  // ── SCREENS ───────────────────────────────────────────────

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#001a0d", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <img src="/logo.png" alt="" style={{ height: 80, width: 80, objectFit: "contain", animation: "spin 3s linear infinite" }} />
      <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading ExamEdge NG…</p>
    </div>
  );

  if (screen === "landing") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#001a0d 0%,#003d1f 50%,#005a29 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
      <img src="/logo.png" alt="ExamEdge NG" style={{ height: 120, width: 120, objectFit: "contain", marginBottom: 24, filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.4))" }} />
      <div style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700", borderRadius: 999, padding: "6px 20px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>🇳🇬 NIGERIA'S #1 EXAM INTELLIGENCE PLATFORM</div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.5rem,7vw,5rem)", fontWeight: 900, color: "white", lineHeight: 1.05, marginBottom: 8 }}>Exam<span style={{ color: "#FFD700" }}>Edge</span> NG</h1>
      <p style={{ color: "rgba(255,215,0,0.65)", fontSize: "0.95rem", marginBottom: 12, letterSpacing: 2, fontWeight: 600 }}>THE AI ADVANTAGE</p>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", maxWidth: 500, lineHeight: 1.7, marginBottom: 48 }}>Powered by Ariel AI — your intelligent companion from JSS1 all the way to SS3 and beyond.</p>
      <div style={{ display: "flex", gap: 40, marginBottom: 52, flexWrap: "wrap", justifyContent: "center" }}>
        {[["JSS1–SS3","Full Coverage"],["JSCE + WAEC","Exam Prep"],["95%+","Prediction Rate"],["A1","Your Target"]].map(([n,l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontWeight: 900, color: "#FFD700" }}>{n}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>{l}</div>
          </div>
        ))}
      </div>
      {authError && <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 10, padding: "12px 24px", marginBottom: 20, fontSize: "0.9rem" }}>{authError}</div>}
      <button onClick={handleSignIn} style={{ background: "white", color: "#1a1a1a", border: "none", borderRadius: 14, padding: "16px 36px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginTop: 16 }}>7-day free trial · No card required to start</p>
    </div>
  );

  if (screen === "subscribe") return (
    <SubscriptionScreen user={user} userRecord={userRecord} onSuccess={onSubscriptionSuccess} onSignOut={handleSignOut} />
  );

  if (screen === "selectClass") return (
    <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
      <Topbar />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 68px)", padding: "48px 24px", textAlign: "center" }}>
        <img src="/logo.png" alt="" style={{ height: 72, width: 72, objectFit: "contain", marginBottom: 20 }} />
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.9rem", color: "#001a0d", marginBottom: 10 }}>Which class are you in?</h2>
        <p style={{ color: "#6b7280", maxWidth: 440, lineHeight: 1.7, marginBottom: 28 }}>
          Ariel AI will personalise everything — subjects, study content, and exam prep — to match your class level.
          {subTier && subTier !== "trial" && <span style={{ display: "block", marginTop: 8, color: "#00843D", fontWeight: 600 }}>Your {subTier} subscription covers {subTier === "junior" ? "JSS1–JSS3" : "SS1–SS3"}.</span>}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, width: "100%", maxWidth: 500, marginBottom: 20 }}>
          {CLASS_LEVELS.map(c => {
            const locked = subTier && subTier !== "trial" && c.tier !== subTier;
            return (
              <button key={c.level} onClick={() => !locked && saveClassLevel(c.level)}
                style={{ background: locked ? "#f3f4f6" : c.color, border: "none", borderRadius: 16, padding: "22px 12px", cursor: locked ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: locked ? "none" : "0 4px 16px rgba(0,0,0,0.15)", opacity: locked ? 0.4 : 1 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 900, color: locked ? "#9ca3af" : "white" }}>{c.label}</span>
                <span style={{ fontSize: "0.72rem", color: locked ? "#9ca3af" : "rgba(255,255,255,0.85)", lineHeight: 1.3, textAlign: "center" }}>{locked ? "Locked" : c.sub}</span>
              </button>
            );
          })}
        </div>
        {classLevel && <button onClick={() => setScreen("dashboard")} style={{ background: "transparent", border: "1.5px solid #d1fae5", color: "#6b7280", borderRadius: 10, padding: "8px 20px", fontSize: "0.85rem", cursor: "pointer" }}>← Keep {classLevel}</button>}
        <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 12 }}>You can update your class level anytime from the dashboard</p>
      </div>
    </div>
  );

  if (screen === "admin") {
    const counts = { pending: adminUsers.filter(u => u.status === "pending").length, approved: adminUsers.filter(u => u.status === "approved").length, rejected: adminUsers.filter(u => u.status === "rejected").length };
    return (
      <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
        <Topbar />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: "#001a0d", marginBottom: 6 }}>Admin Dashboard</h1>
          <p style={{ color: "#6b7280", marginBottom: 32 }}>Manage students, access codes, and AI reference materials</p>
          <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
            {[["Pending",counts.pending,"#854d0e","#fef9c3"],["Approved",counts.approved,"#166534","#dcfce7"],["Rejected",counts.rejected,"#991b1b","#fee2e2"],["Total",adminUsers.length,"#1e3a5f","#eff6ff"]].map(([l,c,col,bg]) => (
              <div key={l} style={{ background: bg, borderRadius: 12, padding: "16px 24px", flex: 1, minWidth: 120, textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontFamily: "Georgia, serif", fontWeight: 900, color: col }}>{c}</div>
                <div style={{ fontSize: "0.78rem", color: col, fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
          {counts.pending > 0 && <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "14px 20px", marginBottom: 24, color: "#854d0e", fontWeight: 600 }}>🔔 {counts.pending} student{counts.pending > 1 ? "s" : ""} waiting</div>}
          <div style={{ background: "white", borderRadius: 16, overflowX: "auto", boxShadow: "0 4px 24px rgba(0,132,61,0.08)", border: "1px solid #d1fae5" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead><tr>{["Student","Email","Class","Subscription","Status","Actions"].map(h => <th key={h} style={{ background: "#001a0d", color: "#FFD700", padding: "14px 20px", textAlign: "left", fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {adminUsers.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>No users yet</td></tr>
                : adminUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f0fdf4" }}>
                    <td style={{ padding: "12px 20px", fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: "12px 20px", color: "#4b5563", fontSize: "0.85rem" }}>{u.email}</td>
                    <td style={{ padding: "12px 20px" }}><span style={{ background: "#e6f4ec", color: "#001a0d", borderRadius: 999, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 700 }}>{u.classLevel || "—"}</span></td>
                    <td style={{ padding: "12px 20px" }}><span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{u.subscriptionTier || "none"}</span></td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ borderRadius: 999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600, background: u.status==="approved"?"#dcfce7":u.status==="pending"?"#fef9c3":"#fee2e2", color: u.status==="approved"?"#166534":u.status==="pending"?"#854d0e":"#991b1b" }}>
                        {u.status==="approved"?"✅":u.status==="pending"?"⏳":"❌"} {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      {u.isAdmin ? <span style={{ color: "#FFD700", fontWeight: 700 }}>👑</span> : (
                        <>
                          {u.status==="pending"&&<><button style={{ background:"#00843D",color:"white",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:4,fontWeight:600 }} onClick={()=>updateStatus(u.id,"approved")}>✅</button><button style={{ background:"#ef4444",color:"white",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600 }} onClick={()=>updateStatus(u.id,"rejected")}>❌</button></>}
                          {u.status==="approved"&&<button style={{ background:"#f59e0b",color:"white",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600 }} onClick={()=>updateStatus(u.id,"rejected")}>🚫</button>}
                          {u.status==="rejected"&&<button style={{ background:"#00843D",color:"white",border:"none",borderRadius:8,padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",fontWeight:600 }} onClick={()=>updateStatus(u.id,"approved")}>↩️</button>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminCodeGenerator />
          <AdminRefsPanel />
        </div>
        <FloatingButtons />
      </div>
    );
  }

  if (screen === "generating") return (
    <div style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg,#001a0d,#003d1f)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, textAlign: "center", padding: 24 }}>
      <img src="/logo.png" alt="" style={{ height: 80, width: 80, objectFit: "contain", marginBottom: 24, animation: "spin 3s linear infinite" }} />
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", color: "white", marginBottom: 8 }}>Generating Your Compendium</h2>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", maxWidth: 380, marginBottom: 28 }}>Analyzing past questions for <strong style={{ color: "#FFD700" }}>{selectedSubject?.name}</strong>…</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
        {LOADING_STEPS.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", color: loadingStep > i ? "#4ade80" : loadingStep === i ? "#FFD700" : "rgba(255,255,255,0.25)", fontWeight: loadingStep === i ? 600 : 400 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: loadingStep > i ? "#4ade80" : loadingStep === i ? "#FFD700" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", flexShrink: 0, color: "#001a0d" }}>
              {loadingStep > i ? "✓" : loadingStep === i ? "●" : ""}
            </span>
            {step}
          </div>
        ))}
      </div>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", marginTop: 28 }}>This may take up to 60 seconds…</p>
    </div>
  );

  if (screen === "compendium" && compendium) {
    const sections = parseSections(compendium);
    return (
      <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
        <Topbar />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ background: "linear-gradient(135deg,#001a0d,#003d1f)", borderRadius: 20, padding: "32px 36px", color: "white", marginBottom: 28, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <img src="/logo.png" alt="" style={{ height: 60, width: 60, objectFit: "contain" }} />
            <div>
              <div style={{ display: "inline-block", background: "#FFD700", color: "#001a0d", borderRadius: 999, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 700, marginBottom: 10 }}>
                📋 {jscMode ? "JSCE/BECE Compendium" : "AI-Generated Compendium"}
              </div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", marginBottom: 4 }}>{selectedSubject?.icon} {selectedSubject?.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem" }}>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            <button style={{ background: "transparent", border: "1.5px solid #00843D", color: "#00843D", borderRadius: 10, padding: "10px 20px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }} onClick={() => setScreen("dashboard")}>← Back</button>
            <button style={{ background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }} onClick={() => generateCompendium(selectedSubject, jscMode)}>🔄 Regenerate</button>
            <button style={{ background: "transparent", border: "1.5px solid #00843D", color: "#00843D", borderRadius: 10, padding: "10px 20px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }} onClick={() => window.print()}>🖨️ Print</button>
          </div>
          {sections.map((sec, i) => (
            <div key={i} style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 16, padding: "26px 30px", marginBottom: 18, boxShadow: "0 4px 20px rgba(0,132,61,0.06)" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", color: "#001a0d", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, background: "#e6f4ec", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{sec.emoji}</span>
                {sec.label}
              </h3>
              {sec.key === "lastminute" ? (
                <div style={{ background: "linear-gradient(135deg,#fefce8,#fef9c3)", border: "1.5px solid #FFD700", borderRadius: 12, padding: "18px 22px" }}>
                  <p style={{ color: "#854d0e", fontSize: "0.85rem", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>⚡ Priority Focus</p>
                  <div style={{ color: "#78350f", fontSize: "0.9rem", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{sec.content}</div>
                </div>
              ) : <div style={{ color: "#1a1a1a", lineHeight: 1.9, fontSize: "0.92rem", whiteSpace: "pre-wrap" }}>{sec.content || compendium}</div>}
            </div>
          ))}
        </div>
        <FloatingButtons />
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
      <Topbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>

        {/* Trial banner */}
        {isTrial && trialDaysLeft > 0 && (
          <div style={{ background: "linear-gradient(135deg,#001a0d,#003d1f)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 14, padding: "14px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "white", fontSize: "0.88rem" }}>🎁 <strong style={{ color: "#FFD700" }}>{trialDaysLeft} days</strong> left on your free trial</p>
            <button onClick={() => setScreen("subscribe")} style={{ background: "#FFD700", color: "#001a0d", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer" }}>Subscribe Now →</button>
          </div>
        )}

        {/* Welcome Banner */}
        <div style={{ background: "linear-gradient(135deg,#001a0d,#003d1f)", borderRadius: 20, padding: "34px 38px", color: "white", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", marginBottom: 6 }}>Welcome, {user?.displayName?.split(" ")[0]}! 👋</h2>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>
              {isSS3 ? "Generate your AI-powered WAEC & NECO exam compendium below."
              : isJSS3 ? "Your JSS3 dashboard — classwork, Ariel AI, and JSCE/BECE exam prep."
              : classLevel ? `Your ${classLevel} after-school study companion. Ask Ariel AI anything!`
              : "Select a subject to get started."}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            {classLevel && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <div style={{ background: "#FFD700", color: "#001a0d", borderRadius: 999, padding: "6px 18px", fontWeight: 700, fontSize: "0.85rem" }}>🎓 {classLevel}</div>
                {/* Switch class — available to all */}
                <button onClick={() => setScreen("selectClass")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 999, padding: "6px 14px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                  🔄 Switch Class
                </button>
                {/* Get Promoted — if there is a next class in same tier */}
                {nextClass && CLASS_LEVELS.find(c => c.level === nextClass)?.tier === classInfo?.tier && (
                  <button onClick={() => setScreen("selectClass")} style={{ background: "linear-gradient(135deg,#FFD700,#f59e0b)", color: "#001a0d", border: "none", borderRadius: 999, padding: "6px 16px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}>
                    🚀 Get Promoted
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* JSCE/BECE Banner for JSS3 */}
        {isJSS3 && (
          <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)", borderRadius: 16, padding: "20px 28px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>📋 JSCE / BECE Exam Preparation Mode</p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem" }}>Generate AI-powered compendiums for your Junior Secondary Certificate Examination — just like SS3 students do for WAEC!</p>
            </div>
            <button onClick={() => setJscMode(true)} style={{ background: "white", color: "#0c4a6e", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: "0.88rem", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>
              📚 Open JSCE Prep Mode →
            </button>
          </div>
        )}

        {/* JSCE Mode toggle */}
        {isJSS3 && jscMode && (
          <div style={{ background: "#f0f9ff", border: "2px solid #0ea5e9", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ color: "#0c4a6e", fontWeight: 700, fontSize: "0.9rem" }}>📋 JSCE Exam Mode — generating compendiums for your JSCE/BECE exam</p>
            <button onClick={() => setJscMode(false)} style={{ background: "#0ea5e9", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600 }}>Exit Exam Mode</button>
          </div>
        )}

        {/* Ariel AI companion banner */}
        {!isSS3 && !jscMode && (
          <div style={{ background: "white", border: "1.5px solid #d1fae5", borderRadius: 16, padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 20px rgba(0,132,61,0.06)", flexWrap: "wrap" }}>
            <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#001a0d,#00843D)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BotIcon size={26} color="#FFD700" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#001a0d", marginBottom: 3 }}>Ariel AI — your personal after-school tutor 🎓</p>
              <p style={{ color: "#6b7280", fontSize: "0.84rem" }}>Ask anything — homework, topic explanations, problem solving. Upload a photo or PDF and Ariel will explain it instantly.</p>
            </div>
            <button onClick={() => setChatOpen(true)} style={{ background: "linear-gradient(135deg,#00843D,#005a29)", color: "white", border: "none", borderRadius: 12, padding: "11px 22px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
              Chat with Ariel →
            </button>
          </div>
        )}

        {genError && <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 10, padding: "12px 20px", marginBottom: 20, fontWeight: 600 }}>{genError}</div>}

        {/* Subject label */}
        <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#00843D", marginBottom: 18 }}>
          📚 {jscMode ? "JSCE Subjects" : `${classLevel} Subjects`}
        </p>

        {/* Subject Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 16, marginBottom: 48 }}>
          {(jscMode ? JSCE_SUBJECTS : subjects).map(sub => (
            <div key={sub.id} style={{ background: "white", border: "1.5px solid #d1fae5", borderRadius: 16, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 4px 20px rgba(0,132,61,0.06)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,132,61,0.14)"; }}
              onMouseOut={e  => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,132,61,0.06)"; }}>
              <div style={{ fontSize: "2rem" }}>{sub.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.93rem" }}>{sub.name}</div>
                <div style={{ fontSize: "0.77rem", color: "#6b7280" }}>{classLevel} · Nigerian Curriculum</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={{ background: "#f0fdf4", color: "#00843D", border: "1.5px solid #d1fae5", borderRadius: 10, padding: "8px 0", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                  onClick={() => { setSelectedSubject(sub); setChatOpen(true); }}>
                  🤖 Ask Ariel AI
                </button>
                {(isSS3 || isJSS3 || !isJunior) && (
                  <button style={{ background: `linear-gradient(135deg,${jscMode ? "#0ea5e9" : "#00843D"},${jscMode ? "#0284c7" : "#005a29"})`, color: "white", border: "none", borderRadius: 10, padding: "8px 0", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                    onClick={() => { setJscMode(jscMode); generateCompendium(sub, jscMode); }}>
                    ✨ {jscMode ? "JSCE Compendium" : isSS3 ? "Generate Compendium" : "Study Guide"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Previously generated */}
        {history.length > 0 && <>
          <div style={{ height: 1, background: "#d1fae5", margin: "32px 0" }} />
          <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#00843D", marginBottom: 18 }}>🕓 Previously Generated</p>
          <div style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,132,61,0.06)" }}>
            {history.map((h, i) => (
              <div key={i} onClick={() => generateCompendium(h)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderBottom: i < history.length-1 ? "1px solid #f0fdf4" : "none", cursor: "pointer", borderRadius: 8 }}>
                <span style={{ fontSize: "1.5rem" }}>{h.icon}</span>
                <div><div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{h.name}</div><div style={{ fontSize: "0.76rem", color: "#6b7280" }}>Generated {h.generatedAt}</div></div>
                <span style={{ marginLeft: "auto", color: "#00843D", fontSize: "0.8rem", fontWeight: 600 }}>Regenerate →</span>
              </div>
            ))}
          </div>
        </>}
      </div>
      <FloatingButtons />
    </div>
  );
}
