import { useState, useEffect } from 'react';
import { notificationService } from '../../utils/notificationService';
import { NotificationCategory } from '../../utils/types';
import Header from '../../components/header/Header';
import '../../css/Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe(updatedNotifications => {
      setNotifications(updatedNotifications);
    });

    // Initial load
    setNotifications(notificationService.getNotifications());

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const getFilteredNotifications = () => {
    if (activeCategory === 'all') {
      return notifications;
    }
    return notifications.filter(notification => notification.category === activeCategory);
  };

  const markAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case NotificationCategory.PLANT:
        return '🌿';
      case NotificationCategory.WEATHER:
        return '🌤️';
      case NotificationCategory.SYSTEM:
        return '⚙️';
      default:
        return '📬';
    }
  };

  return (
    <div className="notifications-container">
      <Header />
      <div className="notifications-header">
        <h1>Notifications</h1>
        {notifications.length > 0 && (
          <button className="mark-all-read" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notification-filters">
        <button
          className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {Object.values(NotificationCategory).map(category => (
          <button
            key={category}
            className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {getCategoryIcon(category)} {category}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {getFilteredNotifications().length === 0 ? (
          <p className="empty-state">
            No notifications at the moment. We'll notify you about plant care reminders and updates!
          </p>
        ) : (
          getFilteredNotifications().map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="notification-icon">
                {notification.icon || getCategoryIcon(notification.category)}
              </div>
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
              </div>
              {!notification.read && <div className="unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;
