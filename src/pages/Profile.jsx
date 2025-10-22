import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { auth } from "../firebase/auth";
import "../css/Profile.css";
import "../css/Community.css"; // Use shared feed styling
import Navbar from "../components/navbar/Navbar";
import Header from "../components/header/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faComment } from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
  const { userId } = useParams();
  const currentUser = auth.currentUser;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [friendCount, setFriendCount] = useState(0);

  // ✅ Fetch user profile, posts, and friendship
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 1️⃣ Fetch user
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) setUser(userDoc.data());

        // 2️⃣ Fetch user posts
        const postsRef = collection(db, "posts");
        const postsQ = query(postsRef, where("userId", "==", userId));
        const postSnap = await getDocs(postsQ);
        const postList = postSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPosts(postList);

        // 3️⃣ Check if current user is already a friend
        if (currentUser) {
          const friendsQ = query(
            collection(db, "friends"),
            where("participants", "array-contains", currentUser.uid)
          );
          const friendsSnap = await getDocs(friendsQ);

          const isAlreadyFriend = friendsSnap.docs.some((doc) =>
            doc.data().participants.includes(userId)
          );
          setIsFriend(isAlreadyFriend);

          // 4️⃣ Count total friends for displayed user
          const userFriendsQ = query(
            collection(db, "friends"),
            where("participants", "array-contains", userId)
          );
          const userFriendsSnap = await getDocs(userFriendsQ);
          setFriendCount(userFriendsSnap.size);

          // 5️⃣ Check if there's a pending friend request
          const requestQ = query(
            collection(db, "notifications"),
            where("fromUserId", "==", currentUser.uid),
            where("userId", "==", userId),
            where("type", "==", "friend_request")
          );
          const reqSnap = await getDocs(requestQ);
          setHasPendingRequest(!reqSnap.empty);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfileData();
  }, [userId, currentUser]);

  // ✅ Send friend request
  const handleSendFriendRequest = async () => {
    try {
      await addDoc(collection(db, "notifications"), {
        userId,
        fromUserId: currentUser.uid,
        type: "friend_request",
        title: `${currentUser.displayName || "Someone"} sent you a friend request!`,
        message: "Tap to accept or reject.",
        timestamp: serverTimestamp(),
        read: false,
        handled: false,
      });
      setHasPendingRequest(true);
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-page">
      <Header />
      <Navbar />
      <div className="profile-container">
        {/* === Profile Header === */}
        <div className="profile-header">
          <img
            src={user.photoURL || "/default-avatar.png"}
            alt="Profile"
            className="profile-avatar"
          />
          <div className="profile-details">
            <h2>{user.displayName}</h2>
            <p>{user.email}</p>

            <div className="profile-stats">
              <div>
                <strong>{friendCount}</strong>
                <span>Friends</span>
              </div>
              <div>
                <strong>{posts.length}</strong>
                <span>Posts</span>
              </div>
              <div>
                <strong>{friendCount}</strong>
                <span>Followers</span>
              </div>
            </div>

            {currentUser.uid !== userId && (
              <div className="profile-actions">
                {isFriend ? (
                  <button className="friend-btn" disabled>
                    ✅ Friends
                  </button>
                ) : hasPendingRequest ? (
                  <button className="friend-btn" disabled>
                    ⏳ Request Sent
                  </button>
                ) : (
                  <button className="friend-btn" onClick={handleSendFriendRequest}>
                    + Add Friend
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === Posts Feed === */}
        <div className="posts-feed">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt="User"
                    className="post-avatar"
                  />
                  <div>
                    <h4>{user.displayName}</h4>
                    <span>
                      {post.timestamp?.toDate
                        ? post.timestamp.toDate().toLocaleString()
                        : "Unknown date"}
                    </span>
                  </div>
                </div>

                <p className="post-caption">{post.caption}</p>

                {post.image && (
                  <img src={post.image} alt="Post" className="post-image" />
                )}

                {post.video && (
                  <video controls className="post-video">
                    <source src={post.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}

                <div className="post-actions">
                  <button className="icon-btn">
                    <FontAwesomeIcon icon={faHeart} /> {post.likes?.length || 0}
                  </button>
                  <button className="icon-btn">
                    <FontAwesomeIcon icon={faComment} /> {post.comments?.length || 0}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-posts-text">No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
