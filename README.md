# Kutunza Gourmet — Full Stack App

## Stack
- **Frontend**: React (Vite) — the JSX artifact
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (email/phone)
- **Payments**: Paystack

## Project Structure
```
kutunza/
├── backend/                 # Node.js/Express API
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── menu.js
│   ├── middleware/
│   │   └── auth.js
│   ├── firebase.js
│   └── package.json
│
└── frontend/                # React app (Vite)
    ├── src/
    │   ├── App.jsx           (main app - provided separately)
    │   ├── firebase.js
    │   ├── api.js
    │   └── paystack.js
    └── package.json
```
