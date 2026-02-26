# Kutunza Gourmet — Setup Guide
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
   - ✅ **Google** (optional, for mobile)
3. Click Save

### 1.3 Create Firestore Database
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → Select region: `europe-west1`
3. After creating, go to **Rules** tab and paste the contents of `firestore.rules`

### 1.4 Get Web App Config (for Admin Dashboard)
1. ⚙️ Project Settings → **Your apps** → Click **</>** (Web)
2. Register app name: `kutunza-admin`
3. Copy the `firebaseConfig` values for the admin `.env`

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

cp .env.example .env
# Edit .env:
#   FIREBASE_PROJECT_ID=kutunza-gourmet
#   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@kutunza-gourmet.iam.gserviceaccount.com
#   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
#   PAYSTACK_SECRET_KEY=sk_test_xxx
#   ADMIN_URL=http://localhost:5174

npm run dev
# → http://localhost:4000
```

---

## STEP 4 — Admin Dashboard Setup

```bash
cd admin
npm install

cp .env.example .env
# Edit .env with your Firebase web config:
#   VITE_FB_API_KEY=AIzaSy...
#   VITE_FB_AUTH_DOMAIN=kutunza-gourmet.firebaseapp.com
#   VITE_FB_PROJECT_ID=kutunza-gourmet
#   VITE_FB_STORAGE_BUCKET=kutunza-gourmet.appspot.com
#   VITE_FB_MESSAGING_SENDER_ID=123456789
#   VITE_FB_APP_ID=1:123456789:web:abc
#   VITE_API_URL=http://localhost:4000/api

npm run dev
# → http://localhost:5174
```

---

## STEP 5 — Mobile App Setup

```bash
cd mobile
npm install

cp .env.example .env
# Edit .env with your Firebase config:
#   EXPO_PUBLIC_FB_API_KEY=AIzaSy...
#   EXPO_PUBLIC_FB_AUTH_DOMAIN=kutunza-gourmet.firebaseapp.com
#   EXPO_PUBLIC_FB_PROJECT_ID=kutunza-gourmet
#   EXPO_PUBLIC_FB_STORAGE_BUCKET=kutunza-gourmet.appspot.com
#   EXPO_PUBLIC_FB_MESSAGING_SENDER_ID=123456789
#   EXPO_PUBLIC_FB_APP_ID=1:123456789:web:abc
#   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:4000/api
#   EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx

npx expo start
# Scan QR with Expo Go, or press i (iOS) / a (Android)
```

> **Note**: For the API URL on physical devices, use your computer's local IP (e.g. `192.168.1.x`), not `localhost`.

---

## STEP 6 — Make Yourself Admin

After creating your account in the mobile app:

1. Go to Firebase Console → Firestore → **admins** collection
2. Add document: Document ID = your Firebase UID
3. Add field: `grantedAt` = current timestamp

To find your UID: Firebase Console → Authentication → Users → copy the User UID

Then log in to the admin dashboard at `http://localhost:5174`

---

## STEP 7 — Seed Menu to Database

After logging in to the admin dashboard:
1. Navigate to the **Menu** page
2. Click **Seed Default Menu** button
3. The default menu categories and items will be populated in Firestore

Or via the mobile app — the default menu is bundled and will show even without seeding.

---

## STEP 8 — Deploy to Production

### Backend → Railway
```bash
npm i -g @railway/cli
railway login
cd backend
railway init
railway up
# Set env vars in Railway dashboard
```

### Admin Dashboard → Vercel
```bash
npm i -g vercel
cd admin
vercel
# Set env vars in Vercel dashboard
# Update VITE_API_URL to your Railway backend URL
```

### Mobile App → Expo EAS Build
```bash
npm i -g eas-cli
cd mobile
eas login
eas build:configure
eas build --platform all
# Submit to stores:
eas submit --platform ios
eas submit --platform android
```

---

## Firestore Collections

```
firestore/
├── admins/{uid}                 ← admin users
├── menu/{catId}                 ← categories with items array
├── orders/{orderId}             ← all orders
│   ├── orderId, userId, customer { name, phone, email }
│   ├── cart [{ name, qty, finalPrice, bowlSize }]
│   ├── status: pending → confirmed → preparing → out_for_delivery → delivered
│   ├── paymentStatus: pending | paid | failed
│   └── timeline [{ status, timestamp, note }]
├── events/{eventId}             ← event/catering bookings
├── users/{uid}                  ← user profiles
├── payments/{auto-id}           ← payment event logs
└── settings/config              ← delivery fee, min order
```

---

## Going Live Checklist

- [ ] Switch Paystack from **test** keys to **live** keys
- [ ] Update Firebase Auth authorized domains for production
- [ ] Set `NODE_ENV=production` on backend
- [ ] Update CORS origins in `server.js` with production admin URL
- [ ] Set Paystack webhook URL to production backend
- [ ] Build and submit mobile apps via EAS
- [ ] Test full order flow end-to-end on real devices
