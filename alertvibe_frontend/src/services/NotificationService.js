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
    if (!('Notification' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getMessagingInstance();
    if (!messaging) return null;

    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/alerts/save-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Notification setup error:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessagingInstance();
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
