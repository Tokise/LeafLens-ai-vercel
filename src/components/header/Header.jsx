import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCog, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import { auth } from '../../firebase/auth';
import './Header.css';
import NoNameLogo from '../../assets/images/logo-no-name.PNG';
import LogoName from '../../assets/images/LeafLens.png';

const Header = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const user = auth.currentUser;

  const toggleSearch = () => setIsExpanded((prev) => !prev);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsExpanded(false);
    }
  };

  // Collapse search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="page-header">
      <div className="left-section">
        <div className="logo-group" onClick={() => navigate('/')}>
          <div className="logo-icon">
            <img src={NoNameLogo} alt="LeafLens Logo" className="logo" />
          </div>
          <div className="logo-text">
            <img src={LogoName} alt="LeafLens Name Logo" className="logo-name" />
          </div>
        </div>

        {/* 🔍 Search beside logo */}
        <div className="search-container" ref={searchRef}>
          <button className="search-toggle" onClick={toggleSearch}>
            <FontAwesomeIcon icon={faSearch} />
          </button>

          <form
            className={`search-bar-inline ${isExpanded ? 'expanded' : ''}`}
            onSubmit={handleSearch}
          >
            <input
              type="text"
              placeholder="Search for friends, groups, posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus={isExpanded}
            />
          </form>
        </div>
      </div>

      <div className="header-actions">
        <div className="notification-icon" onClick={() => navigate('/notifications')}>
          <FontAwesomeIcon icon={faBell} />
          <span className="notification-badge"></span>
        </div>
        <div className="settings-icon" onClick={() => navigate('/settings')}>
          <FontAwesomeIcon icon={faCog} />
        </div>
      </div>
    </header>
  );
};

export default Header;
