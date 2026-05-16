# AlertVibe — Motorcycle Vibration Security System

A real-time vibration detection and alert system built with ESP32, React, Express.js, Firebase Firestore, and Firebase Cloud Messaging (FCM). When the sensor detects tampering, it instantly pushes notifications to all registered browsers and security personnel dashboards.

---

## System Architecture

```
[ESP32 + SW-40 Sensor]
        |
        | HTTP POST /api/alerts
        ↓
[Backend — Express.js on Render]
        |               |
        ↓               ↓
  [Firestore DB]    [Firebase FCM]
                        |
                        ↓
          [Browser Push Notification]
                        |
                        ↓
            [React Frontend Dashboard]
```

---

## Project Structure

```
Alertvibe/
├── alertvibe_backend/
│   ├── config/
│   │   ├── firebaseConfig.js        # Firebase Admin SDK init
│   │   └── cloudinaryConfig.js      # Cloudinary image upload
│   ├── controllers/
│   │   ├── alertController.js       # Alert CRUD + FCM send
│   │   ├── userController.js        # User profile management
│   │   ├── adminController.js       # Admin dashboard logic
│   │   └── motorcycleController.js  # Motorcycle registration
│   ├── middleware/
│   │   ├── authMiddleware.js        # Firebase token verification
│   │   └── upload.js                # Cloudinary multer config
│   ├── routes/
│   │   ├── alertRoutes.js
│   │   ├── userRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── securityRoutes.js
│   │   └── motorcycleRoutes.js
│   ├── serviceAccountKey.json       # Firebase Admin key (gitignored)
│   ├── server.js                    # Express entry point
│   ├── render.yaml                  # Render deploy config
│   └── package.json
│
├── alertvibe_frontend/
│   ├── public/
│   │   └── firebase-messaging-sw.js # FCM background service worker
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Firebase Auth context
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── AdminDashboard.jsx   # Admin panel
│   │   │   ├── SecurityDashboard.jsx
│   │   │   ├── SecurityAlertLog.jsx
│   │   │   ├── AlertHistory.jsx
│   │   │   ├── DeviceRegistration.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Registration.jsx
│   │   ├── services/
│   │   │   ├── api.js               # Backend API calls
│   │   │   └── NotificationService.js # FCM token + subscription
│   │   ├── firebaseConfig.js        # Firebase client SDK init
│   │   └── App.jsx                  # Routes + auth guards
│   ├── .env.local                   # Frontend env vars (gitignored)
│   └── package.json
│
└── esp8266_firmware/
    └── alertvibe_sensor/
        └── alertvibe_sensor.ino     # ESP32 firmware
```

---

## Hardware

### Components

| Component | Quantity |
|---|---|
| ESP32 Dev Module | 1 |
| SW-40 Vibration Sensor | 1 |
| Green LED | 1 |
| Blue LED (x2) | 2 |
| Yellow LED | 1 |
| Red LED | 1 |
| 220Ω Resistors | 5 |
| Jumper wires | — |

### Wiring

```
SW-40 VCC  → 3.3V
SW-40 GND  → GND
SW-40 DO   → GPIO4

GREEN  LED → GPIO5   (WiFi connected)
BLUE   LED → GPIO16  (Low vibration)
YELLOW LED → GPIO17  (Medium vibration)
RED    LED → GPIO18  (High / alert sent)
BLUE   LED → GPIO19  (Safe / idle)

Each LED: anode → GPIO pin through 220Ω resistor → cathode → GND
```

### Detection Levels

| Pulse Count | Level | LED |
|---|---|---|
| 2+ | Low | Blue |
| 3+ | Medium | Yellow |
| 5+ | High — alert sent | Red |
| 10+ | Critical | Red (stronger message) |

### Firmware Configuration

Open `esp8266_firmware/alertvibe_sensor/alertvibe_sensor.ino` and set:

```cpp
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL   = "https://alertvibe-backend.onrender.com/api/alerts";
const char* DEVICE_ID     = "motorcycle-01";
const char* LOCATION      = "Motorcycle";
```

### Upload to ESP32

