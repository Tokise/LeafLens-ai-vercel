import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCog, faSearch, faHome, faEnvelope, faCamera, faChartLine, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import { auth } from '../../firebase/auth';
import './Header.css';
import LogoName from '../../assets/images/LeafLens.png';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = () => {
    navigate('/search');
  };

  // Check if current route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="page-header">
      <div className="left-section">
        <div className="logo-group" onClick={() => navigate('/')}>
          <div className="logo-name">
            <img src={LogoName} alt="LeafLens"  />
          </div> 
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="desktop-nav">
        <button 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <FontAwesomeIcon icon={faHome} />
      
        </button>
        <button 
          className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
          onClick={() => navigate('/messages')}
        >
          <FontAwesomeIcon icon={faComment} />
      
        </button>
        <button 
          className={`nav-link ${isActive('/scan') ? 'active' : ''}`}
          onClick={() => navigate('/scan')}
        >
          <FontAwesomeIcon icon={faCamera} />
    
        </button>
        <button 
          className={`nav-link ${isActive('/monitoring') ? 'active' : ''}`}
          onClick={() => navigate('/monitoring')}
        >
          <FontAwesomeIcon icon={faChartLine} />
        
        </button>
        <button 
          className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}
          onClick={() => navigate('/favorites')}
        >
          <FontAwesomeIcon icon={faHeart} />
     
        </button>
      </nav>

      <div className="header-actions">
        <button className="search-btn" onClick={handleSearch} aria-label="Search">
          <FontAwesomeIcon icon={faSearch} />
        </button>
        <button className="notification-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
          <FontAwesomeIcon icon={faBell} />
          <span className="notification-badge"></span>
        </button>
        <button className="settings-btn" onClick={() => navigate('/settings')} aria-label="Settings">
          <FontAwesomeIcon icon={faCog} />
        </button>
      </div>
    </header>
  );
};

export default Header;