// src/firebase/friends.js
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Send a friend request
 * - prevents sending to self and duplicate requests
 */
export const sendFriendRequest = async (fromUserId, toUserId) => {
  if (!fromUserId || !toUserId) throw new Error("Missing user ids");
  if (fromUserId === toUserId) throw new Error("You cannot add yourself.");

  // don't allow duplicate friend request if already friends
  const friendsQ = query(
    collection(db, "friends"),
    where("participants", "array-contains", fromUserId)
  );
  const friendsSnap = await getDocs(friendsQ);
  const alreadyFriend = friendsSnap.docs.some((d) =>
    d.data().participants.includes(toUserId)
  );
  if (alreadyFriend) throw new Error("You are already friends.");

  // check existing pending request (either direction)
  const duplicateQ = query(
    collection(db, "friendRequests"),
    where("fromUserId", "==", fromUserId),
    where("toUserId", "==", toUserId)
  );
  const duplicateSnap = await getDocs(duplicateQ);
  if (!duplicateSnap.empty) throw new Error("Request already sent.");

  // also block if reverse request exists (to prevent duplicates)
  const reverseQ = query(
    collection(db, "friendRequests"),
    where("fromUserId", "==", toUserId),
    where("toUserId", "==", fromUserId)
  );
  const reverseSnap = await getDocs(reverseQ);
  if (!reverseSnap.empty) {
    // optional: accept automatically if reverse exists. For now throw
    throw new Error("User already sent you a request. Accept it.");
  }

  const docRef = await addDoc(collection(db, "friendRequests"), {
    fromUserId,
    toUserId,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  // also create a notification for the receiver
  await addDoc(collection(db, "notifications"), {
    userId: toUserId,
    fromUserId,
    type: "friend_request",
    read: false,
    createdAt: serverTimestamp(),
    meta: { requestId: docRef.id },
  });

  return { id: docRef.id };
};

/**
 * Accept friend request: create a friend doc & remove request
 */
export const acceptFriendRequest = async (reqId) => {
  const reqRef = doc(db, "friendRequests", reqId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found.");

  const data = reqSnap.data();
  const { fromUserId, toUserId } = data;

  // create friends doc
  await addDoc(collection(db, "friends"), {
    participants: [fromUserId, toUserId],
    userId: fromUserId,
    friendId: toUserId,
    createdAt: serverTimestamp(),
  });

  // delete the request
  await deleteDoc(reqRef);

  // mark corresponding notification read and add accepted notification
  const notifQ = query(
    collection(db, "notifications"),
    where("userId", "==", toUserId),
    where("fromUserId", "==", fromUserId),
    where("type", "==", "friend_request")
  );
  const notifSnap = await getDocs(notifQ);
  await Promise.all(
    notifSnap.docs.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))
  );

  // create accepted notification for requester
  await addDoc(collection(db, "notifications"), {
    userId: fromUserId,
    fromUserId: toUserId,
    type: "friend_accepted",
    read: false,
    createdAt: serverTimestamp(),
  });

  return true;
};

/**
 * Reject friend request: remove request & mark notification read
 */
export const rejectFriendRequest = async (reqId) => {
  const reqRef = doc(db, "friendRequests", reqId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found.");

  const data = reqSnap.data();
  const { fromUserId, toUserId } = data;

  await deleteDoc(reqRef);

  // mark corresponding notification read
  const notifQ = query(
    collection(db, "notifications"),
    where("userId", "==", toUserId),
    where("fromUserId", "==", fromUserId),
    where("type", "==", "friend_request")
  );
  const notifSnap = await getDocs(notifQ);
  await Promise.all(
    notifSnap.docs.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))
  );

  // optional: create a "rejected" notification for requester
  await addDoc(collection(db, "notifications"), {
    userId: fromUserId,
    fromUserId: toUserId,
    type: "friend_rejected",
    read: false,
    createdAt: serverTimestamp(),
  });

  return true;
};

/**
 * Remove/unfriend: deletes any matching friends doc
 */
export const unfriend = async (currentUserId, targetId) => {
  if (!currentUserId || !targetId) throw new Error("Missing ids");
  const q = query(collection(db, "friends"), where("participants", "array-contains", currentUserId));
  const snap = await getDocs(q);

  const deletions = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.participants.includes(targetId)) {
      deletions.push(deleteDoc(doc(db, "friends", d.id)));
    }
  });
  await Promise.all(deletions);
  return true;
};

/**
 * Get friend status for current user relative to target
 * returns: 'friends' | 'sent' | 'received' | 'none'
 */
export const getFriendStatus = async (currentUserId, targetId) => {
  if (!currentUserId || !targetId) return "none";

  // 1) Are they friends?
  const friendsQ = query(collection(db, "friends"), where("participants", "array-contains", currentUserId));
  const friendsSnap = await getDocs(friendsQ);
  const isFriend = friendsSnap.docs.some((d) => d.data().participants.includes(targetId));
  if (isFriend) return "friends";

  // 2) Sent?
  const sentQ = query(
    collection(db, "friendRequests"),
    where("fromUserId", "==", currentUserId),
    where("toUserId", "==", targetId)
  );
  const sentSnap = await getDocs(sentQ);
  if (!sentSnap.empty) return "sent";

  // 3) Received?
  const recvQ = query(
    collection(db, "friendRequests"),
    where("fromUserId", "==", targetId),
    where("toUserId", "==", currentUserId)
  );
  const recvSnap = await getDocs(recvQ);
  if (!recvSnap.empty) return "received";

  return "none";
};

/**
 * Get accepted friends list for a user
 * returns array of user objects (id + fields)
 */
export const getAcceptedFriends = async (userId) => {
  const q = query(collection(db, "friends"), where("participants", "array-contains", userId));
  const snap = await getDocs(q);
  const friends = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const friendId = data.participants.find((id) => id !== userId);
    if (!friendId) continue;

    const userRef = doc(db, "users", friendId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) friends.push({ id: userSnap.id, ...userSnap.data() });
  }

  return friends;
};
