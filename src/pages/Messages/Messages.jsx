import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../../css/Messages.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faSpinner, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import { getAcceptedFriends } from "../../firebase/friends"; // ✅ use helper
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";


const Messages = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadFriends = async () => {
      try {
        setLoading(true);
        const list = await getAcceptedFriends(currentUser.uid);
        setFriends(list);
      } catch (err) {
        console.error("Error loading friends:", err);
        toast.error("Failed to load friends");
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [currentUser]);

  const openChat = async (friendId) => {
    navigate(`/chat/${[currentUser.uid, friendId].sort().join("_")}`);
  };

  return (
    <div className="messages-page">
      <Header />
      <Navbar />
      <h2 className="messages-title">
        <FontAwesomeIcon icon={faComments} /> Messages
      </h2>

      {loading ? (
        <div className="messages-loading">
          <FontAwesomeIcon icon={faSpinner} spin /> Loading friends...
        </div>
      ) : friends.length === 0 ? (
        <p className="no-friends">You have no accepted friends yet.</p>
      ) : (
        <div className="friends-list">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="friend-card"
              onClick={() => openChat(friend.id)}
            >
              <img
                src={friend.photoURL || "/default-avatar.png"}
                alt={friend.displayName}
                className="friend-avatar"
              />
              <div className="friend-info">
                <h4>{friend.displayName || "Unnamed User"}</h4>
                <p>{friend.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
