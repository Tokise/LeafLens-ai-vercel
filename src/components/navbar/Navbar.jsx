import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faComments,
  faCamera,
  faHeart,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import '../../css/Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bottom-navbar">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <FontAwesomeIcon icon={faHome} className="nav-icon" />
        
      </Link>
      
      <Link to="/chatbot" className={`nav-item ${isActive('/chatbot') ? 'active' : ''}`}>
        <FontAwesomeIcon icon={faComments} className="nav-icon" />
       
      </Link>
      
      <Link to="/scan" className={`nav-item ${isActive('/scan') ? 'active' : ''}`}>
        <div className="scan-button">
          <FontAwesomeIcon icon={faCamera} className="nav-icon" />
        </div>
       
      </Link>
      
      <Link to="/favorites" className={`nav-item ${isActive('/favorites') ? 'active' : ''}`}>
        <FontAwesomeIcon icon={faHeart} className="nav-icon" />
        
      </Link>
      
      <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
        <FontAwesomeIcon icon={faCog} className="nav-icon" />
       
      </Link>
    </nav>
  );
};

export default Navbar;
