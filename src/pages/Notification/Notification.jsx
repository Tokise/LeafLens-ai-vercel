import { useState, useEffect } from 'react';
import { notificationService } from '../../utils/notificationService';
import { NotificationCategory } from '../../utils/types';
import Header from '../../components/header/Header';
import '../../css/Notification.css';

// === 🔥 NEW FIREBASE IMPORTS FOR FRIEND REQUEST NOTIFICATIONS ===
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  setDoc,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import React from "react";
import Navbar from '../../components/navbar/Navbar';

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
      <Navbar />
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

      {/* 🔥 Friend Request Notifications Section */}
      <FriendRequestNotifications />
    </div>
  );
};

// === 🔥 ENHANCEMENT: Friend Request Notifications Component ===
const db = getFirestore();
const auth = getAuth();

const FriendRequestNotifications = () => {
  const [requests, setRequests] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      where("type", "in", ["friend_request", "friend_accept"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(list.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
    });

    return () => unsubscribe();
  }, [currentUser]);

  const acceptFriendRequest = async (notif) => {
    try {
      // 1️⃣ Add both users as friends
      await addDoc(collection(db, "friends"), {
        userId: currentUser.uid,
        friendId: notif.fromUserId,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "friends"), {
        userId: notif.fromUserId,
        friendId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Send a notification back
      await addDoc(collection(db, "notifications"), {
        userId: notif.fromUserId,
        type: "friend_accept",
        title: `${currentUser.displayName || "A user"} accepted your friend request!`,
        message: "You can now chat together.",
        timestamp: serverTimestamp(),
        read: false,
      });

      // 3️⃣ Create a chat between them
      const chatId = [currentUser.uid, notif.fromUserId].sort().join("_");
      await setDoc(doc(db, "conversations", chatId), {
        participants: [currentUser.uid, notif.fromUserId],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });

      // 4️⃣ Mark notification handled
      await updateDoc(doc(db, "notifications", notif.id), { handled: true });
      alert("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const rejectFriendRequest = async (notif) => {
    try {
      await updateDoc(doc(db, "notifications", notif.id), { handled: true });
      alert("Friend request rejected.");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  if (!requests.length) return null;

  return (
    <div className="friend-requests-section">
      <h2 className="friend-requests-title">Friend Requests</h2>
      {requests.map((notif) => (
        <div key={notif.id} className={`friend-request-item ${notif.handled ? "read" : "unread"}`}>
          <div className="friend-request-info">
            <strong>{notif.title}</strong>
            <p>{notif.message}</p>
          </div>
          {!notif.handled && notif.type === "friend_request" && (
            <div className="friend-request-actions">
              <button
                className="accept-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  acceptFriendRequest(notif);
                }}
              >
                Accept
              </button>
              <button
                className="reject-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  rejectFriendRequest(notif);
                }}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Notification;
