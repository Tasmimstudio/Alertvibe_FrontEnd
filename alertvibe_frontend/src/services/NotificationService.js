import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebaseConfig';

const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready:', registration);

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token:', token);

        // Save token to backend
        await fetch(`${import.meta.env.VITE_API_URL}/api/alerts/save-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
    }

    return permission;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    throw error;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      resolve(payload);
    });
  });

export const showNotification = (title, options) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
};
