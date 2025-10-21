import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "../../css/Search.css";

const Search = () => {
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 730);

  // Detect screen size for responsive dropdown
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 730);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = async () => {
  if (!searchTerm.trim()) {
    setUsers([]);
    setShowDropdown(false);
    return;
  }

  setLoading(true);
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const filtered = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (u) =>
          (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
          u.id !== currentUser?.uid
      );

    setUsers(filtered);
    setShowDropdown(true);
  } catch (err) {
    console.error("Search error:", err);
  } finally {
    setLoading(false);
  }
};


  // Debounced search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const delay = setTimeout(handleSearch, 400);
      return () => clearTimeout(delay);
    } else {
      setUsers([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  return (
    <div className="search-page">
      <div className="search-header">
        <div className={`search-input-wrapper ${isDesktop ? "desktop" : ""}`}>
          <FontAwesomeIcon
            icon={faArrowLeft}
            onClick={() => navigate("/")}
            className="search-icon back-icon"
          />
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => isDesktop && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
        </div>

        {/* Desktop Dropdown */}
        {isDesktop && showDropdown && (
          <div className="search-dropdown">
            {loading ? (
              <p className="loading">Searching...</p>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="search-result-item"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={user.displayName}
                    className="result-avatar"
                  />
                  <div className="result-info">
                    <h4>{user.displayName || "Unnamed User"}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              searchTerm.length > 1 && <p className="no-results">No users found</p>
            )}
          </div>
        )}
      </div>

      {/* Mobile Results */}
      {!isDesktop && (
        <div className="search-results">
          {loading ? (
            <p className="loading">Searching...</p>
          ) : users.length > 0 ? (
            users.map((user) => (
              <div
                key={user.id}
                className="user-card"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <img
                  src={user.photoURL || "/default-avatar.png"}
                  alt={user.displayName}
                  className="user-avatar"
                />
                <div className="user-info">
                  <h4>{user.displayName || "Unnamed User"}</h4>
                  <p>{user.email}</p>
                </div>
              </div>
            ))
          ) : (
            searchTerm.length > 1 && <p className="no-results">No users found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
