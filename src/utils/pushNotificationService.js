import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { notificationService, NotificationType } from './notificationService';

function sanitizeVapidKey(value) {
    if (!value) return value;
    // Trim, remove surrounding quotes, remove whitespace/newlines
    let v = String(value).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
    }
    v = v.replace(/\s+/g, '');
    // Convert to Base64URL (replace +/ with -_ and drop padding)
    v = v.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return v;
}

class PushNotificationService {
    constructor() {
        this.messaging = null;
        this.token = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Get messaging instance
            const messaging = getMessaging();
            this.messaging = messaging;

            // Request permission and get token
            const permission = await notificationService.requestPushPermission();
            if (permission) {
                await this.updateToken();
                this.setupMessageListener();
                this.initialized = true;
            }
        } catch (error) {
            console.error('Error initializing push notifications:', error);
            throw error;
        }
    }

    async updateToken() {
        try {
            const vapidKey = sanitizeVapidKey(import.meta.env.VITE_FIREBASE_VAPID_KEY);
            if (!vapidKey || typeof vapidKey !== 'string' || vapidKey.length < 50) {
                throw new Error('Missing or invalid VITE_FIREBASE_VAPID_KEY. Set the Web Push certificate public key from Firebase → Cloud Messaging → Web configuration.');
            }
            // Ensure service worker is registered for FCM
            let registration = null;
            if ('serviceWorker' in navigator) {
                try {
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
                    await navigator.serviceWorker.ready;
                } catch (e) {
                    console.warn('Service worker registration failed:', e);
                }
            }

            const currentToken = await getToken(this.messaging, {
                vapidKey,
                serviceWorkerRegistration: registration || undefined
            });

            if (currentToken) {
                this.token = currentToken;
                // Here you would typically send the token to your backend
                await this.sendTokenToServer(currentToken);
            } else {
                console.log('No registration token available.');
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
    }

    async sendTokenToServer(token) {
        // TODO: Implement sending token to your backend
        console.log('Would send token to server:', token);
    }

    setupMessageListener() {
        onMessage(this.messaging, (payload) => {
            console.log('Message received:', payload);
            
            // Create a notification using our notification service
            notificationService.addNotification({
                type: NotificationType.PUSH,
                title: payload.notification.title,
                message: payload.notification.body,
                icon: payload.notification.icon || '🔔',
                data: payload.data
            });
        });
    }
}

// Export a singleton instance
export const pushNotificationService = new PushNotificationService();