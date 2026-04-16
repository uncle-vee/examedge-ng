// ============================================================
//  AuthContext.jsx — Google OAuth + Firestore Access Control
//  Handles: sign-in, sign-out, access status checks
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, provider } from "./firebase";

// ── Your Gmail — this account always gets Admin access ───────
const ADMIN_EMAIL = "Veekthormichael@gmail.com"; // Admin account

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);   // Firebase user object
  const [userRecord,  setUserRecord]  = useState(null);   // Firestore record { status, name, ... }
  const [loading,     setLoading]     = useState(true);
  const [authError,   setAuthError]   = useState("");

  // ── Listen to Firebase auth state changes ──────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await syncUserRecord(firebaseUser);
      } else {
        setUser(null);
        setUserRecord(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Create or fetch user record in Firestore ───────────────
  const syncUserRecord = async (firebaseUser) => {
    const isAdmin = firebaseUser.email === ADMIN_EMAIL;
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // New user — create a pending record
      const newRecord = {
        uid:       firebaseUser.uid,
        name:      firebaseUser.displayName,
        email:     firebaseUser.email,
        photoURL:  firebaseUser.photoURL,
        status:    isAdmin ? "approved" : "pending",
        isAdmin,
        paymentRef: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, newRecord);
      setUserRecord(newRecord);
    } else {
      const record = snap.data();
      // Always keep admin approved
      if (isAdmin && record.status !== "approved") {
        await setDoc(ref, { status: "approved", isAdmin: true }, { merge: true });
        setUserRecord({ ...record, status: "approved", isAdmin: true });
      } else {
        setUserRecord(record);
      }
    }
  };

  // ── Sign in with Google popup ──────────────────────────────
  const signInWithGoogle = async () => {
    setAuthError("");
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged handles the rest
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setAuthError("Sign-in failed. Please try again.");
        console.error(err);
      }
    }
  };

  // ── Sign out ───────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setUserRecord(null);
  };

  const isAdmin    = userRecord?.isAdmin || user?.email === ADMIN_EMAIL;
  const isApproved = userRecord?.status === "approved";
  const isPending  = userRecord?.status === "pending";
  const isRejected = userRecord?.status === "rejected";

  return (
    <AuthContext.Provider value={{
      user, userRecord, loading, authError,
      isAdmin, isApproved, isPending, isRejected,
      signInWithGoogle, signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
