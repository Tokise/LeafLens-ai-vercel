// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

function sanitizeVapidKey(value) {
  if (!value) return value;
  let v = String(value).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  v = v.replace(/\s+/g, '');
  v = v.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return v;
}

// Your web app's Firebase configuration (loaded from environment variables)
// Define these in .env.local or your deployment environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug Firebase configuration in development
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
    appId: firebaseConfig.appId ? '***' + firebaseConfig.appId.slice(-4) : 'MISSING',
    measurementId: firebaseConfig.measurementId || 'MISSING'
  });
}

// Validate required Firebase configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);
if (missingConfig.length > 0) {
  console.error('Missing Firebase configuration:', missingConfig);
  throw new Error(`Missing required Firebase configuration: ${missingConfig.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

// Function to request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = sanitizeVapidKey(import.meta.env.VITE_FIREBASE_VAPID_KEY);
      if (!vapidKey || typeof vapidKey !== 'string' || vapidKey.length < 50) {
        throw new Error('Missing or invalid VITE_FIREBASE_VAPID_KEY. Use the Web Push public key from Firebase Cloud Messaging → Web configuration.');
      }

      let registration = null;
      if ('serviceWorker' in navigator) {
        try {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
          await navigator.serviceWorker.ready;
        } catch (e) {
          console.warn('Service worker registration failed:', e);
        }
      }

      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration || undefined
      });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        return currentToken;
      }
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export default app;
