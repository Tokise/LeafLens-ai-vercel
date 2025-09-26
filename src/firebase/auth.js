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
import { auth } from './firebase';

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

// Email/Password Sign-in
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Google Sign-in (Dual platform)
export const signInWithGoogle = async () => {
  try {
    if (isAndroidWrapper()) {
      // --- Android (Median.co) ---
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseUser = await signInWithCredential(auth, credential);
      return { user: firebaseUser.user, error: null };
    } else {
      // --- Web ---
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      return { user: userCredential.user, error: null };
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
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
