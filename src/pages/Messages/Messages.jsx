import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEllipsisV, faCircle } from '@fortawesome/free-solid-svg-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, orderBy, getDocs, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import app from '../../firebase/firebase';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/header/Header';
import '../../css/Messages.css';

const Messages = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    try {
      // First, get all users to create sample conversations
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const allUsers = [];
      
      usersSnapshot.forEach(doc => {
        if (doc.id !== user.uid) {
          allUsers.push({ id: doc.id, ...doc.data() });
        }
      });

      // Listen to conversations
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.uid),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const convos = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          convos.push({ 
            id: doc.id, 
            ...data,
            otherUserId: data.participants?.find(id => id !== user.uid) || null
          });
        });
        
        // If no conversations, show all users as potential conversations
        if (convos.length === 0 && allUsers.length > 0) {
          const potentialConvos = allUsers.slice(0, 5).map((otherUser, index) => ({
            id: `potential-${otherUser.id}`,
            otherUserId: otherUser.id,
            otherUserName: otherUser.displayName || otherUser.email?.split('@')[0] || 'User',
            otherUserPhoto: otherUser.photoURL || null,
            lastMessage: 'Start a conversation',
            lastMessageTime: null,
            isOnline: Math.random() > 0.5,
            unread: false
          }));
          setConversations(potentialConvos);
        } else {
          setConversations(convos);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(convo =>
    convo.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messages-container">
      <Header />
      
      <div className="search-bar">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="conversations-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Start a conversation with other plant lovers!</p>
          </div>
        ) : (
          filteredConversations.map((convo) => (
            <div
              key={convo.id}
              className={`conversation-item ${convo.unread ? 'unread' : ''}`}
              onClick={() => navigate(`/chat/${convo.otherUserId}`)}
            >
              <div className="conversation-avatar">
                {convo.otherUserPhoto ? (
                  <img src={convo.otherUserPhoto} alt={convo.otherUserName} />
                ) : (
                  <div className="avatar-placeholder">
                    {convo.otherUserName?.charAt(0) || '?'}
                  </div>
                )}
                {convo.isOnline && (
                  <div className="online-indicator">
                    <FontAwesomeIcon icon={faCircle} />
                  </div>
                )}
              </div>

              <div className="conversation-content">
                <div className="conversation-header">
                  <h4>{convo.otherUserName || 'Unknown User'}</h4>
                  <span className="conversation-time">{formatTime(convo.lastMessageTime)}</span>
                </div>
                <div className="conversation-preview">
                  <p>{convo.lastMessage || 'No messages yet'}</p>
                  {convo.unread && (
                    <div className="unread-badge">{convo.unreadCount || 1}</div>
                  )}
                </div>
              </div>

              <button className="conversation-options" onClick={(e) => {
                e.stopPropagation();
              }}>
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;