/* ============================================================
   PeakForm — Firebase integration (OPTIONAL, for production)
   ------------------------------------------------------------
   The app ships working out-of-the-box with an in-memory `store`
   (see index.html). To persist data per-user, drop this file in,
   add the SDK <script> tags below to index.html, and replace the
   in-memory `store` shim with `cloudStore`.

   1. In index.html <head>, add:
      <script type="module" src="firebase-config.example.js"></script>

   2. Replace the `store` object in index.html with `cloudStore`.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⬇️ Replace with your own Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "peakform.firebaseapp.com",
  projectId: "peakform",
  storageBucket: "peakform.appspot.com",
  messagingSenderId: "0000000000",
  appId: "1:0000000000:web:abcdef"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let uid = null;

/* Architected for multi-user: every user gets users/{uid} document.
   Single-user today, scales to many tomorrow — no schema change. */
export const cloudStore = {
  async load() {
    if (!uid) return null;
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data().state : null;
  },
  async save(state) {
    if (!uid) return;
    await setDoc(doc(db, "users", uid),
      { state, updatedAt: serverTimestamp() }, { merge: true });
  }
};

export function watchAuth(onSignedIn, onSignedOut) {
  onAuthStateChanged(auth, (user) => {
    uid = user?.uid || null;
    user ? onSignedIn(user) : onSignedOut();
  });
}
export const login  = () => signInWithPopup(auth, new GoogleAuthProvider());
export const logout = () => signOut(auth);

/* Suggested Firestore rules (console → Firestore → Rules):

   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null
                            && request.auth.uid == userId;
       }
     }
   }
*/
