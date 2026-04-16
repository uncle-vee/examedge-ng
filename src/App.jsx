// ============================================================
//  App.jsx — ExamEdge NG  |  Full app with real Firebase Auth
// ============================================================

import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import AdminDashboard from "./AdminDashboard";
import {
  collection, addDoc, query, where,
  orderBy, getDocs, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ── Subjects ─────────────────────────────────────────────────
const SUBJECTS = [
  { id: "mathematics",     name: "Mathematics",          icon: "📐" },
  { id: "english",         name: "English Language",     icon: "📖" },
  { id: "economics",       name: "Economics",            icon: "📊" },
  { id: "data_processing", name: "Data Processing",      icon: "💻" },
  { id: "biology",         name: "Biology",              icon: "🧬" },
  { id: "chemistry",       name: "Chemistry",            icon: "⚗️" },
  { id: "physics",         name: "Physics",              icon: "⚛️" },
  { id: "geography",       name: "Geography",            icon: "🌍" },
  { id: "crs",             name: "C.R.S",                icon: "✝️" },
  { id: "civic",           name: "Civic Education",      icon: "🏛️" },
  { id: "government",      name: "Government",           icon: "⚖️" },
  { id: "literature",      name: "Literature in English",icon: "🎭" },
  { id: "food",            name: "Food & Nutrition",     icon: "🥗" },
  { id: "agric",           name: "Agricultural Science", icon: "🌾" },
];

const LOADING_STEPS = [
  "🔍 Scanning WAEC archives (1988–2025)…",
  "📊 Detecting repeated questions across years…",
  "🧩 Identifying question structural patterns…",
  "📈 Ranking high-frequency topics…",
  "🔥 Predicting 2025/2026 hot topics…",
  "📝 Assembling your compendium…",
];

// ── Styles ────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green: #00843D; --green-dark: #005a29; --green-light: #e6f4ec;
    --gold: #FFD700;  --gold-dark: #c9a800;
    --white: #FFFFFF; --off-white: #F9F7F0;
    --text: #1a1a1a;  --muted: #6b7280; --border: #d1fae5;
    --shadow: 0 4px 24px rgba(0,132,61,0.10);
    --shadow-lg: 0 12px 48px rgba(0,132,61,0.18);
  }
  body { font-family:'DM Sans',sans-serif; background:var(--off-white); color:var(--text); min-height:100vh; }
  .app  { min-height:100vh; display:flex; flex-direction:column; }

  /* Topbar */
  .topbar { background:var(--green-dark); color:var(--gold); padding:0 32px; height:64px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; box-shadow:0 2px 16px rgba(0,0,0,0.18); }
  .topbar-logo { font-family:'Playfair Display',serif; font-size:1.45rem; font-weight:900; display:flex; align-items:center; gap:10px; }
  .topbar-logo span { color:var(--white); } .topbar-logo em { color:var(--gold); font-style:normal; }
  .topbar-right { display:flex; align-items:center; gap:16px; }
  .user-pill { background:rgba(255,215,0,0.12); border:1px solid rgba(255,215,0,0.3); border-radius:999px; padding:6px 16px; font-size:0.82rem; color:var(--gold); display:flex; align-items:center; gap:8px; }
  .avatar { width:28px; height:28px; border-radius:50%; background:var(--gold); color:var(--green-dark); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; overflow:hidden; }
  .avatar img { width:100%; height:100%; object-fit:cover; }
  .btn-logout { background:transparent; border:1px solid rgba(255,215,0,0.4); color:var(--gold); border-radius:8px; padding:6px 14px; font-size:0.8rem; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .btn-logout:hover { background:rgba(255,215,0,0.1); }

  /* Hero */
  .hero { background:linear-gradient(135deg,var(--green-dark) 0%,#006b30 50%,#004d22 100%); min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:48px 24px; position:relative; overflow:hidden; }
  .hero::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
  .hero-badge { background:rgba(255,215,0,0.15); border:1px solid rgba(255,215,0,0.4); color:var(--gold); border-radius:999px; padding:6px 20px; font-size:0.78rem; font-weight:600; letter-spacing:2px; text-transform:uppercase; margin-bottom:28px; display:inline-block; }
  .hero h1 { font-family:'Playfair Display',serif; font-size:clamp(2.8rem,7vw,5.5rem); font-weight:900; color:var(--white); line-height:1.05; margin-bottom:12px; }
  .hero h1 em { color:var(--gold); font-style:normal; }
  .hero-sub { color:rgba(255,255,255,0.72); font-size:1.1rem; max-width:520px; line-height:1.7; margin-bottom:48px; }
  .hero-stats { display:flex; gap:40px; margin-bottom:52px; flex-wrap:wrap; justify-content:center; }
  .stat { text-align:center; }
  .stat-num { font-family:'Playfair Display',serif; font-size:2.2rem; font-weight:900; color:var(--gold); display:block; }
  .stat-label { color:rgba(255,255,255,0.6); font-size:0.82rem; }
  .btn-google { background:var(--white); color:var(--text); border:none; border-radius:12px; padding:16px 36px; font-size:1rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:12px; box-shadow:0 4px 24px rgba(0,0,0,0.2); transition:all 0.25s; font-family:'DM Sans',sans-serif; }
  .btn-google:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.28); }
  .btn-google:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

  /* Pending */
  .pending-screen { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 24px; text-align:center; background:var(--off-white); }
  .pending-icon { width:96px; height:96px; background:var(--green-light); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.8rem; margin-bottom:28px; box-shadow:0 0 0 16px rgba(0,132,61,0.07); }
  .pending-screen h2 { font-family:'Playfair Display',serif; font-size:1.9rem; color:var(--green-dark); margin-bottom:14px; }
  .pending-screen p { color:var(--muted); max-width:420px; line-height:1.7; margin-bottom:10px; }
  .pending-email-box { background:var(--green-light); border:1px solid var(--border); border-radius:10px; padding:12px 24px; color:var(--green-dark); font-weight:600; margin:18px 0; font-size:0.95rem; }
  .payment-input { width:100%; max-width:380px; border:1.5px solid var(--border); border-radius:10px; padding:12px 16px; font-size:0.9rem; font-family:'DM Sans',sans-serif; outline:none; margin-bottom:12px; }
  .payment-input:focus { border-color:var(--green); }
  .pulse-dot { width:10px; height:10px; background:var(--gold); border-radius:50%; display:inline-block; animation:pulse 1.8s infinite; margin-right:8px; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }

  /* Admin */
  .admin-wrap { max-width:1000px; margin:0 auto; padding:48px 24px; }
  .page-title { font-family:'Playfair Display',serif; font-size:2rem; color:var(--green-dark); margin-bottom:6px; }
  .page-sub { color:var(--muted); margin-bottom:32px; }
  .admin-table { background:var(--white); border-radius:16px; overflow:hidden; box-shadow:var(--shadow); border:1px solid var(--border); width:100%; overflow-x:auto; }
  .admin-table table { width:100%; border-collapse:collapse; min-width:720px; }
  .admin-table th { background:var(--green-dark); color:var(--gold); padding:14px 20px; text-align:left; font-size:0.82rem; font-weight:600; letter-spacing:1px; text-transform:uppercase; }
  .admin-table td { padding:14px 20px; border-bottom:1px solid #f0fdf4; font-size:0.9rem; }
  .admin-table tr:last-child td { border-bottom:none; }
  .admin-table tr:hover td { background:#f0fdf4; }
  .status-badge { border-radius:999px; padding:4px 14px; font-size:0.78rem; font-weight:600; display:inline-block; }
  .status-pending  { background:#fef9c3; color:#854d0e; }
  .status-approved { background:#dcfce7; color:#166534; }
  .status-rejected { background:#fee2e2; color:#991b1b; }
  .btn-approve { background:var(--green); color:white; border:none; border-radius:8px; padding:6px 14px; font-size:0.8rem; cursor:pointer; margin-right:6px; transition:background 0.2s; font-family:'DM Sans',sans-serif; }
  .btn-approve:hover { background:var(--green-dark); }
  .btn-reject  { background:#ef4444; color:white; border:none; border-radius:8px; padding:6px 14px; font-size:0.8rem; cursor:pointer; transition:background 0.2s; font-family:'DM Sans',sans-serif; }
  .btn-reject:hover { background:#b91c1c; }
  .btn-revoke  { background:#f59e0b; color:white; border:none; border-radius:8px; padding:6px 14px; font-size:0.8rem; cursor:pointer; font-family:'DM Sans',sans-serif; }

  /* Dashboard */
  .dash-wrap { max-width:1100px; margin:0 auto; padding:48px 24px; }
  .welcome-banner { background:linear-gradient(135deg,var(--green-dark),#006b30); border-radius:20px; padding:36px 40px; color:white; margin-bottom:40px; display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; position:relative; overflow:hidden; }
  .welcome-banner::after { content:'🎓'; position:absolute; right:32px; bottom:-10px; font-size:7rem; opacity:0.12; }
  .welcome-banner h2 { font-family:'Playfair Display',serif; font-size:1.8rem; margin-bottom:6px; }
  .welcome-banner p { color:rgba(255,255,255,0.75); font-size:0.95rem; }
  .gold-pill { background:var(--gold); color:var(--green-dark); border-radius:999px; padding:8px 22px; font-weight:700; font-size:0.85rem; white-space:nowrap; }
  .section-label { font-size:0.78rem; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--green); margin-bottom:18px; }
  .subjects-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:18px; margin-bottom:48px; }
  .subject-card { background:var(--white); border:1.5px solid var(--border); border-radius:16px; padding:26px 20px; cursor:pointer; transition:all 0.25s; display:flex; flex-direction:column; gap:12px; position:relative; overflow:hidden; }
  .subject-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:var(--green); transform:scaleX(0); transition:transform 0.25s; transform-origin:left; }
  .subject-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg); border-color:var(--green); }
  .subject-card:hover::before { transform:scaleX(1); }
  .subject-icon { font-size:2.2rem; }
  .subject-name { font-weight:600; font-size:0.95rem; color:var(--text); line-height:1.3; }
  .subject-meta { font-size:0.78rem; color:var(--muted); }
  .btn-generate { background:var(--green); color:white; border:none; border-radius:10px; padding:10px 0; font-size:0.85rem; font-weight:600; cursor:pointer; width:100%; transition:all 0.2s; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:6px; }
  .btn-generate:hover { background:var(--green-dark); transform:translateY(-1px); }

  /* Loading */
  .loading-overlay { position:fixed; inset:0; background:rgba(0,42,18,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:999; text-align:center; padding:24px; }
  .loading-spinner { width:72px; height:72px; border:5px solid rgba(255,215,0,0.2); border-top:5px solid var(--gold); border-radius:50%; animation:spin 1s linear infinite; margin-bottom:28px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .loading-title { font-family:'Playfair Display',serif; font-size:1.6rem; color:white; margin-bottom:8px; }
  .loading-sub { color:rgba(255,255,255,0.6); font-size:0.9rem; max-width:380px; }
  .loading-steps { margin-top:24px; }
  .loading-step { color:rgba(255,255,255,0.4); font-size:0.88rem; margin:6px 0; transition:color 0.4s; }
  .loading-step.active { color:var(--gold); font-weight:600; }
  .loading-step.done   { color:#86efac; }

  /* Compendium */
  .comp-wrap { max-width:900px; margin:0 auto; padding:48px 24px; }
  .comp-header { background:linear-gradient(135deg,var(--green-dark),#006b30); border-radius:20px; padding:36px 40px; color:white; margin-bottom:32px; position:relative; overflow:hidden; }
  .comp-header::after { content:attr(data-icon); position:absolute; right:24px; top:50%; transform:translateY(-50%); font-size:6rem; opacity:0.15; }
  .comp-header h1 { font-family:'Playfair Display',serif; font-size:2rem; margin-bottom:6px; }
  .comp-header p { color:rgba(255,255,255,0.75); }
  .comp-badge { display:inline-block; background:var(--gold); color:var(--green-dark); border-radius:999px; padding:5px 16px; font-size:0.78rem; font-weight:700; margin-bottom:14px; letter-spacing:1px; }
  .comp-actions { display:flex; gap:12px; margin-bottom:32px; flex-wrap:wrap; }
  .btn-outline  { background:transparent; border:1.5px solid var(--green); color:var(--green); border-radius:10px; padding:10px 22px; font-size:0.88rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .btn-outline:hover { background:var(--green); color:white; }
  .btn-primary  { background:var(--green); color:white; border:1.5px solid var(--green); border-radius:10px; padding:10px 22px; font-size:0.88rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .btn-primary:hover { background:var(--green-dark); }
  .comp-section { background:var(--white); border:1px solid var(--border); border-radius:16px; padding:28px 32px; margin-bottom:20px; box-shadow:var(--shadow); }
  .comp-section h3 { font-family:'Playfair Display',serif; font-size:1.15rem; color:var(--green-dark); margin-bottom:16px; display:flex; align-items:center; gap:10px; }
  .comp-section-icon { width:36px; height:36px; background:var(--green-light); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
  .comp-content { color:var(--text); line-height:1.9; font-size:0.93rem; white-space:pre-wrap; }
  .highlight-box { background:linear-gradient(135deg,#fefce8,#fef9c3); border:1.5px solid var(--gold); border-radius:12px; padding:20px 24px; margin-top:16px; }
  .highlight-box h4 { color:#854d0e; font-size:0.88rem; font-weight:700; margin-bottom:8px; letter-spacing:1px; text-transform:uppercase; }
  .highlight-box p { color:#78350f; font-size:0.9rem; line-height:1.8; white-space:pre-wrap; }

  /* History */
  .history-panel { background:var(--white); border:1px solid var(--border); border-radius:16px; padding:24px; box-shadow:var(--shadow); }
  .history-item { display:flex; align-items:center; gap:14px; padding:10px 12px; border-bottom:1px solid #f0fdf4; cursor:pointer; transition:background 0.15s; border-radius:8px; }
  .history-item:hover { background:var(--green-light); }
  .history-item:last-child { border-bottom:none; }
  .divider { height:1px; background:var(--border); margin:32px 0; }

  @media(max-width:640px){
    .topbar { padding:0 16px; }
    .welcome-banner { padding:24px 20px; }
    .comp-header { padding:24px 20px; }
    .comp-section { padding:20px 18px; }
  }
  @media print {
    .topbar, .comp-actions { display:none !important; }
    .comp-wrap { padding:0; }
    .comp-section { box-shadow:none; border:1px solid #ddd; break-inside:avoid; }
  }
`;

// ── Section definitions for parsing ──────────────────────────
const SECTION_DEFS = [
  { key:"overview",   emoji:"📌", label:"Overview" },
  { key:"repeated",   emoji:"🔁", label:"Repeated Questions (1988–2025)" },
  { key:"topics",     emoji:"🗂️", label:"Top 15 Recurring Topics (Ranked by Frequency)" },
  { key:"patterns",   emoji:"🧩", label:"Question Pattern Guide" },
  { key:"questions",  emoji:"📝", label:"30 High-Probability Exam Questions With Model Answers" },
  { key:"mustknow",   emoji:"📐", label:"Key Must-Knows" },
  { key:"predicted",  emoji:"🔥", label:"2025/2026 Predicted Hot Topics" },
  { key:"lastminute", emoji:"⚡", label:"Last-Minute Focus List (Top 5)" },
];

function parseSections(text) {
  const results = [];
  SECTION_DEFS.forEach((def, i) => {
    const startIdx = text.indexOf(def.emoji);
    if (startIdx === -1) return;
    const nextDef = SECTION_DEFS.slice(i + 1).find(d => text.indexOf(d.emoji, startIdx + 1) !== -1);
    const endIdx  = nextDef ? text.indexOf(nextDef.emoji, startIdx + 1) : text.length;
    const raw     = text.slice(startIdx, endIdx);
    // Strip the header line
    const lines   = raw.split("\n");
    const content = lines.slice(1).join("\n").trim();
    results.push({ ...def, content });
  });
  if (results.length === 0) results.push({ key:"full", emoji:"📋", label:"Full Compendium", content: text });
  return results;
}

// ─────────────────────────────────────────────────────────────
//  Inner App — uses useAuth()
// ─────────────────────────────────────────────────────────────
function InnerApp() {
  const { user, userRecord, loading, authError, isAdmin, isApproved, isPending, isRejected, signInWithGoogle, signOut } = useAuth();

  const [screen,          setScreen]          = useState("loading-auth");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [compendium,      setCompendium]      = useState("");
  const [genLoading,      setGenLoading]      = useState(false);
  const [loadingStep,     setLoadingStep]     = useState(0);
  const [history,         setHistory]         = useState([]);
  const [genError,        setGenError]        = useState("");
  const [paymentRef,      setPaymentRef]      = useState("");
  const [paymentSaved,    setPaymentSaved]    = useState(false);
  const compRef = useRef(null);

  // Inject CSS
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // Route based on auth state
  useEffect(() => {
    if (loading) { setScreen("loading-auth"); return; }
    if (!user)   { setScreen("landing");      return; }
    if (isAdmin) { setScreen("admin");        return; }
    if (isApproved) { setScreen("dashboard"); return; }
    if (isPending)  { setScreen("pending");   return; }
    if (isRejected) { setScreen("rejected");  return; }
  }, [loading, user, isAdmin, isApproved, isPending, isRejected]);

  // ── Generate compendium ──────────────────────────────────────
  const generateCompendium = async (subject) => {
    setSelectedSubject(subject);
    setScreen("generating");
    setGenError("");
    setLoadingStep(0);

    // Animate loading steps
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 850));
      setLoadingStep(i + 1);
    }

    try {
      // Call our Vercel serverless function (keeps API key safe)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName: subject.name, subjectIcon: subject.icon }),
      });

      if (!res.ok) throw new Error("API call failed");
      const data = await res.json();
      const text = data.compendium || "";

      if (!text) throw new Error("Empty response");

      setCompendium(text);

      // Save to Firestore
      if (user) {
        await addDoc(collection(db, "compendiums"), {
          uid:         user.uid,
          subjectId:   subject.id,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          content:     text,
          createdAt:   serverTimestamp(),
        });
      }

      // Add to local history
      setHistory(prev => {
        const exists = prev.find(h => h.id === subject.id);
        if (exists) return prev.map(h => h.id === subject.id ? { ...h, generatedAt: new Date().toLocaleDateString() } : h);
        return [{ ...subject, generatedAt: new Date().toLocaleDateString() }, ...prev];
      });

      setScreen("compendium");
    } catch (err) {
      console.error(err);
      setGenError("Generation failed. Please check your connection and try again.");
      setScreen("dashboard");
    }
  };

  // ── Topbar ───────────────────────────────────────────────────
  const Topbar = ({ showSignOut = true }) => (
    <div className="topbar">
      <div className="topbar-logo" style={{ cursor: "pointer" }} onClick={() => isApproved || isAdmin ? setScreen(isAdmin ? "admin" : "dashboard") : null}>
        Exam<em>Edge</em> <span>NG</span>
        {isAdmin && <span style={{ fontSize:"0.65rem", background:"rgba(255,215,0,0.2)", padding:"2px 10px", borderRadius:999, marginLeft:8 }}>Admin</span>}
      </div>
      {showSignOut && user && (
        <div className="topbar-right">
          <div className="user-pill">
            <div className="avatar">
              {user.photoURL
                ? <img src={user.photoURL} alt="" />
                : user.displayName?.[0] ?? "U"}
            </div>
            {user.displayName?.split(" ")[0]}
          </div>
          <button className="btn-logout" onClick={signOut}>Sign Out</button>
        </div>
      )}
    </div>
  );

  // ── SCREEN: Auth loading ─────────────────────────────────────
  if (screen === "loading-auth") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--green-dark)" }}>
      <div style={{ textAlign:"center" }}>
        <div className="loading-spinner" style={{ margin:"0 auto 20px" }} />
        <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.9rem" }}>Loading ExamEdge NG…</div>
      </div>
    </div>
  );

  // ── SCREEN: Landing ──────────────────────────────────────────
  if (screen === "landing") return (
    <div className="app">
      <div className="hero">
        <div className="hero-badge">🇳🇬 Nigeria's #1 Exam Intelligence Platform</div>
        <h1>Exam<em>Edge</em> NG</h1>
        <p className="hero-sub">37 years of WAEC & NECO past questions — analyzed, decoded, and compressed into your personal A1 study compendium.</p>
        <div className="hero-stats">
          <div className="stat"><span className="stat-num">37</span><span className="stat-label">Years Analyzed</span></div>
          <div className="stat"><span className="stat-num">14</span><span className="stat-label">Subjects</span></div>
          <div className="stat"><span className="stat-num">1000+</span><span className="stat-label">Question Patterns</span></div>
          <div className="stat"><span className="stat-num">A1</span><span className="stat-label">Your Target</span></div>
        </div>
        {authError && <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:10, padding:"12px 24px", marginBottom:20, fontSize:"0.9rem" }}>{authError}</div>}
        <button className="btn-google" onClick={signInWithGoogle}>
          <svg viewBox="0 0 24 24" style={{ width:22, height:22 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", marginTop:16 }}>Access is granted after admin approval. Payment required.</p>
      </div>
    </div>
  );

  // ── SCREEN: Pending ──────────────────────────────────────────
  if (screen === "pending") return (
    <div className="app">
      <Topbar />
      <div className="pending-screen">
        <div className="pending-icon">⏳</div>
        <h2>Access Request Received</h2>
        <p>Welcome, <strong>{user?.displayName}</strong>! Your account has been registered and is awaiting admin approval.</p>
        <div className="pending-email-box">📧 {user?.email}</div>
        <p style={{ fontSize:"0.88rem", marginBottom:20 }}>
          <span className="pulse-dot" />Waiting for admin approval…
        </p>
        {!paymentSaved ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, width:"100%", maxWidth:400 }}>
            <p style={{ fontSize:"0.88rem", fontWeight:600, color:"var(--green-dark)" }}>Add your payment reference to speed up approval:</p>
            <input
              className="payment-input"
              placeholder="e.g. TRF-2034891 or bank transfer code"
              value={paymentRef}
              onChange={e => setPaymentRef(e.target.value)}
            />
            <button className="btn-primary"
              style={{ width:"100%", maxWidth:380, padding:"12px", fontSize:"0.9rem", border:"none", borderRadius:10, cursor:"pointer" }}
              onClick={async () => {
                if (!paymentRef.trim()) return;
                const { doc, updateDoc } = await import("firebase/firestore");
                await updateDoc(doc(db, "users", user.uid), { paymentRef: paymentRef.trim() });
                setPaymentSaved(true);
              }}>
              💾 Save Payment Reference
            </button>
          </div>
        ) : (
          <div style={{ background:"#dcfce7", border:"1px solid #86efac", borderRadius:10, padding:"12px 24px", color:"#166534", fontWeight:600, fontSize:"0.88rem" }}>
            ✅ Payment reference saved! The admin will verify and approve you shortly.
          </div>
        )}
        <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"16px 24px", marginTop:28, maxWidth:400, textAlign:"left" }}>
          <p style={{ color:"#166534", fontWeight:600, marginBottom:6, fontSize:"0.88rem" }}>📋 What happens next?</p>
          <p style={{ color:"#15803d", fontSize:"0.83rem", lineHeight:1.8 }}>
            1. Admin reviews your registration<br/>
            2. Your payment reference is verified<br/>
            3. Access is granted — sign in again<br/>
            4. Select any subject → generate your compendium
          </p>
        </div>
        <button className="btn-outline" style={{ marginTop:28 }} onClick={signOut}>← Sign Out</button>
      </div>
    </div>
  );

  // ── SCREEN: Rejected ─────────────────────────────────────────
  if (screen === "rejected") return (
    <div className="app">
      <Topbar />
      <div className="pending-screen">
        <div className="pending-icon">❌</div>
        <h2>Access Not Granted</h2>
        <p>Your request was not approved. Please contact the administrator or verify your payment.</p>
        <button className="btn-outline" style={{ marginTop:24 }} onClick={signOut}>← Sign Out</button>
      </div>
    </div>
  );

  // ── SCREEN: Admin ────────────────────────────────────────────
  if (screen === "admin") return (
    <div className="app">
      <Topbar />
      <AdminDashboard onSignOut={signOut} />
    </div>
  );

  // ── SCREEN: Generating ───────────────────────────────────────
  if (screen === "generating") return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <h2 className="loading-title">Analyzing Past Questions</h2>
      <p className="loading-sub">AI is scanning 37 years of WAEC & NECO data for <strong style={{ color:"#FFD700" }}>{selectedSubject?.name}</strong>…</p>
      <div className="loading-steps">
        {LOADING_STEPS.map((step, i) => (
          <div key={i} className={`loading-step ${loadingStep > i ? "done" : loadingStep === i ? "active" : ""}`}>
            {loadingStep > i ? "✓ " : ""}{step}
          </div>
        ))}
      </div>
    </div>
  );

  // ── SCREEN: Compendium ───────────────────────────────────────
  if (screen === "compendium" && compendium) {
    const sections = parseSections(compendium);
    return (
      <div className="app">
        <Topbar />
        <div className="comp-wrap" ref={compRef}>
          <div className="comp-header" data-icon={selectedSubject?.icon}>
            <div className="comp-badge">📋 AI-Generated Compendium • 1988–2025</div>
            <h1>{selectedSubject?.icon} {selectedSubject?.name}</h1>
            <p>WAEC & NECO Pattern Analysis — {new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</p>
          </div>
          <div className="comp-actions">
            <button className="btn-outline" onClick={() => setScreen("dashboard")}>← Back to Subjects</button>
            <button className="btn-primary" onClick={() => generateCompendium(selectedSubject)}>🔄 Regenerate</button>
            <button className="btn-outline" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
          </div>
          {sections.map((sec, i) => (
            <div className="comp-section" key={i}>
              <h3>
                <div className="comp-section-icon">{sec.emoji}</div>
                {sec.label}
              </h3>
              {sec.key === "lastminute" ? (
                <div className="highlight-box">
                  <h4>⚡ Priority Focus — 48-Hour Countdown</h4>
                  <p className="comp-content">{sec.content}</p>
                </div>
              ) : (
                <div className="comp-content">{sec.content || compendium}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── SCREEN: Student Dashboard ────────────────────────────────
  return (
    <div className="app">
      <Topbar />
      <div className="dash-wrap">
        <div className="welcome-banner">
          <div>
            <h2>Welcome, {user?.displayName?.split(" ")[0]}! 👋</h2>
            <p>Select a subject to generate your AI-powered exam compendium.</p>
          </div>
          <div className="gold-pill">✅ Access Approved</div>
        </div>

        {genError && <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:10, padding:"12px 20px", marginBottom:24 }}>{genError}</div>}

        <div className="section-label">📚 Choose a Subject</div>
        <div className="subjects-grid">
          {SUBJECTS.map(sub => (
            <div className="subject-card" key={sub.id}>
              <div className="subject-icon">{sub.icon}</div>
              <div>
                <div className="subject-name">{sub.name}</div>
                <div className="subject-meta">1988–2025 • WAEC & NECO</div>
              </div>
              <button className="btn-generate" onClick={() => generateCompendium(sub)}>
                ✨ Generate Compendium
              </button>
            </div>
          ))}
        </div>

        {history.length > 0 && (
          <>
            <div className="divider" />
            <div className="section-label">🕓 Previously Generated</div>
            <div className="history-panel">
              {history.map((h, i) => (
                <div className="history-item" key={i} onClick={() => generateCompendium(h)}>
                  <span style={{ fontSize:"1.5rem" }}>{h.icon}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:"0.88rem" }}>{h.name}</div>
                    <div style={{ fontSize:"0.76rem", color:"var(--muted)" }}>Generated {h.generatedAt}</div>
                  </div>
                  <span style={{ marginLeft:"auto", color:"var(--green)", fontSize:"0.8rem", fontWeight:600 }}>Regenerate →</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Root export wraps with AuthProvider ───────────────────────
export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
