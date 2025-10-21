import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, startAfter, updateDoc, arrayUnion, arrayRemove, doc, serverTimestamp, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import app from './firebase';

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Create Post
export const createPost = async (content, mediaFiles = []) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Upload media files if any
    const mediaUrls = [];
    for (const file of mediaFiles) {
      const fileRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      mediaUrls.push({ url, type: file.type.startsWith('video') ? 'video' : 'image' });
    }

    const postData = {
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      userPhotoURL: user.photoURL || null,
      content,
      media: mediaUrls,
      likes: [],
      comments: [],
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'posts'), postData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: error.message };
  }
};

// Get Posts (with pagination)
export const getPosts = async (lastDoc = null, limitCount = 10) => {
  try {
    const postsRef = collection(db, 'posts');
    let q = query(postsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    if (lastDoc) {
      q = query(postsRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(limitCount));
    }

    const snapshot = await getDocs(q);
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    return { 
      success: true, 
      posts, 
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('Error getting posts:', error);
    return { success: false, error: error.message, posts: [] };
  }
};

// Like/Unlike Post
export const toggleLikePost = async (postId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDocs(query(collection(db, 'posts'), where('__name__', '==', postId)));
    
    if (!postDoc.empty) {
      const postData = postDoc.docs[0].data();
      const likes = postData.likes || [];
      
      if (likes.includes(user.uid)) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, error: error.message };
  }
};

// Search Users
export const searchUsers = async (searchTerm) => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      const userName = userData.displayName || userData.email?.split('@')[0] || '';
      
      if (userName.toLowerCase().includes(searchTerm.toLowerCase())) {
        users.push({ id: doc.id, ...userData });
      }
    });

    return { success: true, users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: error.message, users: [] };
  }
};

// Send Friend Request
export const sendFriendRequest = async (toUserId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await addDoc(collection(db, 'friendRequests'), {
      fromUserId: user.uid,
      toUserId,
      status: 'pending',
      timestamp: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
};