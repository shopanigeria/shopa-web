import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialise Firebase when all required config values are present.
// On portals that don't have Firebase env vars (admin/superadmin), this
// returns null and all notification functions become silent no-ops.
const isConfigured = !!(
  firebaseConfig.projectId &&
  firebaseConfig.apiKey &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!app) return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    return await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
  } catch (error) {
    console.warn('Push notification setup failed:', error);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: unknown) => void) => {
  if (!app || typeof window === 'undefined') return;
  isSupported().then(supported => {
    if (!supported || !app) return;
    const messaging = getMessaging(app);
    onMessage(messaging, callback);
  });
};

export default app;
