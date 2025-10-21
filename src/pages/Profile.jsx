// src/pages/profile/Profile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Header from "../components/header/Header";
import toast from "react-hot-toast";
import "../css/Profile.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const db = getFirestore();
const auth = getAuth();

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!mounted) return;
        if (userSnap.exists()) setProfileUser({ id: userId, ...userSnap.data() });
        else setProfileUser(null);

        // posts
        const q = query(collection(db, "posts"), where("userId", "==", userId));
        const snap = await getDocs(q);
        if (!mounted) return;
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        // friend status
        if (currentUser) {
          const friendsRef = collection(db, "friends");
          const qf = query(
            friendsRef,
            where("userId", "==", currentUser.uid),
            where("friendId", "==", userId)
          );
          const friendSnap = await getDocs(qf);
          setIsFriend(!friendSnap.empty);

          // check if request already exists (simple check in notifications)
          const notifRef = collection(db, "notifications");
          const qr = query(
            notifRef,
            where("userId", "==", userId),
            where("type", "==", "friend_request"),
            where("fromUserId", "==", currentUser.uid)
          );
          const requestSnap = await getDocs(qr);
          setRequestSent(!requestSnap.empty);
        }
      } catch (err) {
        console.error("Profile fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => (mounted = false);
  }, [userId, currentUser]);

  const sendFriendRequest = async () => {
    if (!currentUser) {
      toast.error("Please sign in to send a friend request");
      return;
    }
    if (requestSent) {
      toast("Friend request already sent");
      return;
    }
    try {
      await addDoc(collection(db, "notifications"), {
        userId: userId,
        fromUserId: currentUser.uid,
        type: "friend_request",
        title: `${currentUser.displayName || currentUser.email} sent you a friend request`,
        message: "Tap to accept or reject.",
        timestamp: serverTimestamp(),
        read: false,
        handled: false,
      });
      setRequestSent(true);
      toast.success("Friend request sent");
    } catch (err) {
      console.error("sendFriendRequest error", err);
      toast.error("Failed to send friend request");
    }
  };

  const openChat = () => {
    if (!currentUser) {
      toast.error("Please sign in to message");
      return;
    }
    // Conversation id deterministic: smaller_biggest_...
    const convoId = [currentUser.uid, userId].sort().join("_");
    navigate(`/chat/${convoId}`);
  };

  if (loading) {
    return (
      <div className="profile-container loading">
        <Header />
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-container">
        <Header />
        <div className="profile-empty">User not found.</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Header />
      <div className="profile-inner">
        <div className="profile-card">
          <div className="profile-top">

            <div className="profile-avatar">
              <img src={profileUser.photoURL || "/default-avatar.png"} alt="avatar" />
            </div>

            <div className="profile-meta">
              <h2 className="profile-name">{profileUser.displayName || "User"}</h2>
              <div className="profile-email">{profileUser.email}</div>

              <div className="profile-actions">
                {currentUser && currentUser.uid !== userId && (
                  <>
                    {!isFriend ? (
                      requestSent ? (
                        <button className="btn pending">Request Sent</button>
                      ) : (
                        <button className="btn primary" onClick={sendFriendRequest}>
                          + Add Friend
                        </button>
                      )
                    ) : (
                      <button className="btn outline" onClick={openChat}>
                        Message
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="profile-body">
            <section className="profile-section">
              <h3>Posts</h3>
              {posts.length === 0 ? (
                <div className="empty">No posts yet.</div>
              ) : (
                <div className="posts-grid">
                  {posts.map(p => (
                    <div key={p.id} className="post-card">
                      {p.media?.length > 0 ? (
                        p.media[0].type?.startsWith("image") ? (
                          <img src={p.media[0].url} alt="post" />
                        ) : (
                          <video src={p.media[0].url} controls />
                        )
                      ) : (
                        <div className="post-placeholder">{p.content || "Post"}</div>
                      )}
                      {p.content && <div className="post-caption">{p.content}</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
