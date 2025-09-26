import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Collection name for favorites
const FAVORITES_COLLECTION = 'favorites';

// Add a plant to favorites
export const addToFavorites = async (plantData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be logged in to add favorites');

    const favoriteData = {
      userId: user.uid,
      savedAt: serverTimestamp(),
      ...plantData
    };

    const docRef = await addDoc(collection(db, FAVORITES_COLLECTION), favoriteData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return { success: false, error: error.message };
  }
};

// Remove a plant from favorites
export const removeFromFavorites = async (favoriteId) => {
  try {
    await deleteDoc(doc(db, FAVORITES_COLLECTION, favoriteId));
    return { success: true };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return { success: false, error: error.message };
  }
};

// Get all favorites for current user
export const getUserFavorites = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be logged in to get favorites');

    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);
    const favorites = [];
    
    querySnapshot.forEach((doc) => {
      favorites.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, favorites };
  } catch (error) {
    console.error('Error getting favorites:', error);
    return { success: false, error: error.message };
  }
};