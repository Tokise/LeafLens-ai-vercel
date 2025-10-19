import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faComment,
  faShare,
  faLeaf,
  faEllipsisV,
  faRobot,
  faImage,
  faVideo,
  faSmile,
  faTimes,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/header/Header';
import '../../css/Community.css';

// Example posts for demonstration
const generateExamplePosts = (startIndex, count) => {
  const plantNames = ['Monstera Deliciosa', 'Snake Plant', 'Pothos', 'Peace Lily', 'Spider Plant', 'Fiddle Leaf Fig', 'ZZ Plant', 'Rubber Plant', 'Philodendron', 'Aloe Vera'];
  const userNames = ['GreenThumb', 'PlantLover', 'GardenGuru', 'LeafyLife', 'PlantParent'];
  const contents = [
    'Just repotted my plant! Looking healthy 🌱',
    'Check out the new growth on my plant!',
    'My plant collection is growing 💚',
    'Tips for keeping plants healthy?',
    'Beautiful new leaves this morning!',
    'Plant care schedule working great!',
    'Anyone else obsessed with plants?',
    'New plant day is the best day!',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `post-${startIndex + i}`,
    userName: userNames[Math.floor(Math.random() * userNames.length)],
    userPhotoURL: null,
    content: contents[Math.floor(Math.random() * contents.length)],
    tags: [plantNames[Math.floor(Math.random() * plantNames.length)]],
    imageUrl: null,
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 20),
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    liked: false
  }));
};

const Community = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  
  const observerRef = useRef();
  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    loadInitialPosts();
  }, []);

  const loadInitialPosts = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const initialPosts = generateExamplePosts(0, 10);
    setPosts(initialPosts);
    setPage(1);
    setHasMore(true);
    setLoading(false);
  };

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPosts = generateExamplePosts(page * 10, 10);
    
    if (newPosts.length < 10 || page >= 5) {
      setHasMore(false);
    }
    
    setPosts(prev => [...prev, ...newPosts]);
    setPage(prev => prev + 1);
    setLoading(false);
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked } 
        : post
    ));
  };

  const handleComment = (postId) => {
    toast('Comments coming soon!');
  };

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      toast.error('Please write something');
      return;
    }
    
    toast.success('Post created!');
    setShowCreateModal(false);
    setPostContent('');
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="community-container">
      <Header />
      
      {/* Create Post Section */}
      <div className="create-post-section">
        <div className="user-avatar-small">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="You" />
          ) : (
            <div className="avatar-placeholder-small">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="post-input-trigger" onClick={() => setShowCreateModal(true)}>
          What's on your mind?
        </div>
      </div>

      {/* Story Section */}
      <div className="stories-section">
        <div className="story-card create-story" onClick={() => setShowStoryModal(true)}>
          <div className="story-image">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Your story" />
            ) : (
              <div className="story-placeholder">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="create-story-btn">
            <FontAwesomeIcon icon={faPlus} />
          </div>
          <div className="story-label">Create story</div>
        </div>
        
        {/* Example stories */}
        {['PlantLover', 'GreenThumb', 'GardenGuru'].map((name, i) => (
          <div key={i} className="story-card" onClick={() => toast('Story viewing coming soon!')}>
            <div className="story-image">
              <div className="story-placeholder">{name.charAt(0)}</div>
            </div>
            <div className="story-label">{name}</div>
          </div>
        ))}
      </div>

      {/* Floating Chatbot Button */}
      <button className="floating-chatbot-btn" onClick={() => navigate('/chatbot')}>
        <FontAwesomeIcon icon={faRobot} />
      </button>

      {/* Posts Feed */}
      <div className="posts-feed">
        {posts.map((post, index) => (
          <div 
            key={post.id} 
            className="post-card"
            ref={index === posts.length - 1 ? lastPostRef : null}
          >
            <div className="post-header">
              <div className="user-info">
                <div className="user-avatar">
                  {post.userPhotoURL ? (
                    <img src={post.userPhotoURL} alt={post.userName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {post.userName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h4>{post.userName}</h4>
                  <span className="post-time">{formatTimeAgo(post.timestamp)}</span>
                </div>
              </div>
              <button className="more-btn">
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
            </div>

            <div className="post-content">
              <p>{post.content}</p>
              {post.tags && (
                <div className="post-tags">
                  {post.tags.map((tag, i) => (
                    <span key={i} className="tag">
                      <FontAwesomeIcon icon={faLeaf} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {post.imageUrl && (
              <div className="post-image">
                <img src={post.imageUrl} alt="Plant post" />
              </div>
            )}

            <div className="post-actions">
              <button 
                className={`action-btn ${post.liked ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>{post.likes || 0}</span>
              </button>
              <button 
                className="action-btn"
                onClick={() => handleComment(post.id)}
              >
                <FontAwesomeIcon icon={faComment} />
                <span>{post.comments || 0}</span>
              </button>
              <button className="action-btn">
                <FontAwesomeIcon icon={faShare} />
              </button>
            </div>
          </div>
        ))}

        {loading && (
          <div className="loading-more">
            <div className="spinner"></div>
            <p>Loading more posts...</p>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="end-of-feed">
            <FontAwesomeIcon icon={faLeaf} />
            <p>You've reached the end!</p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create post</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <textarea
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                autoFocus
              />
              
              <div className="post-options">
                <span className="options-label">Add to your post</span>
                <div className="option-icons">
                  <button className="option-btn" onClick={() => toast('Photo upload coming soon!')}>
                    <FontAwesomeIcon icon={faImage} style={{ color: '#45bd62' }} />
                  </button>
                  <button className="option-btn" onClick={() => toast('Video upload coming soon!')}>
                    <FontAwesomeIcon icon={faVideo} style={{ color: '#f3425f' }} />
                  </button>
                  <button className="option-btn" onClick={() => toast('Emoji picker coming soon!')}>
                    <FontAwesomeIcon icon={faSmile} style={{ color: '#f7b928' }} />
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              className="post-btn" 
              onClick={handleCreatePost}
              disabled={!postContent.trim()}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showStoryModal && (
        <div className="modal-overlay" onClick={() => setShowStoryModal(false)}>
          <div className="create-story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create a story</h2>
              <button className="close-btn" onClick={() => setShowStoryModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="story-options">
              <button className="story-option" onClick={() => toast('Photo story coming soon!')}>
                <FontAwesomeIcon icon={faImage} />
                <span>Photo</span>
              </button>
              <button className="story-option" onClick={() => toast('Video story coming soon!')}>
                <FontAwesomeIcon icon={faVideo} />
                <span>Video</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;