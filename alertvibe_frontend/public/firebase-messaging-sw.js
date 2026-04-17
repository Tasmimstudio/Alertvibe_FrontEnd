// Firebase Messaging Service Worker
// Handles background push notifications from AlertVibe

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Your Firebase config — must match your .env.local values
firebase.initializeApp({
  apiKey:            "AIzaSyAVjhZOvqQWwXlJZnSPJVcrUiyDlyqMQMM",
  authDomain:        "alertvibe-6f041.firebaseapp.com",
  projectId:         "alertvibe-6f041",
  storageBucket:     "alertvibe-6f041.firebasestorage.app",
  messagingSenderId: "1000081958230",
  appId:             "1:1000081958230:web:84bb95ecc86ee7b934e2f7"
});

const messaging = firebase.messaging();

// Handle background notifications (when browser tab is closed or hidden)
messaging.onBackgroundMessage((payload) => {
  console.log('Background notification received:', payload);

  const title = payload.notification?.title || 'TAMPERING ALERT - Your Motorcycle!';
  const body  = payload.notification?.body  || 'Vibration detected on your motorcycle. Check your vehicle immediately!';

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
