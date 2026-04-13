# AlertVibe - Security Alert System

A real-time vibration detection and alert notification system built with React, Express, and Firebase Cloud Messaging.

## 🎯 Overview

AlertVibe monitors devices for vibration/tampering and sends instant push notifications to security personnel through a web dashboard.

### Features

- 📱 **Real-time Push Notifications** - Firebase Cloud Messaging
- 📊 **Alert Dashboard** - View and manage security alerts
- 📜 **Alert History** - Track all past incidents
- 🔔 **Browser Notifications** - Desktop/mobile push alerts
- ☁️ **Cloud Storage** - Firestore database for alert persistence
- 🚀 **RESTful API** - Easy integration with IoT devices

---

## 🏗️ Project Structure

```
Alertvibe/
├── alertvibe_backend/          # Express.js API server
│   ├── config/                 # Firebase Admin configuration
│   ├── controllers/            # Business logic
│   ├── routes/                 # API routes
│   ├── .env                    # Backend environment variables
│   ├── server.js               # Express server entry point
│   └── package.json            # Backend dependencies
│
├── alertvibe_frontend/         # React web application
│   ├── public/                 # Static files & service worker
│   ├── src/
│   │   ├── components/         # React components (Navbar)
│   │   ├── pages/              # Dashboard & AlertHistory
│   │   ├── services/           # Firebase FCM service
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # React entry point
│   ├── .env.local              # Frontend environment variables
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Frontend dependencies
│
├── FIREBASE_SETUP_GUIDE.md     # Detailed Firebase setup
├── QUICK_START.md              # Quick reference guide
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account (free tier works)
- Modern web browser (Chrome, Firefox, Edge)

### 1. Clone & Install

```bash
cd C:\Users\TO GOD BE THE GLORY\Alertvibe

# Install backend dependencies
cd alertvibe_backend
npm install

# Install frontend dependencies
cd ../alertvibe_frontend
npm install
```

✅ **Already installed!** (433 frontend packages, 205 backend packages)

### 2. Configure Firebase

Follow the **QUICK_START.md** guide or detailed **FIREBASE_SETUP_GUIDE.md**

**Summary:**
1. Create Firebase project
2. Enable Firestore & Cloud Messaging
3. Download service account key → `alertvibe_backend/serviceAccountKey.json`
4. Get web app credentials → Update `alertvibe_frontend/.env.local`
5. Update `alertvibe_frontend/public/firebase-messaging-sw.js`

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd alertvibe_backend
npm start
```
→ Runs on `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd alertvibe_frontend
npm run dev
```
→ Runs on `http://localhost:5173`

### 4. Open Application

Navigate to: `http://localhost:5173`

---

## 📡 API Endpoints

Base URL: `http://localhost:4000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/alerts` | Create new alert & send FCM notification |
| GET | `/api/alerts` | List all alerts (latest 200) |
| GET | `/api/alerts/:id` | Get specific alert by ID |
| DELETE | `/api/alerts/:id` | Delete alert |

### Example: Create Alert

```bash
curl -X POST http://localhost:4000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "sensor-001",
    "message": "Vibration detected on door sensor",
    "severity": "high",
    "meta": {
      "location": "Main entrance",
      "intensity": 7.5
    }
  }'
```

Response:
```json
{
  "id": "abc123xyz"
}
```

---

## 🛠️ Technology Stack

### Backend
- **Express.js 5.1.0** - Web framework
- **Firebase Admin SDK 13.6.0** - Server-side Firebase
- **Firestore** - NoSQL cloud database
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

### Frontend
- **React 18.2.0** - UI library
- **Vite 5.1.0** - Build tool & dev server
- **React Router 6.22.0** - Client-side routing
- **Firebase SDK 10.8.0** - Client-side Firebase
- **Tailwind CSS 3.4.1** - Utility-first CSS
- **FCM** - Push notifications

---

## 📱 How It Works

