import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebaseConfig';

function getMessagingInstance() {
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

    // Explicitly register the Firebase messaging service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    const messaging = getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // Save token to backend — backend subscribes it to "security" FCM topic
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/alerts/save-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      console.log('FCM token saved:', token.slice(0, 20) + '…');
      return token;
    }
    return null;
  } catch (error) {
    console.warn('Notification setup error:', error.message || error);
    return null;
  }
};

// Listen for foreground messages (when app tab is open and focused).
// Returns a promise that resolves once with the next message payload.
export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessagingInstance();
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
