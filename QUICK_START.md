# AlertVibe - Quick Start Checklist

## 🔥 Firebase Console Setup (Do Once)

### 1. Create Project
- Go to: https://console.firebase.google.com/
- Click "Add project" → Name it "AlertVibe"
- Disable Analytics → Create

### 2. Enable Firestore
- Left sidebar → "Firestore Database"
- "Create database" → "Test mode" → Enable

### 3. Enable Cloud Messaging & Get VAPID
- Settings ⚙️ → "Cloud Messaging" tab
- Scroll to "Web Push certificates" → "Generate key pair"
- **COPY THE KEY** (starts with "B...")

### 4. Add Web App & Get Config
- Project Overview → Click web icon `</>`
- Nickname: "AlertVibe Web" → Register
- **COPY ALL CONFIG VALUES**

### 5. Download Service Account
- Settings ⚙️ → "Service accounts" tab
- "Generate new private key" → Download
- Rename to: `serviceAccountKey.json`
- Move to: `alertvibe_backend/` folder

---

## 📝 Files to Update

### File 1: `alertvibe_frontend/.env.local`
Replace these 7 values with YOUR Firebase config:
```env
VITE_FIREBASE_API_KEY=<PASTE_YOUR_API_KEY>
VITE_FIREBASE_AUTH_DOMAIN=<PASTE_YOUR_AUTH_DOMAIN>
VITE_FIREBASE_PROJECT_ID=<PASTE_YOUR_PROJECT_ID>
VITE_FIREBASE_STORAGE_BUCKET=<PASTE_YOUR_STORAGE_BUCKET>
VITE_FIREBASE_MESSAGING_SENDER_ID=<PASTE_YOUR_SENDER_ID>
VITE_FIREBASE_APP_ID=<PASTE_YOUR_APP_ID>
VITE_FIREBASE_VAPID_KEY=<PASTE_YOUR_VAPID_KEY>
```

### File 2: `alertvibe_frontend/public/firebase-messaging-sw.js`
Update lines 3-9 with the same config (no VAPID key needed here):
```javascript
firebase.initializeApp({
  apiKey: "<PASTE>",
  authDomain: "<PASTE>",
  projectId: "<PASTE>",
  storageBucket: "<PASTE>",
  messagingSenderId: "<PASTE>",
  appId: "<PASTE>"
});
```

### File 3: `alertvibe_backend/serviceAccountKey.json`
Just move the downloaded JSON file here. Don't edit it.

---

## 🚀 Start the App

### Terminal 1 - Backend:
```bash
cd alertvibe_backend
npm start
```
✅ Should see: "Server listening on 4000"

### Terminal 2 - Frontend:
```bash
cd alertvibe_frontend
npm run dev
```
✅ Should see: "Local: http://localhost:5173/"

### Browser:
- Open: http://localhost:5173
- Allow notifications when prompted
- Done! 🎉

---

## ✅ Quick Test

Test if everything works:
```bash
curl -X POST http://localhost:4000/api/alerts -H "Content-Type: application/json" -d "{\"deviceId\":\"test-1\",\"message\":\"Test alert\"}"
```

You should get a push notification!

---

## 🆘 Stuck?

1. Backend won't start? → Check `serviceAccountKey.json` exists
2. Frontend errors? → Check all 7 values in `.env.local`
3. No notifications? → Check VAPID key and browser permissions
4. See detailed guide: `FIREBASE_SETUP_GUIDE.md`

---

**That's it! You're ready to build. 🚀**
