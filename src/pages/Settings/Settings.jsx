import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/auth';
import { updateProfile } from 'firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/header/Header';
import { requestNotificationPermission } from '../../firebase/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faBell, 
  faMoon, 
  faLock,
  faShieldAlt,
  faQuestionCircle,
  faInfoCircle,
  faSignOutAlt,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import '../../css/Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem('notificationsEnabled') === 'true'
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const user = auth.currentUser;

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      toast.success('Profile updated!');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNotificationToggle = async (enabled) => {
    try {
      if (enabled) {
        const token = await requestNotificationPermission();
        const ok = Boolean(token);
        setNotificationsEnabled(ok);
        if (ok) {
          localStorage.setItem('notificationsEnabled', 'true');
        } else {
          localStorage.removeItem('notificationsEnabled');
        }
      } else {
        setNotificationsEnabled(false);
        localStorage.removeItem('notificationsEnabled');
      }
    } catch (error) {
      console.error('Error handling notification permission:', error);
      setNotificationsEnabled(false);
    }
  };

  return (
    <div className="settings-page">
      <Header />
      
      <div className="settings-content">
        <div className="profile-section">
          <div className="profile-avatar-large">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" />
            ) : (
              <div className="avatar-placeholder-large">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <h2>{user?.displayName || user?.email?.split('@')[0] || 'Plant Lover'}</h2>
          <p className="profile-email">{user?.email}</p>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">3</span>
              <span className="stat-label">Plants</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">4</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">127</span>
              <span className="stat-label">Followers</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Account Settings</h3>
          
          <div className="settings-item" onClick={() => setIsEditingProfile(true)}>
            <div className="item-left">
              <FontAwesomeIcon icon={faUser} className="item-icon" />
              <span>Edit Profile</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="chevron" />
          </div>

          <div className="settings-item">
            <div className="item-left">
              <FontAwesomeIcon icon={faLock} className="item-icon" />
              <span>Change Password</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="chevron" />
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Preferences</h3>
          
          <div className="settings-item toggle-item">
            <div className="item-left">
              <FontAwesomeIcon icon={faBell} className="item-icon" />
              <span>Push Notifications</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleNotificationToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-item toggle-item">
            <div className="item-left">
              <FontAwesomeIcon icon={faMoon} className="item-icon" />
              <span>Dark Mode</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Privacy & Security</h3>
          
          <div className="settings-item">
            <div className="item-left">
              <FontAwesomeIcon icon={faShieldAlt} className="item-icon" />
              <span>Privacy Settings</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="chevron" />
          </div>

          <div className="settings-item">
            <div className="item-left">
              <FontAwesomeIcon icon={faUser} className="item-icon" />
              <span>Blocked Users</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="chevron" />
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Help & Support</h3>
          
          <div className="settings-item">
            <div className="item-left">
              <FontAwesomeIcon icon={faQuestionCircle} className="item-icon" />
              <span>Help Center</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="chevron" />
          </div>

          <div className="settings-item">
            <div className="item-left">
              <FontAwesomeIcon icon={faInfoCircle} className="item-icon" />
              <span>About LeafLens</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="chevron" />
          </div>
        </div>

        <div className="settings-section">
          <button className="logout-btn" onClick={handleLogout}>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;