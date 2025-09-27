// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
// Note: This file is served statically from /public and cannot read import.meta.env
// Using public Firebase config here is safe and required for messaging to work in the SW
const firebaseConfig = {
  apiKey: "AIzaSyCsRq2o6SmhEi7zPREDvOZiqb4T1WyImUQ",
  authDomain: "leaflens-ai-a12c1.firebaseapp.com",
  projectId: "leaflens-ai-a12c1",
  storageBucket: "leaflens-ai-a12c1.firebasestorage.app",
  messagingSenderId: "106730528970",
  appId: "1:106730528970:web:06b7ae34743c3a90c61433",
  measurementId: "G-WR56KPVNTH"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.PNG',
        badge: '/logo.PNG',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Ensure fast activation and control
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));