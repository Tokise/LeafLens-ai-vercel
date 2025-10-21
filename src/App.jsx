import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Community from './pages/Community/Community';
import Scan from './pages/Scan/Scan';
import Favorites from './pages/Favorites/Favorites';
import Chatbot from './pages/Chatbot/Chatbot';
import Notification from './pages/Notification/Notification';
import Settings from './pages/Settings/Settings';
import Login from './pages/Auth/Login';
import Chat from './pages/Chat/Chat';
import Messages from './pages/Messages/Messages';
import Monitoring from './pages/Monitoring/Monitoring';
import { useState, useEffect } from 'react';
import { auth } from './firebase/auth';
import { getRedirectResult } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { weatherService } from './utils/weatherService';
import { pushNotificationService } from './utils/pushNotificationService';
import { notificationService } from './utils/notificationService';
import Search from './pages/Search/Search';
import Profile from "./pages/Profile";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounting, setting up auth listener...');
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          console.log('OAuth redirect completed; user restored');
          setUser(result.user);
        }
      })
      .catch((err) => {
        console.warn('No pending redirect or error completing redirect:', err);
      });
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setUser(user);
      notificationService.setUser(user ? user.uid : 'guest');
      if (user) {
        weatherService.subscribeToRemoteWeather(user.uid);
      } else {
        weatherService.stopWeatherUpdates();
      }
      setLoading(false);
      
      if (user) {
        console.log('Initializing services for logged in user...');
        weatherService.init().catch(error => {
          console.error('Failed to initialize weather service:', error);
        });
        
        pushNotificationService.init().catch(error => {
          console.error('Failed to initialize push notifications:', error);
        });
      } else {
        console.log('No user, stopping weather updates');
        weatherService.stopWeatherUpdates();
      }
    });

    return () => {
      unsubscribe();
      weatherService.stopWeatherUpdates();
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
                <Route path="/chat/:userId" element={<Chat />} />
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