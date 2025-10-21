import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, where, onSnapshot, getDocs, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../../css/Messages.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faSpinner } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

const Messages = () => {
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load all accepted friends
  useEffect(() => {
    if (!currentUser) return;
    const friendsRef = collection(db, "friends");

    const q = query(
      friendsRef,
      where("status", "==", "accepted"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        const friendList = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const friendId = data.participants.find((id) => id !== currentUser.uid);

          // Fetch friend info from users collection
          const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", friendId)));
          if (!userDoc.empty) {
            const friendData = userDoc.docs[0].data();
            friendList.push({ id: friendId, ...friendData });
          }
        }

        setFriends(friendList);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading friends:", err);
        toast.error("Failed to load friends");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // ✅ Open or create a chat
  const openChat = async (friendId) => {
    try {
      if (!currentUser || !friendId) return;

      // Sorted deterministic conversation ID
      const convoId = [currentUser.uid, friendId].sort().join("_");
      const convoRef = doc(db, "conversations", convoId);

      // Create if it doesn't exist
      await setDoc(
        convoRef,
        {
          participants: [currentUser.uid, friendId],
          createdAt: new Date(),
          lastMessageAt: new Date(),
        },
        { merge: true }
      );

      navigate(`/chat/${convoId}`);
    } catch (err) {
      console.error("Error opening chat:", err);
      toast.error("Unable to start chat");
    }
  };

  return (
    <div className="messages-page">
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
