// community.js
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { uploadToCloudinary } from "./cloudbinaryUpload"; // 👈 new import

// === CREATE POST ===
export const createPost = async (content, mediaFiles = []) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return { success: false, error: "User not authenticated" };

  try {
    // Upload each media file to Cloudinary
    const media = [];
    for (const file of mediaFiles) {
      const upload = await uploadToCloudinary(file);
      if (upload.success) media.push(upload);
    }

    await addDoc(collection(db, "posts"), {
      userId: user.uid,
      userName: user.displayName || user.email.split("@")[0],
      userPhotoURL: user.photoURL || null,
      content,
      media,
      likes: [],
      comments: [],
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error: error.message };
  }
};

// === GET POSTS (with pagination) ===
export const getPosts = async (lastDoc = null) => {
  try {
    let q = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(5));
    if (lastDoc) q = query(collection(db, "posts"), orderBy("timestamp", "desc"), startAfter(lastDoc), limit(5));

    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    const hasMore = snapshot.docs.length === 5;
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { success: true, posts, hasMore, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { success: false, posts: [], error: error.message };
  }
};

// === TOGGLE LIKE ===
export const toggleLikePost = async postId => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const postRef = doc(db, "posts", postId);
    const snapshot = await getDocs(collection(db, "posts"));
    const post = snapshot.docs.find(d => d.id === postId);
    if (!post) return { success: false, error: "Post not found" };

    const likes = post.data().likes || [];
    const updatedLikes = likes.includes(user.uid)
      ? likes.filter(uid => uid !== user.uid)
      : [...likes, user.uid];

    await addDoc(collection(db, "posts"), {
      ...post.data(),
      likes: updatedLikes,
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: error.message };
  }
};

// === CREATE STORY ===
export const createStory = async file => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return { success: false, error: "User not authenticated" };

  try {
    const upload = await uploadToCloudinary(file);
    if (!upload.success) throw new Error(upload.error);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await addDoc(collection(db, "stories"), {
      userId: user.uid,
      userName: user.displayName || user.email.split("@")[0],
      userPhotoURL: user.photoURL || null,
      mediaUrl: upload.url,
      mediaType: upload.type,
      timestamp: serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating story:", error);
    return { success: false, error: error.message };
  }
};

// === GET STORIES ===
export const getStories = async () => {
  try {
    const snapshot = await getDocs(query(collection(db, "stories"), orderBy("timestamp", "desc")));
    const now = new Date();
    const stories = snapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .filter(story => new Date(story.expiresAt) > now);

    return { success: true, stories };
  } catch (error) {
    console.error("Error fetching stories:", error);
    return { success: false, stories: [], error: error.message };
  }
};

// === DELETE STORY ===
export const deleteStory = async storyId => {
  try {
    await deleteDoc(doc(db, "stories", storyId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting story:", error);
    return { success: false, error: error.message };
  }
};