1. **Device Detection**: IoT sensor detects vibration/tampering
2. **Alert Creation**: Device sends POST request to `/api/alerts`
3. **Database Storage**: Alert saved to Firestore with timestamp
4. **Push Notification**: FCM sends notification to topic "security"
5. **Dashboard Update**: Frontend receives real-time alert
6. **User Response**: Security personnel view and acknowledge alert

```
[IoT Device] → [Backend API] → [Firestore]
                     ↓
                  [FCM] → [Web Dashboard] → [User]
```

---

## 🔐 Security Considerations

### Current Setup (Development)
⚠️ Firestore rules set to test mode - **DO NOT USE IN PRODUCTION**

### For Production

1. **Update Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alerts/{alert} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid != null;
      allow delete: if request.auth.uid != null;
    }
  }
}
```

2. **Add Authentication:**
   - Implement Firebase Authentication
   - Protect API endpoints with auth middleware
   - Validate device tokens

3. **Secure Environment Variables:**
   - Never commit `.env` or `serviceAccountKey.json`
   - Use environment-specific configs
   - Rotate secrets regularly

4. **API Security:**
   - Add rate limiting
   - Implement API key authentication
   - Use HTTPS only

---

## 🧪 Testing

### Manual Testing

1. **Test Backend:**
```bash
curl http://localhost:4000
```
Expected: `ALERTVIBE Backend running`

2. **Create Test Alert:**
```bash
curl -X POST http://localhost:4000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test","message":"Test alert"}'
```

3. **Verify Frontend:**
   - Open http://localhost:5173
   - Check browser console for errors
   - Allow notifications when prompted
   - Verify alert appears in history

### Browser Console Checks

✅ `Service Worker registered`
✅ `FCM token: <token>`
✅ No Firebase config errors

---

## 🐛 Troubleshooting

### Backend Issues

**Error: Cannot find module './serviceAccountKey.json'**
- Ensure file exists in `alertvibe_backend/`
- Check file name is exactly `serviceAccountKey.json`

**Port 4000 already in use:**
```bash
# Change PORT in .env
PORT=5000
```

### Frontend Issues

**Firebase config errors:**
- Verify all 7 values in `.env.local`
- Check VAPID key is correct
- Ensure no typos in environment variable names

**No notifications received:**
- Click "Allow" for browser notifications
- Check browser console for FCM errors
- Verify service worker registered successfully

**CORS errors:**
- Backend CORS is enabled by default
- Check `VITE_API_URL` in `.env.local`

---

## 📚 Documentation

- **QUICK_START.md** - Fast setup checklist
- **FIREBASE_SETUP_GUIDE.md** - Detailed Firebase configuration
- **README.md** - This file

---

## 🔄 Development Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
```

### Frontend
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 📝 Environment Variables

### Backend (`.env`)
```env
PORT=4000
FIREBASE_SA_PATH=./serviceAccountKey.json
BACKEND_SECRET=your-secret-key
```

### Frontend (`.env.local`)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_API_URL=http://localhost:4000
```

---

## 🚀 Deployment

### Backend Deployment

1. **Platform Options:** Heroku, Railway, Render, Google Cloud Run
2. **Environment Variables:** Set all vars from `.env`
3. **Service Account:** Upload `serviceAccountKey.json` securely
4. **Start Command:** `npm start`

### Frontend Deployment

1. **Build:**
```bash
npm run build
```

2. **Platform Options:** Vercel, Netlify, Firebase Hosting
3. **Environment Variables:** Set all `VITE_*` vars
4. **Update:** `VITE_API_URL` to production backend URL

---

## 🤝 Contributing

This is a personal project. Feel free to fork and customize for your needs.

---

## 📄 License

ISC License

---

## 🆘 Support

**Having issues?**
1. Check the troubleshooting section above
2. Review FIREBASE_SETUP_GUIDE.md
3. Check browser console for errors
4. Verify all environment variables are set

---

## 🎉 Next Steps

- [ ] Set up Firebase project
- [ ] Configure environment variables
- [ ] Test alert creation
- [ ] Test push notifications
- [ ] Add authentication
- [ ] Deploy to production
- [ ] Connect IoT devices

---

**Built with ❤️ for security monitoring**
