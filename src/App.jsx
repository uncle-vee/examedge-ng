// ============================================================
//  App.jsx — ExamEdge NG  |  Rebuilt with direct Firebase auth
// ============================================================

import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, onSnapshot, addDoc, serverTimestamp,
} from "firebase/firestore";

// ── Firebase init ─────────────────────────────────────────────
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

const ADMIN_EMAIL = "Veekthormichael@gmail.com";

const SUBJECTS = [
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
];

const LOADING_STEPS = [
  "🔍 Scanning WAEC archives (1988–2025)…",
  "📊 Detecting repeated questions across years…",
  "🧩 Identifying question structural patterns…",
  "📈 Ranking high-frequency topics…",
  "🔥 Predicting 2025/2026 hot topics…",
  "📝 Assembling your compendium…",
];

const SECTION_DEFS = [
  { key: "overview",   emoji: "📌", label: "Overview" },
  { key: "repeated",   emoji: "🔁", label: "Repeated Questions (1988–2025)" },
  { key: "topics",     emoji: "🗂️", label: "Top 15 Recurring Topics" },
  { key: "patterns",   emoji: "🧩", label: "Question Pattern Guide" },
  { key: "questions",  emoji: "📝", label: "30 High-Probability Questions With Model Answers" },
  { key: "mustknow",   emoji: "📐", label: "Key Must-Knows" },
  { key: "predicted",  emoji: "🔥", label: "2025/2026 Predicted Hot Topics" },
  { key: "lastminute", emoji: "⚡", label: "Last-Minute Focus List (Top 5)" },
];

