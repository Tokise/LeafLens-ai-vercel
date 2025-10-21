import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from './firebase';

const db = getFirestore(app);
const auth = getAuth(app);

export const addPlantToMonitoring = async (plantData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const monitoredPlantsRef = collection(db, 'users', user.uid, 'monitoredPlants');
    const docRef = await addDoc(monitoredPlantsRef, {
      ...plantData,
      addedDate: serverTimestamp(),
      lastWatered: serverTimestamp(),
      nextWatering: calculateNextWatering(new Date(), plantData.wateringInterval || 3)
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding plant to monitoring:', error);
    return { success: false, error: error.message };
  }
};

export const getMonitoredPlants = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const monitoredPlantsRef = collection(db, 'users', user.uid, 'monitoredPlants');
    const q = query(monitoredPlantsRef, orderBy('addedDate', 'desc'));
    const snapshot = await getDocs(q);

    const plants = [];
    snapshot.forEach(doc => {
      plants.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, plants };
  } catch (error) {
    console.error('Error getting monitored plants:', error);
    return { success: false, error: error.message, plants: [] };
  }
};

export const updatePlantWatering = async (plantId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const plantRef = doc(db, 'users', user.uid, 'monitoredPlants', plantId);
    await updateDoc(plantRef, {
      lastWatered: serverTimestamp(),
      nextWatering: calculateNextWatering(new Date(), 3)
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating plant watering:', error);
    return { success: false, error: error.message };
  }
};

export const removePlantFromMonitoring = async (plantId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const plantRef = doc(db, 'users', user.uid, 'monitoredPlants', plantId);
    await deleteDoc(plantRef);

    return { success: true };
  } catch (error) {
    console.error('Error removing plant:', error);
    return { success: false, error: error.message };
  }
};

function calculateNextWatering(lastDate, daysInterval) {
  const next = new Date(lastDate);
  next.setDate(next.getDate() + daysInterval);
  return next;
}