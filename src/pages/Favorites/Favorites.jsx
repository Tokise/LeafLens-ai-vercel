import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faLeaf,
  faBook,
  faComments,
  faHeart,
  faChevronDown,
  faChevronUp,
  faEye,
  faMessage,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { getUserFavorites, removeFromFavorites } from '../../firebase/favorites';
import Header from '../../components/header/Header';
import '../../css/Favorites.css';
import Navbar from '../../components/navbar/Navbar';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const result = await getUserFavorites();
      if (result.success) {
        setFavorites(result.favorites);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      const result = await removeFromFavorites(favoriteId);
      if (result.success) {
        setFavorites(favorites.filter(fav => fav.id !== favoriteId));
        toast.success('Plant removed from favorites');
      } else {
        toast.error('Failed to remove plant');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const openChatbot = (plant) => {
    // Navigate to chatbot with plant context
    navigate('/chatbot', { state: { plant } });
  };

  const toggleCard = (plantId) => {
    setExpandedCards(prev => ({
      ...prev,
      [plantId]: !prev[plantId]
    }));
  };

  if (loading) {
    return (
      <div className="favorites-loading">
        <div className="loading-spinner"></div>
        <p>Loading your plant collection...</p>
      </div>
    );
  }

  return (
    <div className="favorites-container">
     <Header />
     <Navbar />
      <h1>Favorites</h1>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="favorites-list">
        {favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FontAwesomeIcon icon={faHeart} />
            </div>
            <h3>No favorite plants yet</h3>
            <p>Start by scanning plants and adding them to your collection!</p>
          </div>
        ) : (
          favorites.map((favorite) => (
            <motion.div
              key={favorite.id}
              className="plant-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: favorites.indexOf(favorite) * 0.1 }}
            >
              <div
                className="plant-main"
                onClick={() => toggleCard(favorite.id)}
                style={{
                  backgroundImage: `url(${favorite.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="plant-overlay"></div>

                <div className="plant-info">
                  <h3 className="plant-name">{favorite.name}</h3>
                  <p className="scientific-name">{favorite.scientificName}</p>
                  <p className="description">{favorite.description}</p>
                </div>

                <div className="plant-actions-main">
                  <button
                    className="action-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openChatbot(favorite);
                    }}
                    title="Ask Expert"
                  >
                    <FontAwesomeIcon icon={faMessage} />
                  </button>
                  <button
                    className="action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(favorite.id);
                    }}
                    title="Remove"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button className="expand-btn">
                    <FontAwesomeIcon
                      icon={expandedCards[favorite.id] ? faChevronUp : faChevronDown}
                    />
                  </button>
                </div>
              </div>

              <motion.div
                className="plant-details-expanded"
                initial={false}
                animate={{
                  height: expandedCards[favorite.id] ? 'auto' : 0,
                  opacity: expandedCards[favorite.id] ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: 'hidden' }}
              >
                <div className="details-content">
                  <div className="care-guide">
                    <h4>
                      <FontAwesomeIcon icon={faBook} />
                      Care Guide
                    </h4>
                    <div className="care-grid">
                      <div className="care-item">
                        <div className="care-icon water">
                          <FontAwesomeIcon icon={faHeart} />
                        </div>
                        <div className="care-text">
                          <span className="care-label">Water</span>
                          <span className="care-value">{favorite.careGuide.water}</span>
                        </div>
                      </div>
                      <div className="care-item">
                        <div className="care-icon sunlight">
                          <FontAwesomeIcon icon={faHeart} />
                        </div>
                        <div className="care-text">
                          <span className="care-label">Sunlight</span>
                          <span className="care-value">{favorite.careGuide.sunlight}</span>
                        </div>
                      </div>
                      <div className="care-item">
                        <div className="care-icon soil">
                          <FontAwesomeIcon icon={faHeart} />
                        </div>
                        <div className="care-text">
                          <span className="care-label">Soil</span>
                          <span className="care-value">{favorite.careGuide.soil}</span>
                        </div>
                      </div>
                      <div className="care-item">
                        <div className="care-icon temperature">
                          <FontAwesomeIcon icon={faHeart} />
                        </div>
                        <div className="care-text">
                          <span className="care-label">Temperature</span>
                          <span className="care-value">{favorite.careGuide.temperature}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {favorite.funFacts && favorite.funFacts.length > 0 && (
                    <div className="fun-facts">
                      <h4>
                        <FontAwesomeIcon icon={faComments} />
                        Fun Facts
                      </h4>
                      <div className="facts-list">
                        {favorite.funFacts.map((fact, index) => (
                          <div key={index} className="fact-item">
                            <FontAwesomeIcon icon={faLeaf} />
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))
        )}
      </div>

      {selectedPlant && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedPlant(null)}
        >
          <motion.div
            className="modal-content"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="plant-name">{selectedPlant.name}</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedPlant(null)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Plant Image */}
            <div className="plant-image-container">
              <img
                src={selectedPlant.image}
                alt={selectedPlant.name}
                className="plant-image"
              />
            </div>

            {/* Plant Details */}
            <div className="plant-details">
              <div className="scientific-name">
                <FontAwesomeIcon icon={faLeaf} />
                <span>{selectedPlant.scientificName}</span>
              </div>
              <p className="description">{selectedPlant.description}</p>
            </div>

            {/* Care Guide Cards */}
            <div className="care-guide-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faBook} />
                Care Guide
              </h3>
              <div className="care-cards">
                <div className="care-card">
                  <div className="care-icon water">
                    <FontAwesomeIcon icon={faHeart} />
                  </div>
                  <div className="care-content">
                    <h4>Water</h4>
                    <p>{selectedPlant.careGuide.water}</p>
                  </div>
                </div>
                <div className="care-card">
                  <div className="care-icon sunlight">
                    <FontAwesomeIcon icon={faHeart} />
                  </div>
                  <div className="care-content">
                    <h4>Sunlight</h4>
                    <p>{selectedPlant.careGuide.sunlight}</p>
                  </div>
                </div>
                <div className="care-card">
                  <div className="care-icon soil">
                    <FontAwesomeIcon icon={faHeart} />
                  </div>
                  <div className="care-content">
                    <h4>Soil</h4>
                    <p>{selectedPlant.careGuide.soil}</p>
                  </div>
                </div>
                <div className="care-card">
                  <div className="care-icon temperature">
                    <FontAwesomeIcon icon={faHeart} />
                  </div>
                  <div className="care-content">
                    <h4>Temperature</h4>
                    <p>{selectedPlant.careGuide.temperature}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fun Facts */}
            {selectedPlant.funFacts && selectedPlant.funFacts.length > 0 && (
              <div className="fun-facts-section">
                <h3 className="section-title">
                  <FontAwesomeIcon icon={faComments} />
                  Fun Facts
                </h3>
                <div className="fun-facts-list">
                  {selectedPlant.funFacts.map((fact, index) => (
                    <div key={index} className="fun-fact-item">
                      <FontAwesomeIcon icon={faLeaf} />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                className="favorite-button"
                onClick={() => {
                  setSelectedPlant(null);
                  openChatbot(selectedPlant);
                }}
              >
                <FontAwesomeIcon icon={faMessage} />
                Ask Plant Expert About This Plant
              </button>

              <button
                className="monitoring-button"
                onClick={async () => {
                  const result = await addPlantToMonitoring({
                    ...selectedPlant,
                    wateringInterval: 3
                  });

                  if (result.success) {
                    toast.success('Added to monitoring!');
                    navigate('/monitoring');
                  } else {
                    toast.error('Failed to add to monitoring');
                  }
                }}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  background: 'transparent',
                  border: '2px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faClipboardList} />
                Track This Plant
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Favorites;
