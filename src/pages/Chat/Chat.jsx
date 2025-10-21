import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";
import "../../css/Chat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const db = getFirestore();
const auth = getAuth();

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // ✅ Fetch conversation + messages
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    let unsubMessages;

    const fetchChat = async () => {
      try {
        setLoading(true);
        const convoRef = doc(db, "conversations", conversationId);
        const convoSnap = await getDoc(convoRef);

        if (!convoSnap.exists()) {
          console.warn("Conversation not found");
          setConversation(null);
          setLoading(false);
          return;
        }

        const convoData = convoSnap.data();
        setConversation({ id: convoSnap.id, ...convoData });

        // ✅ Determine other user
        const otherId = convoData.participants.find((id) => id !== currentUser.uid);
        if (otherId) {
          const uRef = doc(db, "users", otherId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            setOtherUser({ id: otherId, ...uSnap.data() });
          } else {
            console.warn("Other user not found in users collection");
          }
        }

        // ✅ Listen for messages in this conversation
        const msgQuery = query(
          collection(db, "conversations", conversationId, "messages"),
          orderBy("createdAt", "asc")
        );

        unsubMessages = onSnapshot(msgQuery, (snap) => {
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setMessages(loaded);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        });
      } catch (err) {
        console.error("Error fetching chat:", err);
        toast.error("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
    return () => unsubMessages && unsubMessages();
  }, [conversationId, currentUser]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!text.trim()) return;
    if (!currentUser || !conversationId) return;

    const convoRef = doc(db, "conversations", conversationId);
    const msgText = text.trim();
    setText("");

    try {
      // ensure conversation exists
      const convoSnap = await getDoc(convoRef);
      if (!convoSnap.exists()) {
        await setDoc(convoRef, {
          participants: conversationId.split("_"),
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });
      }

      // ✅ add message under the conversation subcollection
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        senderId: currentUser.uid,
        text: msgText,
        createdAt: serverTimestamp(),
      });

      await updateDoc(convoRef, { lastMessageAt: serverTimestamp() });
    } catch (err) {
      console.error("Send message failed:", err);
      toast.error("Failed to send message");
    }
  };

  const backClick = () => navigate(-1);

  return (
    <div className="chat-page">
      <div className="chat-wrapper">
        {/* Header */}
        <div className="chat-header">
          <button className="chat-back" onClick={() => navigate('/')} >
                   <FontAwesomeIcon icon={faArrowLeft}  />
          </button>
          <div className="chat-person">
            <img
              className="chat-avatar"
              src={otherUser?.photoURL || "/default-avatar.png"}
              alt="avatar"
            />
            <div className="chat-meta">
              <div className="chat-name">{otherUser?.displayName || "User"}</div>
              <div className="chat-status">
                {otherUser ? "Online" : "Loading..."}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="chat-body">
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">No messages yet. Say hi 👋</div>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item ${
                    msg.senderId === currentUser.uid ? "mine" : "theirs"
                  }`}
                >
                  <div className="message-bubble">{msg.text}</div>
                  <div className="message-time">
                    {msg.createdAt?.toDate
                      ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="chat-composer">
          <input
            className="composer-input"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="composer-send" onClick={sendMessage}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
