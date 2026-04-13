# AlertVibe - Firebase Setup Guide

This guide will help you configure Firebase for your AlertVibe application.

## Prerequisites

- A Google account
- Internet connection

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter project name: `AlertVibe` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional for this project)
6. Click **Create project**
7. Wait for setup to complete, then click **Continue**

---

## Step 2: Enable Cloud Firestore

1. In Firebase Console, click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose your Cloud Firestore location (select closest to you)
5. Click **"Enable"**

**Security Rules (for production, update later):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alerts/{alert} {
      allow read, write: if true; // Change this in production!
    }
  }
}
```

---

## Step 3: Enable Cloud Messaging

1. In Firebase Console, click the **gear icon** ⚙️ → **Project settings**
2. Go to **"Cloud Messaging"** tab
3. Under **"Cloud Messaging API (Legacy)"**, note if it's enabled
4. Scroll to **"Web Push certificates"**
5. Click **"Generate key pair"**
6. **COPY THIS KEY** - you'll need it as `VITE_FIREBASE_VAPID_KEY`

---

## Step 4: Register Web App

1. In Firebase Console → Project Overview
2. Click the **web icon** `</>` to add a web app
3. Enter nickname: `AlertVibe Web`
4. Check **"Also set up Firebase Hosting"** (optional)
5. Click **"Register app"**
6. You'll see the Firebase configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                    // ← VITE_FIREBASE_API_KEY
  authDomain: "your-app.firebaseapp.com", // ← VITE_FIREBASE_AUTH_DOMAIN
  projectId: "your-project-id",           // ← VITE_FIREBASE_PROJECT_ID
  storageBucket: "your-app.appspot.com",  // ← VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",         // ← VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123...:web:abc..."            // ← VITE_FIREBASE_APP_ID
};
```

**KEEP THIS WINDOW OPEN** - you'll need these values!

---

## Step 5: Download Service Account Key (Backend)

1. In Firebase Console, click **gear icon** ⚙️ → **Project settings**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** in the confirmation dialog
5. A JSON file will download (e.g., `alertvibe-abc123-firebase-adminsdk-xyz.json`)
6. **RENAME this file to:** `serviceAccountKey.json`
7. **MOVE it to:** `C:\Users\TO GOD BE THE GLORY\Alertvibe\alertvibe_backend\serviceAccountKey.json`

⚠️ **IMPORTANT:** Keep this file SECRET! Add it to `.gitignore`

---

## Step 6: Configure Frontend (.env.local)

1. Open: `C:\Users\TO GOD BE THE GLORY\Alertvibe\alertvibe_frontend\.env.local`
2. Replace the placeholder values with your Firebase config from Step 4:

```env
VITE_FIREBASE_API_KEY=<your-api-key-from-step-4>
VITE_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
VITE_FIREBASE_VAPID_KEY=<your-vapid-key-from-step-3>
VITE_API_URL=http://localhost:4000
```

3. Save the file

---

## Step 7: Update Service Worker

1. Open: `C:\Users\TO GOD BE THE GLORY\Alertvibe\alertvibe_frontend\public\firebase-messaging-sw.js`
2. Update lines 3-9 with your Firebase config (same values as Step 6):

```javascript
firebase.initializeApp({
  apiKey: "<your-api-key>",
  authDomain: "<your-auth-domain>",
  projectId: "<your-project-id>",
  storageBucket: "<your-storage-bucket>",
  messagingSenderId: "<your-sender-id>",
  appId: "<your-app-id>"
});
```

3. Save the file

---

## Step 8: Verify Configuration

### Backend Check:
```bash
cd C:\Users\TO GOD BE THE GLORY\Alertvibe\alertvibe_backend
dir serviceAccountKey.json
```
✅ File should exist

### Frontend Check:
```bash
cd C:\Users\TO GOD BE THE GLORY\Alertvibe\alertvibe_frontend
type .env.local
```
✅ Should show your Firebase credentials (not placeholders)

---

## Step 9: Start the Application

### Terminal 1 - Start Backend:
```bash
cd C:\Users\TO GOD BE THE GLORY\Alertvibe\alertvibe_backend
npm start
```
Expected output: `Server listening on 4000`

### Terminal 2 - Start Frontend:
```bash
cd C:\Users\TO GOD BE THE GLORY\Alertvibe\alertvibe_frontend
npm run dev
```
Expected output: `Local: http://localhost:5173/`

### Open Browser:
Navigate to: http://localhost:5173

---

## Step 10: Test Push Notifications

1. In the browser, you should see a prompt to allow notifications
2. Click **"Allow"**
3. Open browser console (F12)
4. You should see: `Service Worker registered`

### Test Alert Creation:

Use a tool like Postman or curl to create a test alert:

```bash
curl -X POST http://localhost:4000/api/alerts ^
  -H "Content-Type: application/json" ^
  -d "{\"deviceId\":\"test-device-1\",\"message\":\"Test vibration alert\",\"severity\":\"high\"}"
```

You should receive a push notification!

---

## Troubleshooting

### Issue: "Failed to register service worker"
- Check that firebase config in `firebase-messaging-sw.js` is correct
- Check browser console for specific errors

### Issue: "FCM send failed"
- Verify VAPID key is correct
- Check that Cloud Messaging API is enabled in Firebase Console

### Issue: "Cannot find module './serviceAccountKey.json'"
- Verify the file exists in backend root directory
- Check file name is exactly `serviceAccountKey.json`

### Issue: "No notification received"
- Make sure you clicked "Allow" for browser notifications
- Check that the frontend subscribed to FCM token
- Verify backend sends to topic "security"

---

## Security Notes

### For Production:

1. **Update Firestore Rules:**
   ```
   match /alerts/{alert} {
     allow read: if request.auth != null;
     allow create: if request.auth != null;
   }
   ```

2. **Update .env.local:**
   - Change `VITE_API_URL` to your production backend URL

3. **Add API Key Restrictions:**
   - In Firebase Console → Credentials
   - Restrict API keys to specific domains/IPs

4. **Never commit:**
   - `serviceAccountKey.json`
   - `.env.local`
   - Add both to `.gitignore`

---

## Next Steps

Once everything is working:

1. ✅ Test alert creation from dashboard
2. ✅ Verify alerts appear in history
3. ✅ Test push notifications
4. ✅ Configure production deployment
5. ✅ Set up proper authentication
6. ✅ Update security rules

---

## Need Help?

Common resources:
- [Firebase Documentation](https://firebase.google.com/docs)
- [FCM Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)

---

**Setup completed? Start building your security alert system! 🚀**
