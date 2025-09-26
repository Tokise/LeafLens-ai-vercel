import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Home from './pages/Home/Home';
import Scan from './pages/Scan/Scan';
import Favorites from './pages/Favorites/Favorites';
import Chatbot from './pages/Chatbot/Chatbot';
import Notification from './pages/Notification/Notification';
import Settings from './pages/Settings/Settings';
import Login from './pages/Auth/Login';
import { useState, useEffect } from 'react';
import { auth } from './firebase/auth';
import { getRedirectResult } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { weatherService } from './utils/weatherService';
import { pushNotificationService } from './utils/pushNotificationService';
import { notificationService } from './utils/notificationService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounting, setting up auth listener...');
    // Complete any pending OAuth redirect as early as possible
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
      // Scope notifications by user
      notificationService.setUser(user ? user.uid : 'guest');
      // Begin real-time sync of weather notifications for this user
      if (user) {
        weatherService.subscribeToRemoteWeather(user.uid);
      } else {
        weatherService.stopWeatherUpdates();
      }
      setLoading(false);
      
      // Initialize weather service when user logs in
      if (user) {
        console.log('Initializing services for logged in user...');
        // Initialize weather service
        weatherService.init().catch(error => {
          console.error('Failed to initialize weather service:', error);
        });
        
        // Initialize push notifications
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
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scan" element={<Scan />} />
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

export default App
