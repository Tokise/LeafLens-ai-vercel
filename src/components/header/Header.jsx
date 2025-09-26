import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { auth } from '../../firebase/auth';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  return (
    <header className="page-header">
      <div className="profile-icon" onClick={handleProfileClick}>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" />
        ) : (
          <div className="profile-placeholder">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className="notification-icon" onClick={handleNotificationClick}>
        <FontAwesomeIcon icon={faBell} />
        <span className="notification-badge"></span>
      </div>
    </header>
  );
};

export default Header;
