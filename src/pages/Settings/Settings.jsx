import { useState, useEffect } from "react";
import { auth } from "../../firebase/auth";
import { signOut, updateProfile, deleteUser as deleteFirebaseUser } from "firebase/auth";
import {
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import "../../css/Settings.css";
import { toast } from "react-hot-toast";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";

const Settings = () => {
  const user = auth.currentUser;
  const [stats, setStats] = useState({ friends: 0, posts: 0, followers: 0 });
  const [showModal, setShowModal] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem("notifications") === "true"
  );
  const [loading, setLoading] = useState(false);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const friendsQ = query(collection(db, "friends"), where("participants", "array-contains", user.uid));
        const postsQ = query(collection(db, "posts"), where("userId", "==", user.uid));
        const friendsSnap = await getDocs(friendsQ);
        const postsSnap = await getDocs(postsQ);
        setStats({
          friends: friendsSnap.size,
          posts: postsSnap.size,
          followers: friendsSnap.size,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [user]);

  // Save profile changes
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName, photoURL });
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        photoURL,
        displayName_lowercase: displayName.toLowerCase(),
        email_lowercase: user.email.toLowerCase(),
      });
      toast.success("Profile updated!");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle preferences
  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    toast.success(`Switched to ${newTheme} mode`);
  };

  const handleNotificationToggle = () => {
    const enabled = !notificationsEnabled;
    setNotificationsEnabled(enabled);
    localStorage.setItem("notifications", enabled.toString());
    toast.success(`Notifications ${enabled ? "enabled" : "disabled"}`);
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Logged out");
    window.location.href = "/login";
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteFirebaseUser(user);
      toast.success("Account deleted");
      window.location.href = "/signup";
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <Header />
      <Navbar />

      <div className="settings-content">
        {/* === PROFILE === */}
        <div className="profile-section">
          <div className="profile-avatar-large">
            <img src={user?.photoURL || "/default-avatar.png"} alt="avatar" />
          </div>
          <h2>{user?.displayName || "Anonymous User"}</h2>
          <p>{user?.email}</p>

          <div className="profile-stats">
            <div className="stat-item"><span>{stats.friends}</span><span>Friends</span></div>
            <div className="stat-item"><span>{stats.posts}</span><span>Posts</span></div>
            <div className="stat-item"><span>{stats.followers}</span><span>Followers</span></div>
          </div>

          <button className="edit-profile-btn" onClick={() => setShowModal(true)}>
            Edit Profile
          </button>
        </div>

        {/* === PREFERENCES === */}
        <div className="preferences-section">
          <h3>Preferences</h3>
          <div className="pref-item">
            <span>Dark Mode</span>
            <button onClick={handleThemeToggle}>
              {theme === "dark" ? "🌙 On" : "☀️ Off"}
            </button>
          </div>
        </div>

        {/* === ACCOUNT === */}
        <div className="account-section">
          <h3>Account</h3>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
          <button
            className="delete-account-btn"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            Delete Account
          </button>
        </div>

        {/* === MODAL === */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Edit Profile</h3>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
              />
              <input
                type="text"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="Photo URL"
              />
              <div className="modal-actions">
                <button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
