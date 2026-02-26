# 🍛 Kutunza Gourmet — Setup Guide
## From Zero to Live in ~30 minutes

---

## STEP 1 — Firebase Setup (10 mins)

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it `kutunza-gourmet`
3. Disable Google Analytics (optional) → **Create project**

### 1.2 Enable Authentication
1. Left sidebar → **Authentication** → **Get started**
2. **Sign-in method** tab → Enable these providers:
   - ✅ **Email/Password**
   - ✅ **Google**
3. Click Save

### 1.3 Create Firestore Database
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → Select region: `europe-west1` (closest to Lagos)
3. After creating, go to **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /orders/{orderId} {
        allow read: if request.auth != null && request.auth.uid == userId;
      }
    }
    // Orders — owner or admin can read
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         exists(/databases/$(database)/documents/admins/$(request.auth.uid)));
    }
    // Menu is public read
    match /menu/{catId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    // Admins collection
    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 1.4 Get Frontend Config
1. ⚙️ Project Settings → **Your apps** → Click **</>** (Web)
2. Register app name: `kutunza-web`
3. Copy the `firebaseConfig` object

### 1.5 Get Backend Service Account
1. ⚙️ Project Settings → **Service accounts**
2. Click **Generate new private key** → Download JSON
3. Save as `backend/firebase-service-account.json`

---

## STEP 2 — Paystack Setup (5 mins)

1. Go to https://dashboard.paystack.com → Sign up / Log in
2. **Settings** → **API Keys & Webhooks**
3. Copy your **Test Secret Key** and **Test Public Key**
4. Set webhook URL: `https://your-backend-url.com/api/payments/webhook`

---

## STEP 3 — Backend Setup

```bash
cd backend
npm install

# Copy env file
cp .env.example .env

# Edit .env and fill in:
# FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
# PAYSTACK_SECRET_KEY=sk_test_xxx
# PAYSTACK_PUBLIC_KEY=pk_test_xxx
# FRONTEND_URL=http://localhost:5173

# Start development server
npm run dev
# → Running on http://localhost:4000
```

---

## STEP 4 — Frontend Setup

```bash
cd frontend
npm install

# Copy env file
cp .env.example .env

# Edit .env and fill in Firebase config + Paystack public key:
# VITE_FIREBASE_API_KEY=AIzaSy...
# VITE_FIREBASE_AUTH_DOMAIN=kutunza-gourmet.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=kutunza-gourmet
# VITE_FIREBASE_STORAGE_BUCKET=kutunza-gourmet.appspot.com
# VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
# VITE_FIREBASE_APP_ID=1:123456789:web:abc
# VITE_API_URL=http://localhost:4000/api
# VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Start dev server
npm run dev
# → Running on http://localhost:5173
```

---

## STEP 5 — Make Yourself Admin

After creating your account in the app:

1. Go to Firebase Console → Firestore → **admins** collection
2. Add document: Document ID = your Firebase UID
3. Add field: `grantedAt` = current timestamp

To find your UID: Firebase Console → Authentication → Users → copy the User UID

---

## STEP 6 — Seed Menu to Database (Optional)

After logging in as admin, open browser console and run:
```js
// This seeds the DEFAULT_MENU to Firestore so admins can edit it live
fetch('/api/menu/seed', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + await firebase.auth().currentUser.getIdToken()
  },
  body: JSON.stringify({ categories: DEFAULT_MENU })
})
```

---

## STEP 7 — Deploy to Production

### Backend → Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
# (same as your .env file)
```

### Frontend → Vercel
```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel

# Set environment variables in Vercel dashboard
# Update VITE_API_URL to your Railway backend URL
```

---

## Firestore Collections Structure

```
firestore/
├── admins/
│   └── {uid}                    ← admin users
├── menu/
│   └── {catId}                  ← menu categories with items array
├── orders/
│   └── {orderId}                ← all orders
│       ├── orderId: "KTZ-..."
│       ├── userId: "firebase-uid"
│       ├── customer: { name, phone, email }
│       ├── cart: [{ name, qty, finalPrice, bowlSize }]
│       ├── status: "pending|confirmed|preparing|out_for_delivery|delivered"
│       ├── paymentStatus: "pending|paid|failed"
│       ├── paystackReference: "xxx"
│       ├── total: 15000
│       └── timeline: [{ status, timestamp, note }]
├── users/
│   └── {uid}
│       ├── name, email, phone, address
│       └── orders/              ← user's order references
└── payments/
    └── {auto-id}               ← payment event logs
```

---

## Going Live Checklist

- [ ] Switch Paystack from **test** keys to **live** keys
- [ ] Update Firebase Auth authorized domains to include your production URL
- [ ] Set `NODE_ENV=production` on backend
- [ ] Update CORS origins in `server.js` to your production frontend URL
- [ ] Set Paystack webhook URL to production backend URL
- [ ] Test a full order flow end-to-end

---

## Support & Contacts
- Firebase docs: https://firebase.google.com/docs
- Paystack docs: https://paystack.com/docs
- Paystack Nigeria support: support@paystack.com
