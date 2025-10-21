import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faComment,
  faShare,
  faEllipsisV,
  faRobot,
  faImage,
  faTimes,
  faPlus,
  faTrash,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import Header from '../../components/header/Header';
import '../../css/Community.css';
import {
  createPost,
  getPosts,
  toggleLikePost,
  createStory,
  getStories,
  deleteStory,
} from '../../firebase/community';
import Navbar from '../../components/navbar/Navbar';

const Community = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const [postContent, setPostContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [storyFile, setStoryFile] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const observerRef = useRef();

  const lastPostRef = useCallback(
    node => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) loadMorePosts();
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    loadInitialPosts();
    loadStories();
  }, []);

  const loadInitialPosts = async () => {
    setLoading(true);
    const result = await getPosts();
    if (result.success) {
      setPosts(result.posts);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } else {
      toast.error('Failed to load posts');
    }
    setLoading(false);
  };

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const result = await getPosts(lastDoc);
    if (result.success) {
      setPosts(prev => [...prev, ...result.posts]);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    }
    setLoading(false);
  };

  const loadStories = async () => {
    const result = await getStories();
    if (result.success) setStories(result.stories);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && mediaFiles.length === 0)
      return toast.error('Please write something or add media');
    setLoading(true);
    const res = await createPost(postContent, mediaFiles);
    setLoading(false);
    if (res.success) {
      toast.success('Post created!');
      setShowCreateModal(false);
      setPostContent('');
      setMediaFiles([]);
      loadInitialPosts();
    } else {
      toast.error(res.error);
    }
  };

  const handleLike = async postId => {
    const res = await toggleLikePost(postId);
    if (res.success) {
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                likes: post.likes?.includes(user.uid)
                  ? post.likes.filter(uid => uid !== user.uid)
                  : [...(post.likes || []), user.uid],
              }
            : post
        )
      );
    } else {
      toast.error('Failed to like post');
    }
  };

  const handleMediaSelect = e => {
    const files = Array.from(e.target.files);
    setMediaFiles(prev => [...prev, ...files]);
  };

  const handleStoryUpload = async () => {
    if (!storyFile) return toast.error('Select an image or video first!');
    setLoading(true);
    const res = await createStory(storyFile);
    setLoading(false);
    if (res.success) {
      toast.success('Story uploaded!');
      setShowStoryModal(false);
      setStoryFile(null);
      loadStories();
    } else {
      toast.error(res.error);
    }
  };

  const handleStoryView = story => {
    setSelectedStory(story);
    setShowStoryViewer(true);
  };

  const handleStoryDelete = async storyId => {
    const res = await deleteStory(storyId);
    if (res.success) {
      toast.success('Story deleted');
      loadStories();
    } else {
      toast.error(res.error);
    }
  };

  const formatTimeAgo = timestamp => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // SEARCH HANDLER
  const handleSearchChange = e => {
    const val = e.target.value;
    setSearchTerm(val);

    if (window.innerWidth <= 730) {
      navigate('/search');
    } else {
      setShowSearchDropdown(true);
    }
  };

  return (
    <div className="community-container">
      <Header />
      <Navbar />
      {/* Search Dropdown (Desktop only) */}
      {showSearchDropdown && searchTerm && (
        <div className="search-dropdown">
          {posts
            .filter(p =>
              p.content?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 5)
            .map(p => (
              <div key={p.id} className="search-result-item">
                <p>{p.content}</p>
              </div>
            ))}
        </div>
      )}

      {/* Create Post Input */}
      <div className="create-post-section">
        <div className="user-avatar-small">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="You" />
          ) : (
            <div className="avatar-placeholder-small">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div
          className="post-input-trigger"
          onClick={() => setShowCreateModal(true)}
        >
          What's on your mind?
        </div>
      </div>

      {/* STORIES SECTION */}
      <div className="stories-section">
        <div
          className="story-card create-story"
          onClick={() => setShowStoryModal(true)}
        >
          <div className="story-image">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Your story" />
            ) : (
              <div className="story-placeholder">
                {user?.userName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="create-story-btn">
            <FontAwesomeIcon icon={faPlus} />
          </div>
          <div className="story-label">Your Story</div>
        </div>

        {stories.map(story => (
          <div
            key={story.id}
            className="story-card"
            onClick={() => handleStoryView(story)}
          >
            <div className="story-image">
              {story.mediaType === 'image' ? (
                <img src={story.mediaUrl} alt="story preview" />
              ) : (
                <video src={story.mediaUrl} muted autoPlay loop />
              )}
            </div>
            <div className="story-overlay">
              <img
                src={story.userPhotoURL || '/default-avatar.png'}
                alt={story.userName}
                className="story-avatar-overlay"
              />
              <span className="story-label">{story.userName}</span>
            </div>
            {story.userId === user?.uid && (
              <button
                className="delete-story-btn"
                onClick={e => {
                  e.stopPropagation();
                  handleStoryDelete(story.id);
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* POSTS FEED */}
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
                      {post.userName?.[0]}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h4>{post.userName}</h4>
                  <span className="post-time">
                    {formatTimeAgo(post.timestamp)}
                  </span>
                </div>
              </div>
              <button className="more-btn">
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
            </div>

            <div className="post-content">
              <p>{post.content}</p>
              {post.media?.length > 0 && (
                <div className="media-preview">
                  {post.media.map((item, i) => (
                    <div key={i} className="media-item">
                      {item.type === 'image' ? (
                        <img src={item.url} alt="post" />
                      ) : (
                        <video src={item.url} controls />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="post-actions">
              <button
                className={`action-btn ${
                  post.likes?.includes(user.uid) ? 'liked' : ''
                }`}
                onClick={() => handleLike(post.id)}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>{post.likes?.length || 0}</span>
              </button>
              <button className="action-btn">
                <FontAwesomeIcon icon={faComment} />
              </button>
              <button className="action-btn">
                <FontAwesomeIcon icon={faShare} />
              </button>
            </div>
          </div>
        ))}
        {loading && (
          <p style={{ textAlign: 'center', color: '#aaa' }}>Loading...</p>
        )}
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="create-post-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create Post</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <textarea
                placeholder="What's on your mind?"
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
              />

              {mediaFiles.length > 0 && (
                <div className="media-preview">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="media-item">
                      {file.type.startsWith('image') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" />
                      ) : (
                        <video
                          src={URL.createObjectURL(file)}
                          controls
                        />
                      )}
                      <button
                        className="remove-media"
                        onClick={() =>
                          setMediaFiles(prev =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="post-options">
                <span className="options-label">Add to your post</span>
                <div className="option-icons">
                  <input
                    type="file"
                    id="media-upload"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleMediaSelect}
                  />
                  <button
                    className="option-btn"
                    onClick={() =>
                      document.getElementById('media-upload').click()
                    }
                  >
                    <FontAwesomeIcon
                      icon={faImage}
                      style={{ color: '#45bd62' }}
                    />
                  </button>
                </div>
              </div>
            </div>
            <button
              className="post-btn"
              onClick={handleCreatePost}
              disabled={loading || (!postContent.trim() && mediaFiles.length === 0)}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* STORY CREATE MODAL */}
      {showStoryModal && (
        <div className="modal-overlay" onClick={() => setShowStoryModal(false)}>
          <div
            className="create-story-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create Story</h2>
              <button
                className="close-btn"
                onClick={() => setShowStoryModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="story-upload-body">
              <div className="story-user-info">
                <div className="story-avatar">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="story-user-texts">
                  <h4>{user?.displayName || user?.email?.split('@')[0]}</h4>
                  <span>Share a moment</span>
                </div>
              </div>

              <div className="story-upload-box">
                {!storyFile && (
                  <label htmlFor="story-file" className="story-upload-prompt">
                    <FontAwesomeIcon icon={faImage} size="2x" />
                    <p>Tap to add a photo or video</p>
                  </label>
                )}
                <input
                  id="story-file"
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={e => setStoryFile(e.target.files[0])}
                />

                {storyFile && (
                  <div className="story-preview">
                    {storyFile.type.startsWith('image') ? (
                      <img
                        src={URL.createObjectURL(storyFile)}
                        alt="Story Preview"
                        className="story-preview-img"
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(storyFile)}
                        controls
                        className="story-preview-video"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              className="post-btn story-post-btn"
              onClick={handleStoryUpload}
              disabled={!storyFile || loading}
            >
              {loading ? 'Uploading...' : 'Share to Story'}
            </button>
          </div>
        </div>
      )}

      {/* STORY VIEWER */}
      {showStoryViewer && selectedStory && (
        <div className="modal-overlay" onClick={() => setShowStoryViewer(false)}>
          <div className="story-viewer" onClick={e => e.stopPropagation()}>
            {selectedStory.mediaType === 'image' ? (
              <img src={selectedStory.mediaUrl} alt="story" />
            ) : (
              <video src={selectedStory.mediaUrl} controls autoPlay />
            )}
            <p>{selectedStory.userName}'s story</p>
          </div>
        </div>
      )}

      {/* CHATBOT BUTTON */}
      <button
        className="floating-chatbot-btn"
        onClick={() => navigate('/chatbot')}
      >
        <FontAwesomeIcon icon={faRobot} />
      </button>
    </div>
  );
};

export default Community;