1. Install **Arduino IDE**
2. Go to **File → Preferences** → Additional Board URLs → add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. **Tools → Board → ESP32 Dev Module**
4. **Tools → Port → COMx**
5. Click **Upload**
6. Open **Serial Monitor at 115200 baud** to watch live output

---

## Firebase Project

| Setting | Value |
|---|---|
| Project ID | `alertvibe-6f041` |
| Auth Domain | `alertvibe-6f041.firebaseapp.com` |
| Messaging Sender ID | `1000081958230` |
| App ID | `1:1000081958230:web:84bb95ecc86ee7b934e2f7` |

### Services Used

- **Firebase Authentication** — user login / registration
- **Firestore** — stores alerts, users, motorcycles, FCM tokens
- **Firebase Cloud Messaging (FCM)** — push notifications to browsers

### Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles and roles |
| `alerts` | Vibration alert records |
| `motorcycles` | Registered motorcycles |
| `fcm_tokens` | Browser FCM tokens |

---

## User Roles

| Role | Access |
|---|---|
| `user` | Dashboard, own motorcycle, own alerts |
| `security` | Security dashboard, all alerts, respond to alerts |
| `admin` | Everything — user management, all data |

Default admin account created on first startup:
```
Email:    admin@alertvibe.com
Password: admin123
```

---

## Backend

### Live URL
```
https://alertvibe-backend.onrender.com
```

### Local Setup

```bash
cd alertvibe_backend
npm install
node server.js
# Runs on http://localhost:4000
```

### Environment Variables — Local (`.env`)

```env
PORT=4000
FIREBASE_SA_PATH=./serviceAccountKey.json
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Environment Variables — Render (Production)

Set these in **render.com → your service → Environment**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | *(full JSON from serviceAccountKey.json — see below)* |
| `CLOUDINARY_CLOUD_NAME` | *(from cloudinary.com dashboard)* |
| `CLOUDINARY_API_KEY` | *(from cloudinary.com dashboard)* |
| `CLOUDINARY_API_SECRET` | *(from cloudinary.com dashboard)* |

#### FIREBASE_SERVICE_ACCOUNT_JSON value

Generate a new service account key from Firebase Console → Project Settings → Service Accounts → Generate new private key.

Paste the entire downloaded JSON as a single line (no line breaks) as the value of `FIREBASE_SERVICE_ACCOUNT_JSON` in your Render environment variables. Do **not** paste the key here or commit it to the repository.

---

## API Endpoints

Base URL: `https://alertvibe-backend.onrender.com`

### Alerts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/alerts` | None | Create alert + send FCM (called by ESP32) |
| GET | `/api/alerts` | None | List all alerts (latest 200) |
| GET | `/api/alerts/:id` | None | Get single alert |
| DELETE | `/api/alerts/:id` | None | Delete alert |
| POST | `/api/alerts/save-token` | None | Save FCM browser token |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users` | None | Create user profile after registration |
| POST | `/api/users/verify-token` | None | Verify Firebase ID token |
| GET | `/api/users/profile` | Required | Get own profile |
| PUT | `/api/users/profile` | Required | Update own profile |
| GET | `/api/users/role` | Required | Get own role |
| POST | `/api/users/create-with-role` | Admin | Create user with specific role |

### Motorcycles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/motorcycles` | Required | Register motorcycle |
| GET | `/api/motorcycles` | Required | List motorcycles |
| GET | `/api/motorcycles/:id` | Required | Get motorcycle |
| PUT | `/api/motorcycles/:id` | Required | Update motorcycle |
| DELETE | `/api/motorcycles/:id` | Required | Delete motorcycle |
| PUT | `/api/motorcycles/:id/activate` | Required | Toggle activation |
| GET | `/api/motorcycles/search` | None | Search by plate number |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/:id/role` | Admin | Change user role |
| PUT | `/api/admin/users/:id/status` | Admin | Activate/deactivate user |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/alerts` | Admin | All alerts with filters |
| PUT | `/api/admin/alerts/:id/respond` | Admin | Mark alert responded |

