# ExamEdge NG — Complete Setup Guide
## From Zero to Live in 7 Steps

---

## ✅ BEFORE YOU START — What You Need
- A Gmail account (this becomes your admin account)
- A GitHub account (free) → https://github.com
- A Vercel account (free) → https://vercel.com (sign up with GitHub)
- A Firebase account (free) → https://console.firebase.google.com (sign in with Gmail)
- An Anthropic API key → https://console.anthropic.com

---

## STEP 1 — Create Your Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `examedge-ng` → Continue
4. Disable Google Analytics (not needed) → **Create project**
5. Wait for it to finish → Click **Continue**

---

## STEP 2 — Enable Google Sign-In

1. In Firebase Console → click **Authentication** (left sidebar)
2. Click **"Get started"**
3. Click **"Google"** under Sign-in providers
4. Toggle **Enable** to ON
5. Set your **Project support email** to your Gmail
6. Click **Save**

---

## STEP 3 — Create Firestore Database

1. In Firebase Console → click **Firestore Database** (left sidebar)
2. Click **"Create database"**
3. Choose **"Start in test mode"** → Next
4. Select a location (e.g., `europe-west1` for Nigeria) → **Enable**
5. Wait for database to be created

### Add Security Rules:
1. Click the **Rules** tab
2. Delete the existing content
3. Paste the full contents of `firestore.rules` from this project
4. Click **Publish**

---

## STEP 4 — Get Your Firebase Config Keys

1. In Firebase Console → click the **gear icon** (⚙️) → **Project settings**
2. Scroll down to **"Your apps"**
3. Click **"Add app"** → choose the **Web** icon (`</>`)
4. App nickname: `ExamEdge NG Web` → Click **Register app**
5. You will see a `firebaseConfig` object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "examedge-ng.firebaseapp.com",
  projectId: "examedge-ng",
  storageBucket: "examedge-ng.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Copy each value — you'll need them in Step 6.

---

## STEP 5 — Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Click **API Keys** in the sidebar
3. Click **"Create Key"**
4. Name it: `examedge-ng`
5. Copy the key (starts with `sk-ant-...`) — you only see it once!

---

## STEP 6 — Set Up the Project Files

1. Download or clone the project files
2. Open the file `src/AuthContext.jsx`
3. Find this line:
   ```javascript
   const ADMIN_EMAIL = "YOUR_GMAIL_HERE@gmail.com";
   ```
4. Replace with **your actual Gmail address**

5. Create a file called `.env.local` in the root folder:
```
REACT_APP_FIREBASE_API_KEY=paste-from-step-4
REACT_APP_FIREBASE_AUTH_DOMAIN=paste-from-step-4
REACT_APP_FIREBASE_PROJECT_ID=paste-from-step-4
REACT_APP_FIREBASE_STORAGE_BUCKET=paste-from-step-4
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=paste-from-step-4
REACT_APP_FIREBASE_APP_ID=paste-from-step-4
ANTHROPIC_API_KEY=paste-from-step-5
REACT_APP_ADMIN_EMAIL=your-gmail@gmail.com
```

---

## STEP 7 — Deploy to Vercel

### Option A: Via GitHub (Recommended)

1. Push your project to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial ExamEdge NG deployment"
   git remote add origin https://github.com/YOUR_USERNAME/examedge-ng.git
   git push -u origin main
   ```

2. Go to https://vercel.com → **New Project**
3. Import your GitHub repository
4. Click **Environment Variables** → Add each variable from your `.env.local` file one by one
5. Click **Deploy**

### Option B: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```
When prompted, add your environment variables.

---

## STEP 8 — Add Your Domain to Firebase Auth

After Vercel gives you your URL (e.g., `https://examedge-ng.vercel.app`):

1. Go to Firebase Console → **Authentication** → **Settings** tab
2. Under **Authorized domains** → click **Add domain**
3. Paste your Vercel URL (without `https://`)
4. Click **Add**

---

## ✅ You're Live!

Your app is now running at your Vercel URL with:
- ✅ Real Google Sign-In
- ✅ Admin dashboard showing you all registered students in real-time
- ✅ Approve/reject controls that update instantly
- ✅ Claude AI generating compendiums for approved students
- ✅ All API keys safely hidden from the public

---

## 💰 Monetization Flow

When a student pays (bank transfer, etc.):
1. They sign in with Google → see the Pending screen
2. They enter their payment reference code in the input field
3. You open your Admin Dashboard → see their name, email, and payment ref
4. Verify the payment in your bank app → click **Approve**
5. They sign in again → instantly access all 14 subjects

---

## 🔧 Common Issues

| Problem | Solution |
|---------|----------|
| "Sign-in popup blocked" | Allow popups in browser settings |
| "Firebase: Error (auth/unauthorized-domain)" | Add your Vercel URL to Firebase Auth → Authorized Domains |
| API call returns 401 | Check ANTHROPIC_API_KEY in Vercel env variables |
| Students can't load the app | Check Firebase project ID in env variables |

---

## 📞 Need Help?

If any step is unclear, share the exact error message and which step you're on.
