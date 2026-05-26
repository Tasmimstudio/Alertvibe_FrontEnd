# AlertVibe — UI User Manual

A step-by-step guide on how to use the AlertVibe web application.

**Live App:** https://alertvibefrontend-ochre.vercel.app

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Alert History](#3-alert-history)
4. [My Devices](#4-my-devices)
5. [Profile](#5-profile)
6. [How It Works](#6-how-it-works)
7. [Security Dashboard](#7-security-dashboard-security--admin)
8. [Security Alert Log](#8-security-alert-log-security--admin)
9. [Admin Dashboard](#9-admin-dashboard-admin-only)
10. [Push Notifications](#10-push-notifications)
11. [User Roles](#11-user-roles)

---

## 1. Getting Started

### Register an Account

1. Go to the app and click **Register**
2. Fill in your name, email, and password
3. Click **Create Account**
4. You will be logged in automatically

### Log In

1. Enter your email and password
2. Click **Login**
3. You will be taken to the Dashboard

### Log Out

- **Desktop:** Click the **Log Out** button in the left sidebar
- **Mobile:** Tap the **Logout** button in the bottom navigation bar

---

## 2. Dashboard

The Dashboard is the main screen of AlertVibe. It shows your motorcycle's live alert status.

### Tabs

| Tab | What it shows |
|---|---|
| **Last Alert** | The most recent alert(s) received in the last 10 minutes |
| **Motorcycle Info** | Your registered motorcycle details and photo |
| **WiFi Config** | Update the device's WiFi credentials remotely |

### Alert Cards

Each alert card shows:
- **Severity badge** — LIGHT (green), MODERATE (yellow), or STRONG (red)
- **Message** — description of the vibration detected
- **Time** — how long ago the alert was received
- **Pulse count** — number of vibration pulses detected

### Connection Status

A chip at the top shows whether the app is connected to the backend:
- **Connected** (green) — live data is flowing
- **Disconnected** (red) — backend may be sleeping (Render free tier)

### WiFi Config Tab

Use this to update your device's WiFi credentials without reflashing:
1. Click the **WiFi Config** tab
2. Enter the new SSID and password
3. Click **Save**
4. The device will pick up the new credentials on its next boot

---

## 3. Alert History

View the full log of all past alerts for your motorcycle.

**How to access:**
- **Desktop:** Click **Full Alert Log** in the left sidebar
- **Mobile:** Tap the **Alerts** bell icon in the bottom nav

### Features

- Shows all alerts sorted by newest first
- Each row shows: time, device, severity, message, pulse count
- **Severity badges** are color-coded:
  - 🟢 **LIGHT** — gentle vibration
  - 🟡 **MODERATE** — noticeable shaking
  - 🔴 **STRONG** — possible tampering
- Tap any row to see full details
- **Pagination** — navigate through pages of alerts

---

## 4. My Devices

Register and manage your motorcycles.

**How to access:**
- **Desktop:** Click **Manage Motorcycles** in the left sidebar
- **Mobile:** Tap the **Motorcycles** icon in the bottom nav

### Register a Motorcycle

1. Click **Register New Motorcycle**
2. Fill in:
   - **Plate Number** — your motorcycle's license plate
   - **Model** — make and model (e.g. Honda Click 125i)
   - **Device ID** — the ID programmed into your sensor (e.g. `motorcycle-01`)
   - **Photo** — optional photo of your motorcycle
3. Click **Register**

### Managing Your Motorcycle

- **Edit** — update plate, model, or photo
- **Activate / Deactivate** — toggle monitoring on or off
- The status badge shows **Active** (green) or **Inactive** (gray)

---

## 5. Profile

View and update your personal information.

**How to access:** Click your profile photo/avatar in the top-right corner

### What You Can Update

- Display name
- Profile photo
- Password (via reset email)

---

## 6. How It Works

A built-in tutorial explaining the AlertVibe system.

**How to access:**
- **Desktop:** Click **How It Works** in the left sidebar (above Log Out)
- **Mobile:** Tap the **?** Guide button in the bottom nav

### What It Covers

- System flow (sensor → server → notification → dashboard)
- Alert levels (Light / Moderate / Strong)
- LED indicator guide
- Hardware components
- How to test the sensor
- Frequently asked questions

---

## 7. Security Dashboard *(Security & Admin only)*

A real-time dashboard for security personnel monitoring all registered motorcycles.

**How to access:** Navigate to `/security` or use the Security link (visible to security and admin roles only)

### Features

- Live feed of all incoming alerts across all devices
- Alert count by severity
- Respond to alerts — mark them as handled
- Overview of all registered motorcycles and their status

---

## 8. Security Alert Log *(Security & Admin only)*

Full alert history across all users and devices.

**How to access:** Navigate to `/security/alerts`

### Features

- Filter alerts by severity, device, or date
- Mark alerts as responded
- Color-coded severity badges
- Pagination for large alert logs

---

## 9. Admin Dashboard *(Admin only)*

Full system management panel.

**How to access:** Navigate to `/admin`

### Tabs

#### Users Tab
Manage all registered users:
- View user name, email, role, and status
- Click the **⋯** menu on any user to:
  - **Deactivate / Activate** — block or restore access
  - **Reset Password** — send a password reset email
  - **Delete** — permanently remove the user

#### Motorcycles Tab
View all motorcycles registered in the system:
- See plate number, model, owner, device ID, and status
- Monitor which devices are active

#### Alerts Tab
View and manage all alerts system-wide:
- Filter by severity or device
- Mark alerts as responded
- Delete old alerts

### Stats Overview
The top of the Admin Dashboard shows summary cards:
- Total users
- Total motorcycles
- Total alerts
- Alerts by severity

---

## 10. Push Notifications

AlertVibe sends browser push notifications when a vibration alert is detected.

### Enable Notifications

1. When you first log in, the browser will ask for notification permission
2. Click **Allow**
3. You will now receive alerts even when the app is in the background or closed

### Notification Content

Each push notification shows:
- Alert severity (Light / Moderate / Strong)
- Device ID
- Short description of the vibration detected

### If You Missed the Permission Prompt

1. Click the **lock icon** in your browser's address bar
2. Find **Notifications** and set it to **Allow**
3. Refresh the page

---

## 11. User Roles

| Role | What They Can Access |
|---|---|
| **User** | Dashboard, own motorcycles, own alert history, profile |
| **Security** | Everything a User can access + Security Dashboard + Security Alert Log |
| **Admin** | Everything + Admin Dashboard (user management, all data) |

Roles are assigned by an Admin. Contact your system administrator to request a role change.

---

## Alert Severity Reference

| Severity | Color | Meaning |
|---|---|---|
| **LIGHT** | 🟢 Green | 1–2 vibration pulses. Gentle touch, wind, or passing vehicle. |
| **MODERATE** | 🟡 Yellow | 3–5 pulses. Noticeable shaking. Possible tampering. |
| **STRONG** | 🔴 Red | 6+ pulses. Repeated strong vibration. Immediate action recommended. |

---

## Tips

- The backend is hosted on Render's free tier and may take **up to 30 seconds** to wake up after inactivity. If alerts are slow to appear, wait a moment and try again.
- Make sure your browser **notifications are allowed** so you receive real-time push alerts.
- Keep your motorcycle's **device ID** matching the `DEVICE_ID` programmed into the sensor firmware.
- Use the **WiFi Config** tab on the Dashboard to update device WiFi remotely — no reflashing needed.

---

*AlertVibe — Real-time Motorcycle Security System*