function parseSections(text) {
  const results = [];
  SECTION_DEFS.forEach((def, i) => {
    const startIdx = text.indexOf(def.emoji);
    if (startIdx === -1) return;
    const nextDef = SECTION_DEFS.slice(i + 1).find(d => text.indexOf(d.emoji, startIdx + 1) !== -1);
    const endIdx  = nextDef ? text.indexOf(nextDef.emoji, startIdx + 1) : text.length;
    const lines   = text.slice(startIdx, endIdx).split("\n");
    const content = lines.slice(1).join("\n").trim();
    results.push({ ...def, content });
  });
  if (results.length === 0) results.push({ key: "full", emoji: "📋", label: "Full Compendium", content: text });
  return results;
}

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

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: sans-serif; }`;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserRecord(firebaseUser);
      } else {
        setUser(null);
        setUserRecord(null);
        setScreen("landing");
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const loadUserRecord = async (firebaseUser) => {
    const isAdmin = firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const ref     = doc(db, "users", firebaseUser.uid);
    const snap    = await getDoc(ref);
    let record;
    if (!snap.exists()) {
      record = {
        uid: firebaseUser.uid, name: firebaseUser.displayName || "Student",
        email: firebaseUser.email, photoURL: firebaseUser.photoURL || "",
        status: isAdmin ? "approved" : "pending", isAdmin, paymentRef: "",
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, record);
    } else {
      record = snap.data();
      if (isAdmin && record.status !== "approved") {
        await updateDoc(ref, { status: "approved", isAdmin: true });
        record = { ...record, status: "approved", isAdmin: true };
      }
    }
    setUserRecord(record);
    if (isAdmin)                      setScreen("admin");
    else if (record.status === "approved") setScreen("dashboard");
    else if (record.status === "rejected") setScreen("rejected");
    else                                   setScreen("pending");
  };

  useEffect(() => {
    if (screen !== "admin") return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.status === "pending" ? -1 : 1));
      setAdminUsers(data);
    });
    return unsub;
  }, [screen]);

  const handleSignIn = async () => {
    setAuthError("");
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") setAuthError("Sign-in failed. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setScreen("landing");
  };

  const updateUserStatus = async (uid, status) => {
    await updateDoc(doc(db, "users", uid), { status, updatedAt: serverTimestamp() });
  };

  const generateCompendium = async (subject) => {
    setSelectedSubject(subject);
    setScreen("generating");
    setGenError("");
    setLoadingStep(0);
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 850));
      setLoadingStep(i + 1);
    }
    try {
      const res  = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectName: subject.name }) });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.compendium || "";
      if (!text) throw new Error("Empty");
      setCompendium(text);
      if (user) await addDoc(collection(db, "compendiums"), { uid: user.uid, subjectId: subject.id, subjectName: subject.name, content: text, createdAt: serverTimestamp() });
      setHistory(prev => prev.find(h => h.id === subject.id) ? prev : [{ ...subject, generatedAt: new Date().toLocaleDateString() }, ...prev]);
      setScreen("compendium");
    } catch (err) {
      console.error(err);
      setGenError("Generation failed. Please try again.");
      setScreen("dashboard");
    }
  };

  const savePaymentRef = async () => {
    if (!paymentRef.trim() || !user) return;
    await updateDoc(doc(db, "users", user.uid), { paymentRef: paymentRef.trim() });
    setPaymentSaved(true);
  };

  const Topbar = () => (
    <div style={{ background: "#005a29", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,0.18)" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "1.45rem", fontWeight: 900, color: "#FFD700", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        onClick={() => setScreen(userRecord?.isAdmin ? "admin" : "dashboard")}>
        Exam<span style={{ color: "#FFD700" }}>Edge</span> <span style={{ color: "white" }}>NG</span>
        {userRecord?.isAdmin && <span style={{ fontSize: "0.65rem", background: "rgba(255,215,0,0.2)", padding: "2px 10px", borderRadius: 999, fontFamily: "sans-serif" }}>Admin</span>}
      </div>
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 999, padding: "6px 16px", fontSize: "0.82rem", color: "#FFD700", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#FFD700", color: "#005a29", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", overflow: "hidden" }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.displayName?.[0] ?? "U"}
            </div>
            {user.displayName?.split(" ")[0]}
          </div>
          <button onClick={handleSignOut} style={{ background: "transparent", border: "1px solid rgba(255,215,0,0.4)", color: "#FFD700", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer" }}>Sign Out</button>
        </div>
      )}
    </div>
  );

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#005a29", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 72, height: 72, border: "5px solid rgba(255,215,0,0.2)", borderTop: "5px solid #FFD700", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading ExamEdge NG…</p>
    </div>
  );

  if (screen === "landing") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #005a29 0%, #006b30 50%, #004d22 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
      <div style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", color: "#FFD700", borderRadius: 999, padding: "6px 20px", fontSize: "0.78rem", fontWeight: 600, letterSpacing: 2, marginBottom: 28 }}>
        🇳🇬 NIGERIA'S #1 EXAM INTELLIGENCE PLATFORM
      </div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.8rem, 7vw, 5rem)", fontWeight: 900, color: "white", lineHeight: 1.05, marginBottom: 12 }}>
        Exam<span style={{ color: "#FFD700" }}>Edge</span> NG
      </h1>
      <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.1rem", maxWidth: 520, lineHeight: 1.7, marginBottom: 48 }}>
        37 years of WAEC &amp; NECO past questions — analyzed, decoded, and compressed into your personal A1 study compendium.
      </p>
      <div style={{ display: "flex", gap: 40, marginBottom: 52, flexWrap: "wrap", justifyContent: "center" }}>
        {[["37","Years Analyzed"],["14","Subjects"],["1000+","Question Patterns"],["A1","Your Target"]].map(([n,l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "2.2rem", fontWeight: 900, color: "#FFD700" }}>{n}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{l}</div>
          </div>
        ))}
      </div>
      {authError && <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 10, padding: "12px 24px", marginBottom: 20, fontSize: "0.9rem" }}>{authError}</div>}
      <button onClick={handleSignIn} style={{ background: "white", color: "#1a1a1a", border: "none", borderRadius: 12, padding: "16px 36px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", marginTop: 16 }}>Access is granted after admin approval. Payment required.</p>
    </div>
  );

  if (screen === "pending") return (
    <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
      <Topbar />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ width: 96, height: 96, background: "#e6f4ec", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.8rem", marginBottom: 28 }}>⏳</div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.9rem", color: "#005a29", marginBottom: 14 }}>Access Request Received</h2>
        <p style={{ color: "#6b7280", maxWidth: 420, lineHeight: 1.7, marginBottom: 10 }}>Welcome, <strong>{user?.displayName}</strong>! Your account is pending admin approval.</p>
        <div style={{ background: "#e6f4ec", border: "1px solid #d1fae5", borderRadius: 10, padding: "12px 24px", color: "#005a29", fontWeight: 600, margin: "18px 0" }}>📧 {user?.email}</div>
        {!paymentSaved ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", maxWidth: 380 }}>
            <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#005a29" }}>Add your payment reference to speed up approval:</p>
            <input style={{ width: "100%", border: "1.5px solid #d1fae5", borderRadius: 10, padding: "12px 16px", fontSize: "0.9rem", outline: "none" }} placeholder="e.g. TRF-2034891" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
            <button style={{ background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "12px", fontSize: "0.9rem", cursor: "pointer", width: "100%" }} onClick={savePaymentRef}>💾 Save Payment Reference</button>
          </div>
        ) : (
          <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "12px 24px", color: "#166534", fontWeight: 600 }}>✅ Payment reference saved! Admin will verify and approve you shortly.</div>
        )}
        <button style={{ background: "transparent", border: "1.5px solid #00843D", color: "#00843D", borderRadius: 10, padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", marginTop: 28 }} onClick={handleSignOut}>← Sign Out</button>
      </div>
    </div>
  );

  if (screen === "rejected") return (
    <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
      <Topbar />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 20 }}>❌</div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.9rem", color: "#005a29", marginBottom: 14 }}>Access Not Granted</h2>
        <p style={{ color: "#6b7280" }}>Your request was not approved. Please contact the administrator.</p>
        <button style={{ background: "transparent", border: "1.5px solid #00843D", color: "#00843D", borderRadius: 10, padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", marginTop: 24 }} onClick={handleSignOut}>← Sign Out</button>
      </div>
    </div>
  );

  if (screen === "admin") {
    const counts = { pending: adminUsers.filter(u => u.status === "pending").length, approved: adminUsers.filter(u => u.status === "approved").length, rejected: adminUsers.filter(u => u.status === "rejected").length };
    return (
      <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
        <Topbar />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: "#005a29", marginBottom: 6 }}>Admin Dashboard</h1>
          <p style={{ color: "#6b7280", marginBottom: 32 }}>Manage student registrations and grant access in real-time</p>
          <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
            {[["Pending", counts.pending, "#854d0e", "#fef9c3"],["Approved", counts.approved, "#166534", "#dcfce7"],["Rejected", counts.rejected, "#991b1b", "#fee2e2"],["Total", adminUsers.length, "#1e3a5f", "#eff6ff"]].map(([l,c,col,bg]) => (
              <div key={l} style={{ background: bg, borderRadius: 12, padding: "16px 24px", flex: 1, minWidth: 120, textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontFamily: "Georgia, serif", fontWeight: 900, color: col }}>{c}</div>
                <div style={{ fontSize: "0.78rem", color: col, fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
          {counts.pending > 0 && <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "14px 20px", marginBottom: 24, color: "#854d0e", fontWeight: 600 }}>🔔 {counts.pending} student{counts.pending > 1 ? "s" : ""} waiting for approval</div>}
          <div style={{ background: "white", borderRadius: 16, overflowX: "auto", boxShadow: "0 4px 24px rgba(0,132,61,0.10)", border: "1px solid #d1fae5" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead><tr>{["Student","Email","Payment Ref","Date","Status","Actions"].map(h => <th key={h} style={{ background: "#005a29", color: "#FFD700", padding: "14px 20px", textAlign: "left", fontSize: "0.82rem", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {adminUsers.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>No users yet</td></tr>
                : adminUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f0fdf4" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: "14px 20px", color: "#4b5563", fontSize: "0.85rem" }}>{u.email}</td>
                    <td style={{ padding: "14px 20px", fontFamily: "monospace", fontSize: "0.82rem" }}>{u.paymentRef || "—"}</td>
                    <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: "0.82rem" }}>{u.createdAt?.toDate?.()?.toLocaleDateString("en-GB") ?? "—"}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ borderRadius: 999, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 600, background: u.status === "approved" ? "#dcfce7" : u.status === "pending" ? "#fef9c3" : "#fee2e2", color: u.status === "approved" ? "#166534" : u.status === "pending" ? "#854d0e" : "#991b1b" }}>
                        {u.status === "approved" ? "✅ Approved" : u.status === "pending" ? "⏳ Pending" : "❌ Rejected"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {u.isAdmin ? <span style={{ color: "#FFD700", fontWeight: 700 }}>👑 Admin</span> : (
                        <>
                          {u.status === "pending" && <><button style={{ background: "#00843D", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer", marginRight: 6 }} onClick={() => updateUserStatus(u.id, "approved")}>✅ Approve</button><button style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer" }} onClick={() => updateUserStatus(u.id, "rejected")}>❌ Reject</button></>}
                          {u.status === "approved" && <button style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer" }} onClick={() => updateUserStatus(u.id, "rejected")}>🚫 Revoke</button>}
                          {u.status === "rejected" && <button style={{ background: "#00843D", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer" }} onClick={() => updateUserStatus(u.id, "approved")}>↩️ Re-Approve</button>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "generating") return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,42,18,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, textAlign: "center", padding: 24 }}>
      <div style={{ width: 72, height: 72, border: "5px solid rgba(255,215,0,0.2)", borderTop: "5px solid #FFD700", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 28 }} />
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", color: "white", marginBottom: 8 }}>Analyzing Past Questions</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", maxWidth: 380, textAlign: "center" }}>AI is scanning 37 years of WAEC &amp; NECO data for <strong style={{ color: "#FFD700" }}>{selectedSubject?.name}</strong>…</p>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6 }}>
        {LOADING_STEPS.map((step, i) => (
          <div key={i} style={{ fontSize: "0.88rem", color: loadingStep > i ? "#86efac" : loadingStep === i ? "#FFD700" : "rgba(255,255,255,0.4)", fontWeight: loadingStep === i ? 600 : 400 }}>
            {loadingStep > i ? "✓ " : ""}{step}
          </div>
        ))}
      </div>
    </div>
  );

  if (screen === "compendium" && compendium) {
    const sections = parseSections(compendium);
    return (
      <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
        <Topbar />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ background: "linear-gradient(135deg, #005a29, #006b30)", borderRadius: 20, padding: "36px 40px", color: "white", marginBottom: 32 }}>
            <div style={{ display: "inline-block", background: "#FFD700", color: "#005a29", borderRadius: 999, padding: "5px 16px", fontSize: "0.78rem", fontWeight: 700, marginBottom: 14 }}>📋 AI-Generated Compendium • 1988–2025</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", marginBottom: 6 }}>{selectedSubject?.icon} {selectedSubject?.name}</h1>
            <p style={{ color: "rgba(255,255,255,0.75)" }}>WAEC &amp; NECO Pattern Analysis — {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
            <button style={{ background: "transparent", border: "1.5px solid #00843D", color: "#00843D", borderRadius: 10, padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }} onClick={() => setScreen("dashboard")}>← Back to Subjects</button>
            <button style={{ background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }} onClick={() => generateCompendium(selectedSubject)}>🔄 Regenerate</button>
            <button style={{ background: "transparent", border: "1.5px solid #00843D", color: "#00843D", borderRadius: 10, padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }} onClick={() => window.print()}>🖨️ Print / Save PDF</button>
          </div>
          {sections.map((sec, i) => (
            <div key={i} style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 16, padding: "28px 32px", marginBottom: 20, boxShadow: "0 4px 24px rgba(0,132,61,0.10)" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", color: "#005a29", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 36, height: 36, background: "#e6f4ec", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{sec.emoji}</span>
                {sec.label}
              </h3>
              {sec.key === "lastminute" ? (
                <div style={{ background: "linear-gradient(135deg, #fefce8, #fef9c3)", border: "1.5px solid #FFD700", borderRadius: 12, padding: "20px 24px" }}>
                  <p style={{ color: "#854d0e", fontSize: "0.88rem", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>⚡ Priority Focus — 48-Hour Countdown</p>
                  <p style={{ color: "#78350f", fontSize: "0.9rem", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{sec.content}</p>
                </div>
              ) : (
                <div style={{ color: "#1a1a1a", lineHeight: 1.9, fontSize: "0.93rem", whiteSpace: "pre-wrap" }}>{sec.content || compendium}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9F7F0" }}>
      <Topbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ background: "linear-gradient(135deg, #005a29, #006b30)", borderRadius: 20, padding: "36px 40px", color: "white", marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", marginBottom: 6 }}>Welcome, {user?.displayName?.split(" ")[0]}! 👋</h2>
            <p style={{ color: "rgba(255,255,255,0.75)" }}>Select a subject to generate your AI-powered exam compendium.</p>
          </div>
          <div style={{ background: "#FFD700", color: "#005a29", borderRadius: 999, padding: "8px 22px", fontWeight: 700, fontSize: "0.85rem" }}>✅ Access Approved</div>
        </div>
        {genError && <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 10, padding: "12px 20px", marginBottom: 24 }}>{genError}</div>}
        <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#00843D", marginBottom: 18 }}>📚 Choose a Subject</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18, marginBottom: 48 }}>
          {SUBJECTS.map(sub => (
            <div key={sub.id} style={{ background: "white", border: "1.5px solid #d1fae5", borderRadius: 16, padding: "26px 20px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 4px 24px rgba(0,132,61,0.10)" }}>
              <div style={{ fontSize: "2.2rem" }}>{sub.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{sub.name}</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>1988–2025 • WAEC &amp; NECO</div>
              </div>
              <button style={{ background: "#00843D", color: "white", border: "none", borderRadius: 10, padding: "10px 0", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", width: "100%" }} onClick={() => generateCompendium(sub)}>✨ Generate Compendium</button>
            </div>
          ))}
        </div>
        {history.length > 0 && <>
          <div style={{ height: 1, background: "#d1fae5", margin: "32px 0" }} />
          <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#00843D", marginBottom: 18 }}>🕓 Previously Generated</p>
          <div style={{ background: "white", border: "1px solid #d1fae5", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,132,61,0.10)" }}>
            {history.map((h, i) => (
              <div key={i} onClick={() => generateCompendium(h)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderBottom: i < history.length - 1 ? "1px solid #f0fdf4" : "none", cursor: "pointer", borderRadius: 8 }}>
                <span style={{ fontSize: "1.5rem" }}>{h.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{h.name}</div>
                  <div style={{ fontSize: "0.76rem", color: "#6b7280" }}>Generated {h.generatedAt}</div>
                </div>
                <span style={{ marginLeft: "auto", color: "#00843D", fontSize: "0.8rem", fontWeight: 600 }}>Regenerate →</span>
              </div>
            ))}
          </div>
        </>}
      </div>
    </div>
  );
}
