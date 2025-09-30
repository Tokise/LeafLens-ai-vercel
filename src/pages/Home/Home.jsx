import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/auth';
import Header from '../../components/header/Header';
import '../../css/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleProfileClick = () => {
    navigate('/settings'); // Or your profile page route
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  return (
    <div className="home-container">
      <Header />
      <section className="hero-section">
        <h1>Welcome to LeafLens AI</h1>
        <p className="subtitle">Your smart companion for plant identification and care</p>
        
        <div className="quick-actions">
          <button 
            className="action-button primary"
            onClick={() => navigate('/scan')}
          >
            Scan a Plant
          </button>
          <button 
            className="action-button secondary"
            onClick={() => navigate('/favorites')}
          >
            View Favorites
          </button>
        </div>
      </section>

      <section className="features-section">
        <h2>What you can do</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Identify Plants</h3>
            <p>Take a photo or upload an image to identify any plant instantly</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌱</div>
            <h3>Care Guides</h3>
            <p>Get detailed care instructions for your identified plants</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💭</div>
            <h3>Plant Expert Chat</h3>
            <p>Ask questions and get advice from our AI plant expert</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Save Favorites</h3>
            <p>Build your collection of identified plants and care guides</p>
          </div>
        </div>
      </section>

   

    </div>
  );
};

export default Home;
