import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { searchUsers, sendFriendRequest } from '../../firebase/community';
import { toast } from 'react-hot-toast';
import Header from '../../components/header/Header';
import '../../css/Search.css';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    const result = await searchUsers(query);
    
    if (result.success) {
      setResults(result.users);
    }
    setLoading(false);
  };

  const handleAddFriend = async (userId) => {
    const result = await sendFriendRequest(userId);
    
    if (result.success) {
      toast.success('Friend request sent!');
    } else {
      toast.error('Failed to send friend request');
    }
  };

  return (
    <div className="search-page">
      <Header />
      
      <div className="search-container">
        <div className="search-header">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search users, posts, plants..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="search-tabs">
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`tab ${activeTab === 'plants' ? 'active' : ''}`}
            onClick={() => setActiveTab('plants')}
          >
            Plants
          </button>
        </div>

        <div className="search-results">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faSearch} className="empty-icon" />
              <h3>No results found</h3>
              <p>Try searching for something else</p>
            </div>
          ) : (
            results.map((user) => (
              <div key={user.id} className="user-result-card">
                <div className="user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(user.displayName || user.email)?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="user-info">
                  <h4>{user.displayName || user.email?.split('@')[0]}</h4>
                  <p>{user.bio || 'Plant enthusiast'}</p>
                </div>

                <button 
                  className="add-friend-btn"
                  onClick={() => handleAddFriend(user.id)}
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;