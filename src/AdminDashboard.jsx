// ============================================================
//  AdminDashboard.jsx — Real-time user management via Firestore
// ============================================================

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

export default function AdminDashboard({ onSignOut }) {
  const { user } = useAuth();
  const [users, setUsers]   = useState([]);
  const [filter, setFilter] = useState("all");

  // ── Real-time listener on Firestore users collection ───────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort: pending first, then by date
      data.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return 0;
      });
      setUsers(data);
    });
    return unsub;
  }, []);

  const updateStatus = async (uid, status) => {
    await updateDoc(doc(db, "users", uid), { status, updatedAt: serverTimestamp() });
  };

  const filtered = filter === "all" ? users : users.filter(u => u.status === filter);
  const counts   = {
    pending:  users.filter(u => u.status === "pending").length,
    approved: users.filter(u => u.status === "approved").length,
    rejected: users.filter(u => u.status === "rejected").length,
  };

  return (
    <div className="admin-wrap">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-sub">Manage student registrations and grant access in real-time</p>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "Pending",  count: counts.pending,  color: "#854d0e", bg: "#fef9c3", border: "#fde047" },
          { label: "Approved", count: counts.approved, color: "#166534", bg: "#dcfce7", border: "#86efac" },
          { label: "Rejected", count: counts.rejected, color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
          { label: "Total",    count: users.length,    color: "#1e3a5f", bg: "#eff6ff", border: "#93c5fd" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "16px 24px", flex: 1, minWidth: 120, textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontFamily: "'Playfair Display', serif", fontWeight: 900, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "0.78rem", color: s.color, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Alert */}
      {counts.pending > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.2rem" }}>🔔</span>
          <span style={{ color: "#854d0e", fontWeight: 600, fontSize: "0.9rem" }}>
            {counts.pending} student{counts.pending > 1 ? "s" : ""} waiting for your approval
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              background: filter === f ? "var(--green)" : "white",
              color: filter === f ? "white" : "var(--muted)",
              border: `1px solid ${filter === f ? "var(--green)" : "var(--border)"}`,
              borderRadius: 8, padding: "6px 16px", fontSize: "0.82rem",
              fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              fontFamily: "'DM Sans', sans-serif",
            }}>
            {f === "all" ? `All (${users.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Payment Ref</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {u.photoURL
                      ? <img src={u.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                      : <div className="avatar">{u.name?.[0] ?? "?"}</div>
                    }
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ color: "#4b5563", fontSize: "0.85rem" }}>{u.email}</td>
                <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: u.paymentRef ? "#166534" : "#9ca3af" }}>
                  {u.paymentRef || "—"}
                </td>
                <td style={{ color: "#6b7280", fontSize: "0.82rem" }}>
                  {u.createdAt?.toDate?.()?.toLocaleDateString("en-GB") ?? "—"}
                </td>
                <td>
                  <span className={`status-badge status-${u.status}`}>
                    {u.status === "pending" ? "⏳ Pending" : u.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                  </span>
                </td>
                <td>
                  {u.isAdmin ? (
                    <span style={{ color: "#FFD700", fontSize: "0.82rem", fontWeight: 700 }}>👑 Admin</span>
                  ) : (
                    <>
                      {u.status === "pending" && <>
                        <button className="btn-approve" onClick={() => updateStatus(u.id, "approved")}>✅ Approve</button>
                        <button className="btn-reject"  onClick={() => updateStatus(u.id, "rejected")}>❌ Reject</button>
                      </>}
                      {u.status === "approved" && (
                        <button className="btn-revoke" onClick={() => updateStatus(u.id, "rejected")}>🚫 Revoke</button>
                      )}
                      {u.status === "rejected" && (
                        <button className="btn-approve" onClick={() => updateStatus(u.id, "approved")}>↩️ Re-Approve</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
