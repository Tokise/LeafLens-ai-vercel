import { useState, useEffect } from "react";
import { notificationService } from "../../utils/notificationService";
import { NotificationCategory } from "../../utils/types";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";
import "../../css/Notification.css";
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

// === Initialize Firebase instances ===
const db = getFirestore();
const auth = getAuth();

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  // Load & subscribe to notificationService updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updated) => {
      setNotifications(updated);
    });

    setNotifications(notificationService.getNotifications());
    return () => unsubscribe();
  }, []);

  const getFilteredNotifications = () => {
    if (activeCategory === "all") return notifications;
    return notifications.filter((n) => n.category === activeCategory);
  };

  const markAsRead = (id) => notificationService.markAsRead(id);
  const markAllAsRead = () => notificationService.markAllAsRead();

  const getCategoryIcon = (category) => {
    switch (category) {
      case NotificationCategory.PLANT:
        return "🌿";
      case NotificationCategory.WEATHER:
        return "🌤️";
      case NotificationCategory.SYSTEM:
        return "⚙️";
      default:
        return "📬";
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
          className={`filter-btn ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        {Object.values(NotificationCategory).map((category) => (
          <button
            key={category}
            className={`filter-btn ${activeCategory === category ? "active" : ""}`}
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
          getFilteredNotifications().map((n) => (
            <div
              key={n.id}
              className={`notification-item ${n.read ? "read" : "unread"}`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="notification-icon">{n.icon || getCategoryIcon(n.category)}</div>
              <div className="notification-content">
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <span className="notification-time">
                  {new Date(n.timestamp).toLocaleString()}
                </span>
              </div>
              {!n.read && <div className="unread-dot" />}
            </div>
          ))
        )}
      </div>

      {/* 🔥 Friend Requests Section */}
      <FriendRequestNotifications />
    </div>
  );
};

// === 🧩 Friend Request Notification Component ===
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

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setRequests(list.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
    });

    return () => unsub();
  }, [currentUser]);

  // ✅ Accept Request
  const acceptFriendRequest = async (notif) => {
    try {
      const friendPair = [currentUser.uid, notif.fromUserId].sort();
      const friendDocId = friendPair.join("_");

      // 1️⃣ Create unified friend doc
      await setDoc(doc(db, "friends", friendDocId), {
        participants: friendPair,
        userId: currentUser.uid,
        friendId: notif.fromUserId,
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Notify requester
      await addDoc(collection(db, "notifications"), {
        userId: notif.fromUserId,
        fromUserId: currentUser.uid,
        type: "friend_accept",
        title: `${currentUser.displayName || "A user"} accepted your friend request!`,
        message: "You are now friends!",
        timestamp: serverTimestamp(),
        read: false,
      });

      // 3️⃣ Create chat room
      const chatId = friendPair.join("_");
      await setDoc(doc(db, "conversations", chatId), {
        participants: friendPair,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });

      // 4️⃣ Mark handled
      await updateDoc(doc(db, "notifications", notif.id), {
        handled: true,
        read: true,
      });

      alert("✅ Friend request accepted!");
      setRequests((prev) => prev.map((r) => (r.id === notif.id ? { ...r, handled: true } : r)));
    } catch (err) {
      console.error("Error accepting friend request:", err);
      alert("Failed to accept friend request.");
    }
  };

  // ❌ Reject Request
  const rejectFriendRequest = async (notif) => {
    try {
      await updateDoc(doc(db, "notifications", notif.id), {
        handled: true,
        read: true,
      });
      alert("Friend request rejected.");
      setRequests((prev) => prev.map((r) => (r.id === notif.id ? { ...r, handled: true } : r)));
    } catch (err) {
      console.error("Error rejecting friend request:", err);
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
                disabled={notif.handled}
                onClick={(e) => {
                  e.stopPropagation();
                  acceptFriendRequest(notif);
                }}
              >
                Accept
              </button>
              <button
                className="reject-btn"
                disabled={notif.handled}
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
