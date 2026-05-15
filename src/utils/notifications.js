// utils/notifications.js
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebaseConfig';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const API_BASE  = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Request permission, get FCM token, and save it to the backend.
// Returns the token string, or null if permission denied / not supported.
export async function setupNotifications(user) {
  if (!messaging || !('Notification' in window)) return null;

  try {
    // Register the service worker first so FCM can use it
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    // Save token to backend — backend subscribes it to the "security" FCM topic
    const idToken = await user.getIdToken();
    await fetch(`${API_BASE}/alerts/save-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ token, userId: user.uid }),
    });

    console.log('FCM token registered:', token.slice(0, 20) + '…');
    return token;
  } catch (err) {
    console.warn('FCM setup error:', err.message || err);
    return null;
  }
}

// Listen for foreground messages (app tab is open).
// callback receives { title, body, data }
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title || 'AlertVibe Alert',
      body:  payload.notification?.body  || 'Vibration detected on your motorcycle.',
      data:  payload.data || {},
    });
  });
}
