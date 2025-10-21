// auth.js
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth } from './firebase';

// Firestore init
const db = getFirestore();

// Detect if running inside Median.co (Android WebView)
const isAndroidWrapper = () => {
  return window.navigator.userAgent.includes("Median");
};

// Optional: import Capacitor Google Auth only if needed
let GoogleAuth;
if (isAndroidWrapper()) {
  GoogleAuth = require('@codetrix-studio/capacitor-google-auth').GoogleAuth;
  GoogleAuth.init({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Firebase Web client ID
  });
}

// Utility to save/update Firestore user profile
const saveUserProfile = async (user) => {
  if (!user) return;
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        displayName: user.displayName || user.email.split("@")[0],
        email: user.email,
        photoURL: user.photoURL || null,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Error saving user profile:", err);
  }
};

// Email/Password Sign-in
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await saveUserProfile(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Email/Password Sign-up
export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await saveUserProfile(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Google Sign-in (Dual platform)
export const signInWithGoogle = async () => {
  try {
    if (isAndroidWrapper()) {
      if (!GoogleAuth) {
        return { user: null, error: 'GoogleAuth plugin not available.' };
      }
      try {
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        const credential = GoogleAuthProvider.credential(idToken);
        const firebaseUser = await signInWithCredential(auth, credential);
        await saveUserProfile(firebaseUser.user);
        return { user: firebaseUser.user, error: null };
      } catch (pluginError) {
        console.error("Google sign-in error (plugin):", pluginError);
        return { user: null, error: pluginError.message };
      }
    } else {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      await saveUserProfile(userCredential.user);
      return { user: userCredential.user, error: null };
    }
  } catch (error) {
    console.error("Google sign-in error (outer):", error);
    return { user: null, error: error.message };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Password reset
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export { auth };