### Security
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/security/dashboard` | Security | Security dashboard |
| GET | `/api/security/alerts` | Security | View all alerts |
| PUT | `/api/security/alerts/:id/respond` | Security | Respond to alert |
| GET | `/api/security/motorcycles` | Security | Motorcycles with owner info |

### Test Alert (no auth required)

```bash
curl -X POST https://alertvibe-backend.onrender.com/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "motorcycle-01",
    "severity": "high",
    "message": "Strong vibration detected",
    "meta": { "location": "Motorcycle", "pulseCount": 5 }
  }'
```

---

## Frontend

### Local Setup

```bash
cd alertvibe_frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Environment Variables — Local (`.env.local`)

```env
VITE_FIREBASE_API_KEY=AIzaSyAVjhZOvqQWwXlJZnSPJVcrUiyDlyqMQMM
VITE_FIREBASE_AUTH_DOMAIN=alertvibe-6f041.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=alertvibe-6f041
VITE_FIREBASE_STORAGE_BUCKET=alertvibe-6f041.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1000081958230
VITE_FIREBASE_APP_ID=1:1000081958230:web:84bb95ecc86ee7b934e2f7
VITE_FIREBASE_VAPID_KEY=BEkJUhteSTPC_wAHi-jPxEUlxESQHkWOCykEVy6ke9WRIl3FyMtr1qSz0lFe33L-zUjPbXbAd7zOw_UaqbnEpLE
VITE_API_URL=https://alertvibe-backend.onrender.com
VITE_API_BASE_URL=https://alertvibe-backend.onrender.com/api
```

### Build for Production

```bash
npm run build
# Output in dist/ folder — deploy to Vercel, Netlify, or Firebase Hosting
```

If deploying to Vercel or Netlify, set the same `VITE_*` environment variables above in the platform dashboard.

---

## FCM Push Notification Flow

```
1. User opens app → browser requests notification permission
2. FCM generates a unique browser token
3. Token sent to POST /api/alerts/save-token
4. Backend subscribes token to "security" topic
5. ESP32 detects vibration → POST /api/alerts
6. Backend sends FCM message to topic "security"
7. Every subscribed browser receives the push notification
```

To verify FCM is working without the physical device, run the curl test command from the API section above and check if your browser receives a notification.

---

## Technology Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Express.js | 5.1.0 | Web framework |
| firebase-admin | 13.6.0 | Firestore + FCM + Auth |
| cloudinary | 1.41.3 | Image uploads |
| multer | 2.0.2 | File upload handling |
| cors | 2.8.5 | Cross-origin requests |
| morgan | 1.10.0 | HTTP request logging |
| dotenv | 17.2.3 | Environment variables |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI library |
| Vite | 5.1.0 | Build tool |
| React Router | 6.22.0 | Client routing |
| Firebase SDK | 10.8.0 | Auth + FCM client |
| Tailwind CSS | 3.4.1 | Styling |

---

## Troubleshooting

### Backend on Render

| Error | Cause | Fix |
|---|---|---|
| `Firebase credentials not found` | `FIREBASE_SERVICE_ACCOUNT_JSON` not set | Add env var on Render dashboard |
| `SyntaxError: Bad control character` | Private key has literal newlines | The code auto-fixes this — re-save the env var |
| `500 on /api/motorcycles` | Missing Firestore composite index | Fixed — results are now sorted in JS |
| `Exited with status 1` | Missing env var or wrong project key | Check Render logs for specific error |

### Frontend

| Error | Cause | Fix |
|---|---|---|
| `No FCM token` | Notifications not allowed | Click Allow when browser prompts |
| `Failed to fetch` | Backend URL wrong | Check `VITE_API_BASE_URL` in `.env.local` |
| React Router warnings | Missing future flags | Already fixed in `App.jsx` |

### ESP32

| Problem | Fix |
|---|---|
| No WiFi connection | Check SSID/password, must be 2.4GHz |
| `HTTP error: -1` | Backend URL unreachable, check URL |
| No alert on shake | Check pulse threshold — currently set to 5 |
| LED not lighting | Check GPIO pin numbers and resistor wiring |

---

## Git Repositories

| Repo | URL |
|---|---|
| Backend | `https://github.com/Tasmimstudio/Alervibe_bckend` |

Render auto-deploys every time a commit is pushed to the `main` branch of the backend repo.

---

## License

ISC License
