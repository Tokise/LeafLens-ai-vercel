import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);

/**
 * Search users by display name or email (case-insensitive).
 * Requires fields: displayName_lower, email_lower
 */
export const searchUsers = async (term, excludeId) => {
  if (!term || term.trim() === "") return [];

  const lowerTerm = term.toLowerCase();
  const start = lowerTerm;
  const end = lowerTerm + "\uf8ff";

  try {
    const usersRef = collection(db, "users");

    // Search both displayName_lower and email_lower
    const q1 = query(usersRef, where("displayName_lower", ">=", start), where("displayName_lower", "<=", end));
    const q2 = query(usersRef, where("email_lower", ">=", start), where("email_lower", "<=", end));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const results = [
      ...snap1.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ...snap2.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    ];

    // Remove duplicates and exclude the current user
    const uniqueResults = results.filter(
      (user, index, self) =>
        index === self.findIndex((u) => u.id === user.id) && user.id !== excludeId
    );

    return uniqueResults;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};
