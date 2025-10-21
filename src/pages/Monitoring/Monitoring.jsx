import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTint, faSun, faSeedling, faTemperatureHigh, faCalendar, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getMonitoredPlants, updatePlantWatering, removePlantFromMonitoring } from '../../firebase/monitoring';
import { toast } from 'react-hot-toast';
import Header from '../../components/header/Header';
import { useTheme } from '../../context/ThemeContext';
import '../../css/Monitoring.css';

const Monitoring = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    const result = await getMonitoredPlants();
    if (result.success) {
      setPlants(result.plants);
    }
    setLoading(false);
  };

  const markAsWatered = async (plantId) => {
    const result = await updatePlantWatering(plantId);
    if (result.success) {
      toast.success('Plant watered!');
      loadPlants();
    } else {
      toast.error('Failed to update plant');
    }
  };

  const deletePlant = async (plantId) => {
    if (!window.confirm('Remove this plant from monitoring?')) return;
    
    const result = await removePlantFromMonitoring(plantId);
    if (result.success) {
      toast.success('Plant removed from monitoring');
      loadPlants();
    } else {
      toast.error('Failed to remove plant');
    }
  };

  const getDaysUntilWatering = (nextWatering) => {
    if (!nextWatering) return null;
    const next = nextWatering.toDate ? nextWatering.toDate() : new Date(nextWatering);
    const today = new Date();
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPlantStatus = (plant) => {
    const daysUntil = getDaysUntilWatering(plant.nextWatering);
    if (daysUntil === null) return 'unknown';
    if (daysUntil < 0) return 'overdue';
    if (daysUntil === 0) return 'today';
    if (daysUntil <= 1) return 'soon';
    return 'healthy';
  };

  const filteredPlants = plants.filter(plant => {
    if (filter === 'all') return true;
    const status = getPlantStatus(plant);
    if (filter === 'needs-care') return ['overdue', 'today', 'soon'].includes(status);
    if (filter === 'healthy') return status === 'healthy';
    return true;
  });

  const formatDate = (date) => {
    if (!date) return 'Not set';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="monitoring-container">
      <Header />
      
      <div className="monitoring-content">
        <div className="monitoring-header">
          <h1>Monitor</h1>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({plants.length})
          </button>
          <button
            className={`filter-tab ${filter === 'needs-care' ? 'active' : ''}`}
            onClick={() => setFilter('needs-care')}
          >
            Needs Care
          </button>
          <button
            className={`filter-tab ${filter === 'healthy' ? 'active' : ''}`}
            onClick={() => setFilter('healthy')}
          >
            Healthy
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your plants...</p>
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h3>No plants to monitor yet</h3>
            <p>Add plants from your favorites to start tracking their care schedule</p>
            <button className="cta-btn" onClick={() => navigate('/favorites')}>
              Go to Favorites
            </button>
          </div>
        ) : (
          <div className="plants-grid">
            {filteredPlants.map((plant) => {
              const status = getPlantStatus(plant);
              const daysUntil = getDaysUntilWatering(plant.nextWatering);

              return (
                <div key={plant.id} className={`plant-card status-${status}`}>
                  <div className="plant-card-image">
                    {plant.image ? (
                      <img src={plant.image} alt={plant.name} />
                    ) : (
                      <div className="image-placeholder">
                        <FontAwesomeIcon icon={faSeedling} />
                      </div>
                    )}
                    <div className="status-badge">
                      {status === 'overdue' && '⚠️ Overdue'}
                      {status === 'today' && '💧 Water Today'}
                      {status === 'soon' && '⏰ Soon'}
                      {status === 'healthy' && '✅ Healthy'}
                    </div>
                  </div>

                  <div className="plant-card-content">
                    <div className="plant-card-header">
                      <h3>{plant.name}</h3>
                    </div>

                    <p className="scientific-name">{plant.scientificName}</p>

                    <div className="watering-info">
                      <div className="info-row">
                        <FontAwesomeIcon icon={faTint} className="icon water" />
                        <div className="info-text">
                          <span className="label">Last Watered</span>
                          <span className="value">{formatDate(plant.lastWatered)}</span>
                        </div>
                      </div>
                      <div className="info-row">
                        <FontAwesomeIcon icon={faCalendar} className="icon calendar" />
                        <div className="info-text">
                          <span className="label">Next Watering</span>
                          <span className="value">
                            {daysUntil !== null ? (
                              daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                              daysUntil === 0 ? 'Today' :
                              `In ${daysUntil} days`
                            ) : 'Not set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="care-stats">
                      <div className="stat">
                        <FontAwesomeIcon icon={faSun} />
                        <span>{plant.careGuide?.sunlight || 'N/A'}</span>
                      </div>
                      <div className="stat">
                        <FontAwesomeIcon icon={faTemperatureHigh} />
                        <span>{plant.careGuide?.temperature || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="plant-actions">
                      <button
                        className="action-btn primary"
                        onClick={() => markAsWatered(plant.id)}
                      >
                        <FontAwesomeIcon icon={faTint} />
                        <span>Water Now</span>
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => deletePlant(plant.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;