// ============================================================
//  api/admin-refs.js — Save and retrieve admin reference materials
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db          = getFirestore(firebaseApp);

export default async function handler(req, res) {

  // GET — fetch all admin references
  if (req.method === "GET") {
    try {
      const snap = await getDocs(collection(db, "adminRefs"));
      const refs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ refs });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch refs" });
    }
  }

  // POST — add a new reference
  if (req.method === "POST") {
    const { name, url, description, type } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    try {
      const docRef = await addDoc(collection(db, "adminRefs"), {
        name, url: url || "", description: description || "",
        type: type || "url", createdAt: serverTimestamp(),
      });
      return res.status(200).json({ id: docRef.id, name, url, description, type });
    } catch (err) {
      return res.status(500).json({ error: "Failed to save ref" });
    }
  }

  // DELETE — remove a reference
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });
    try {
      await deleteDoc(doc(db, "adminRefs", id));
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to delete ref" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
