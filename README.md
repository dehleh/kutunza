# Kutunza Gourmet

Food ordering & event catering platform — mobile apps for customers, web dashboard for admins.

## Stack

| Layer | Tech |
|-------|------|
| **Mobile App** (iOS & Android) | React Native · Expo SDK 52 |
| **Admin Dashboard** (Web) | React 18 · Vite 5 |
| **Backend API** | Node.js · Express 4.18 |
| **Database / Auth** | Firebase Firestore · Firebase Auth |
| **Payments** | Paystack |

## Project Structure

```
kutunza/
├── mobile/              # Customer mobile app (Expo / React Native)
│   ├── App.js
│   └── src/
│       ├── screens/     # Menu, Cart, Checkout, Orders, Events, Auth, Profile
│       ├── components/  # MenuCard, BowlPicker
│       ├── context/     # Auth, Cart providers
│       ├── navigation/  # Bottom tabs + stacks
│       ├── api.js       # Axios client
│       ├── firebase.js  # Firebase init (AsyncStorage persistence)
│       ├── data.js      # Default menu, bowl sizes, event types
│       └── theme.js     # Colours, fonts, shared styles
│
├── admin/               # Admin web dashboard (React + Vite)
│   └── src/
│       ├── pages/       # Login, Orders, Menu, Events, Users, Settings
│       ├── App.jsx      # Auth gate + sidebar layout + router
│       ├── api.js       # All admin API calls
│       ├── firebase.js  # Admin auth (email/password only)
│       └── theme.css    # Dark burgundy/gold design
│
├── backend/             # REST API (Express)
│   ├── server.js
│   ├── firebase.js      # Firebase Admin SDK
│   ├── middleware/
│   │   └── auth.js      # requireAuth, requireAdmin, optionalAuth
│   └── routes/
│       ├── auth.js      # Register, login, profile, admin management
│       ├── orders.js    # CRUD + admin status updates
│       ├── payments.js  # Paystack init, verify, webhook, refund
│       ├── menu.js      # Category & item CRUD (admin)
│       ├── events.js    # Event bookings + admin status updates
│       └── settings.js  # Delivery fee, min order
│
├── firestore.rules
└── firestore.indexes.json
```

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in Firebase + Paystack keys
npm install
npm run dev             # http://localhost:4000
```

### 2. Admin Dashboard

```bash
cd admin
cp .env.example .env   # fill in Firebase config + VITE_API_URL
npm install
npm run dev             # http://localhost:5174
```

### 3. Mobile App

```bash
cd mobile
cp .env.example .env   # fill in Firebase config
npm install
npx expo start          # scan QR with Expo Go, or press i/a for simulator
```

## Environment Variables

See `.env.example` in each folder. Key variables:

- **Backend**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `PAYSTACK_SECRET_KEY`
- **Admin**: `VITE_FB_API_KEY`, `VITE_FB_PROJECT_ID`, `VITE_API_URL`
- **Mobile**: `EXPO_PUBLIC_FB_API_KEY`, `EXPO_PUBLIC_FB_PROJECT_ID`, `EXPO_PUBLIC_API_URL`

## Admin Access

1. Register a user account via the mobile app
2. Use Firebase Console or the backend bootstrap endpoint to grant admin role
3. Log in to the admin dashboard at `http://localhost:5174`
