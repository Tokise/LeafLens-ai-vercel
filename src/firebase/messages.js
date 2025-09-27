import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "./firebase";

const db = getFirestore(app);
const auth = getAuth(app);

export async function saveChatMessage({ type, content }) {
  const user = auth.currentUser;
  console.log('saveChatMessage: currentUser', user);
  if (!user) {
    console.error('User not authenticated when saving chat message');
    throw new Error("User not authenticated");
  }
  const messagesRef = collection(db, "users", user.uid, "messages");
  try {
    await addDoc(messagesRef, {
      type,
      content,
      userId: user.uid,
      timestamp: serverTimestamp(),
    });
    console.log('Chat message saved to Firestore:', { type, content, userId: user.uid });
  } catch (err) {
    console.error('Error saving chat message to Firestore:', err);
    throw err;
  }
}
