// firebase.js - Standalone Firebase Configuration
// NOTE: This is for standalone HTML pages. Your React app uses src/services/NotificationService.js instead.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js";

// AlertVibe Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHgmMopQ4QhZPpevtyL4cprl7pAlEbC_k",
  authDomain: "alertvibe-d6892.firebaseapp.com",
  projectId: "alertvibe-d6892",
  storageBucket: "alertvibe-d6892.firebasestorage.app",
  messagingSenderId: "83770294258",
  appId: "1:83770294258:web:fe00464a7fdfd512fbf56b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request Notification Permission
export async function requestPermission() {
  console.log("Requesting notification permission...");
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    console.log("Notification permission granted.");

    const token = await getToken(messaging, {
      vapidKey: "BLrxPRs4B8hMGrNxshjsa5MAO_8jlGpa4aZH5dNvrwcoBsxmvvRaXVcOrKqzj76_Nu_tXMicRrCFHvkV5sUEWiY"
    });

    console.log("FCM Token:", token);

    // Save token to backend
    await fetch("http://localhost:4000/api/alerts/save-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    return token;
  } else {
    console.log("Notification permission denied.");
  }
}

// Foreground message handler
onMessage(messaging, (payload) => {
  console.log("Notification received in foreground:", payload);

  // Show notification
  if (Notification.permission === "granted") {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: "/icon.png",
    });
  }
});
