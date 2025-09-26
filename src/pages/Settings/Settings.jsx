import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/auth';
import { updateProfile } from 'firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/header/Header';
import { requestNotificationPermission } from '../../firebase/firebase';
import '../../css/Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('notificationsEnabled') === 'true');
  const user = auth.currentUser;

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      // Show success toast or message
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error toast or message
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
      {/* Profile Settings */}
      <div className="settings-section">
        <h2>Profile Settings</h2>
        <div className="input-group">
          <label>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
          />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="disabled"
          />
        </div>
        <button 
          className="update-button" 
          onClick={handleProfileUpdate}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>

      {/* Preferences */}
      <div className="settings-section">
        <h2>Preferences</h2>
        <div className="toggle-group">
          <label>Enable push notifications</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => handleNotificationToggle(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="toggle-group">
          <label>Dark mode</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Logout Button */}
      <div className="settings-section">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
