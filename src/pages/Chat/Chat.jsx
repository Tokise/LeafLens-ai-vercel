import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPaperPlane,
  faImage,
  faEllipsisV,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from '../../firebase/firebase';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import '../../css/Chat.css';

const Chat = () => {
  const { userId } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOtherUserInfo();
    loadMessages();
  }, [userId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const loadOtherUserInfo = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setOtherUser({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadMessages = () => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('participants', 'array-contains', user.uid),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          // Only show messages between current user and the other user
          if (
            (data.senderId === user.uid && data.receiverId === userId) ||
            (data.senderId === userId && data.receiverId === user.uid)
          ) {
            msgs.push({ id: doc.id, ...data });
          }
        });
        setMessages(msgs);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: userId,
        participants: [user.uid, userId],
        content: inputMessage,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update conversation
      await updateConversation();

      setInputMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const updateConversation = async () => {
    try {
      const conversationId = [user.uid, userId].sort().join('_');
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        await updateDoc(conversationRef, {
          lastMessage: inputMessage,
          lastMessageTime: serverTimestamp()
        });
      } else {
        // Create new conversation
        await addDoc(collection(db, 'conversations'), {
          id: conversationId,
          participants: [user.uid, userId],
          lastMessage: inputMessage,
          lastMessageTime: serverTimestamp(),
          otherUserId: userId,
          otherUserName: otherUser?.name || 'Unknown',
          otherUserPhoto: otherUser?.photoURL || null
        });
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <div className="chat-user-info">
          <div className="chat-avatar">
            {otherUser?.photoURL ? (
              <img src={otherUser.photoURL} alt={otherUser.name} />
            ) : (
              <div className="avatar-placeholder">
                {otherUser?.name?.charAt(0) || '?'}
              </div>
            )}
            {otherUser?.isOnline && (
              <div className="online-status">
                <FontAwesomeIcon icon={faCircle} />
              </div>
            )}
          </div>
          <div className="user-details">
            <h3>{otherUser?.name || 'Loading...'}</h3>
            <span className="status-text">
              {otherUser?.isOnline ? 'Active now' : 'Offline'}
            </span>
          </div>
        </div>

        <button className="options-btn">
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">👋</div>
            <h4>Start a conversation</h4>
            <p>Say hello to {otherUser?.name || 'your new friend'}!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.senderId === user.uid ? 'sent' : 'received'}`}
            >
              <div className="message-bubble">
                <p>{message.content}</p>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <button className="attach-btn">
          <FontAwesomeIcon icon={faImage} />
        </button>
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          maxLength={1000}
          disabled={sending}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!inputMessage.trim() || sending}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
};

export default Chat;