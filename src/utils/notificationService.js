import { toast } from 'react-hot-toast';
import { NotificationType, NotificationCategory } from './types';

class NotificationService {
    constructor() {
        this.currentUserId = 'guest';
        const saved = localStorage.getItem(this.#storageKey());
        this.notifications = saved ? JSON.parse(saved).map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
        })) : [];
        this.subscribers = new Set();
    }

    #storageKey() {
        return `notifications:${this.currentUserId}`;
    }

    setUser(userId) {
        this.currentUserId = userId || 'guest';
        const saved = localStorage.getItem(this.#storageKey());
        this.notifications = saved ? JSON.parse(saved).map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
        })) : [];
        this.notifySubscribers();
    }

    clear() {
        this.notifications = [];
        this.notifySubscribers();
    }

    // Add a new notification
    addNotification(notification) {
        // Optional de-duplication by key: if caller supplies a stable key, skip duplicates
        if (notification.key) {
            const exists = this.notifications.some(n => n.key === notification.key && n.title === notification.title && n.message === notification.message);
            if (exists) {
                return null;
            }
        }
        const newNotification = {
            id: Date.now(),
            timestamp: new Date(),
            read: false,
            ...notification
        };

        // Add to in-app notifications
        if (notification.type === NotificationType.IN_APP || notification.type === NotificationType.PUSH) {
            this.notifications.unshift(newNotification);
            this.notifySubscribers();
        }

        // Show toast if specified
        if (notification.type === NotificationType.TOAST) {
            toast(notification.message, {
                duration: 5000
            });
        }

        return newNotification;
    }

    // Get all notifications
    getNotifications() {
        return this.notifications;
    }

    // Get notifications by category
    getNotificationsByCategory(category) {
        return this.notifications.filter(notif => notif.category === category);
    }

    // Mark a notification as read
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.notifySubscribers();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.notifySubscribers();
    }

    // Subscribe to notifications updates
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Notify all subscribers of updates
    notifySubscribers() {
        try {
            localStorage.setItem(this.#storageKey(), JSON.stringify(this.notifications));
        } catch (e) {
            // ignore persistence errors
        }
        this.subscribers.forEach(callback => callback(this.notifications));
    }

    // Request push notification permission
    async requestPushPermission() {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Create a plant saved notification
    createPlantSavedNotification(plantName) {
        return this.addNotification({
            type: NotificationType.IN_APP,
            category: NotificationCategory.PLANT,
            title: 'Plant Saved',
            message: `${plantName} has been added to your favorites`,
            icon: '🌿'
        });
    }

    // Create a weather update notification
    createWeatherNotification(weatherData) {
        return this.addNotification({
            type: NotificationType.IN_APP,
            category: NotificationCategory.WEATHER,
            title: 'Weather Update',
            message: `Current weather: ${weatherData.condition}, ${weatherData.temperature}°C`,
            icon: '🌤️',
            data: weatherData
        });
    }
}

// Export a singleton instance
export const notificationService = new NotificationService();
// Re-export types for compatibility with existing imports
export { NotificationCategory, NotificationType } from './types';