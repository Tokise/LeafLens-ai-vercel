import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { searchUsers } from "../../firebase/search";
import { useNavigate } from "react-router-dom";
import "../../css/Search.css";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";

const Search = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔍 Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      const users = await searchUsers(query, currentUser?.uid);
      setResults(users);
      setLoading(false);
    }, 400);

    return () => clearTimeout(delay);
  }, [query, currentUser]);

  return (
    <div className="search-page">
      <Header />
      <Navbar />
      <div className="search-wrapper">
        <h2 className="search-title">Search Users</h2>

        <input
          type="text"
          className="search-input"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading && <p className="search-status">Searching...</p>}

        {!loading && query && results.length === 0 && (
          <p className="search-status">No users found.</p>
        )}

        <div className="search-results">
          {results.map((user) => (
            <div
              key={user.id}
              className="search-card"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <img
                src={user.photoURL || "/default-avatar.png"}
                alt={user.displayName}
                className="search-avatar"
              />
              <div className="search-info">
                <div className="search-name">{user.displayName}</div>
                <div className="search-email">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;
