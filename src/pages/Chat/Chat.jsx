import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import "../../css/Chat.css";
import toast from "react-hot-toast";
import { db } from "../../firebase/firebase";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // 🔽 Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // 🔁 Fetch and listen for friend's status (fixed unsubscribe)
  useEffect(() => {
    if (!conversationId) return;

    let unsubFriend; // Store unsubscribe callback

    const fetchChat = async () => {
      try {
        const chatRef = doc(db, "conversations", conversationId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const friendId = chatData.participants.find(
            (id) => id !== currentUser.uid
          );

          // Real-time listener for friend's user document
          const friendRef = doc(db, "users", friendId);
          unsubFriend = onSnapshot(friendRef, (snap) => {
            if (snap.exists()) {
              setFriend({ id: friendId, ...snap.data() });
            }
          });
        } else {
          toast.error("Chat not found");
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
        toast.error("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChat();

    return () => {
      if (unsubFriend) unsubFriend();
    };
  }, [conversationId, currentUser]);

  // 🔁 Listen for messages
  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("timestamp")
    );

    const unsubMessages = onSnapshot(q, (snapshot) =>
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => unsubMessages();
  }, [conversationId]);

  // 📨 Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        text: input.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      setInput("");
    } catch (error) {
      console.error("Send message failed:", error);
      toast.error("Failed to send message");
    }
  };

  // 🧠 Format status text
  const formatStatus = (friend) => {
    if (!friend) return "";
    if (friend.isOnline) return "🟢 Online";

    const ts = friend.lastSeen?.toDate?.();
    if (!ts) return "Offline";

    const diff = Date.now() - ts.getTime();
    if (diff < 60000) return "Last seen just now";
    if (diff < 3600000)
      return `Last seen ${Math.floor(diff / 60000)} min ago`;
    return `Last seen at ${ts.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="chat-page">
      <div className="chat-wrapper">
        {/* HEADER */}
        <div className="chat-header">
          <button className="chat-back" onClick={() => navigate("/messages")}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>

          {friend && (
            <div
              className="chat-user"
              onClick={() => navigate(`/profile/${friend.id}`)}
            >
              <div className="avatar-wrapper">
                <img
                  src={friend.photoURL || "/default-avatar.png"}
                  alt={friend.displayName}
                  className="chat-avatar"
                />
                {friend.isOnline && <div className="online-dot"></div>}
              </div>

              <div className="chat-meta">
                <div className="chat-name">{friend.displayName}</div>
                <div className="chat-status">{formatStatus(friend)}</div>
              </div>
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="chat-body">
          {loading ? (
            <p className="chat-loading">Loading chat...</p>
          ) : messages.length === 0 ? (
            <p className="chat-empty">No messages yet. Say hi 👋</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-item ${
                  msg.senderId === currentUser.uid ? "mine" : "theirs"
                }`}
              >
                <div className="message-bubble">{msg.text}</div>
                <div className="message-time">
                  {msg.timestamp?.toDate
                    ? msg.timestamp.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {/* COMPOSER */}
        <form className="chat-composer" onSubmit={sendMessage}>
          <input
            type="text"
            className="composer-input"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="composer-send">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
