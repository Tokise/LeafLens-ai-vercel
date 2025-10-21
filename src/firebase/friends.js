import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Send friend request
export const sendFriendRequest = async (toUserId) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  await addDoc(collection(db, "friendRequests"), {
    fromUserId: user.uid,
    toUserId,
    fromUserName: user.displayName || user.email.split("@")[0],
    timestamp: new Date().toISOString(),
    status: "pending",
  });
};

// Get pending friend requests for current user
export const getFriendRequests = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "friendRequests"), where("toUserId", "==", user.uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Accept friend request
export const acceptFriendRequest = async (request) => {
  await addDoc(collection(db, "friends"), {
    userId: request.fromUserId,
    friendId: request.toUserId,
    timestamp: new Date().toISOString(),
  });
  await addDoc(collection(db, "friends"), {
    userId: request.toUserId,
    friendId: request.fromUserId,
    timestamp: new Date().toISOString(),
  });
  await updateDoc(doc(db, "friendRequests", request.id), { status: "accepted" });
};

// Decline or remove
export const deleteFriendRequest = async (requestId) => {
  await deleteDoc(doc(db, "friendRequests", requestId));
};
