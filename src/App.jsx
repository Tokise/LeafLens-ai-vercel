import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import Community from "./pages/Community/Community";
import Scan from "./pages/Scan/Scan";
import Favorites from "./pages/Favorites/Favorites";
import Chatbot from "./pages/Chatbot/Chatbot";
import Notification from "./pages/Notification/Notification";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Auth/Login";
import Chat from "./pages/Chat/Chat";
import Messages from "./pages/Messages/Messages";
import Monitoring from "./pages/Monitoring/Monitoring";
import { useState, useEffect } from "react";
import { auth } from "./firebase/auth";
import { db } from "./firebase/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { getRedirectResult } from "firebase/auth";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { weatherService } from "./utils/weatherService";
import { pushNotificationService } from "./utils/pushNotificationService";
import { notificationService } from "./utils/notificationService";
import Search from "./pages/Search/Search";
import Profile from "./pages/Profile";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👇 Handle online/offline presence
  useEffect(() => {
    const setPresence = async (user, isOnline) => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
      });
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setPresence(user, true);

        const handleOffline = () => setPresence(user, false);
        window.addEventListener("beforeunload", handleOffline);
        window.addEventListener("unload", handleOffline);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading LeafLens AI...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Toaster position="top-center" />
        {user ? (
          <>
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Community />} />
                <Route path="/search" element={<Search />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/chat/:conversationId" element={<Chat />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/notifications" element={<Notification />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </>
        ) : (
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  );
}

export default App;
