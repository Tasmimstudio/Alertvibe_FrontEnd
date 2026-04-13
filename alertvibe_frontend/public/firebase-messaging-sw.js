// Firebase Messaging Service Worker
// Handles background push notifications from AlertVibe

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Your Firebase config — must match your .env.local values
firebase.initializeApp({
  apiKey:            "AIzaSyBHgmMopQ4QhZPpevtyL4cprl7pAlEbC_k",
  authDomain:        "alertvibe-d6892.firebaseapp.com",
  projectId:         "alertvibe-d6892",
  storageBucket:     "alertvibe-d6892.firebasestorage.app",
  messagingSenderId: "83770294258",
  appId:             "1:83770294258:web:fe00464a7fdfd512fbf56b"
});

const messaging = firebase.messaging();

// Handle background notifications (when browser tab is closed or hidden)
messaging.onBackgroundMessage((payload) => {
  console.log('Background notification received:', payload);

  const title = payload.notification?.title || 'AlertVibe - Vibration Detected!';
  const body  = payload.notification?.body  || 'Possible tampering detected on your device.';

  const options = {
    body:    body,
    icon:    '/favicon.ico',
    badge:   '/favicon.ico',
    vibrate: [200, 100, 200],   // Vibrate pattern on mobile
    data:    payload.data || {},
    actions: [
      { action: 'view',    title: 'View Alert' },
      { action: 'dismiss', title: 'Dismiss'    }
    ]
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open the AlertVibe dashboard when notification is clicked
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
