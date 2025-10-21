// components/ScanResults/ScanResults.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faHeart,
    faTint,
    faSun,
    faSeedling,
    faTemperatureHigh,
    faLightbulb,
    faBookmark,
    faShare
} from '@fortawesome/free-solid-svg-icons';
import { addToFavorites } from '../../firebase/favorites';
import { addPlantToMonitoring } from '../../firebase/monitoring';
import { toast } from 'react-hot-toast';
import './ScanResult.css';

const ScanResults = ({ plantInfo, plantImage, onClose }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('care');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await addToFavorites({
                name: plantInfo.name,
                scientificName: plantInfo.scientificName,
                description: plantInfo.description,
                careGuide: plantInfo.careGuide,
                funFacts: plantInfo.funFacts,
                image: plantImage,
            });

            if (result.success) {
                toast.success('Plant saved to favorites!');
            } else {
                toast.error('Failed to save plant');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
        setIsSaving(false);
    };

    const handleAddToMonitoring = async () => {
        try {
            const result = await addPlantToMonitoring({
                name: plantInfo.name,
                scientificName: plantInfo.scientificName,
                description: plantInfo.description,
                careGuide: plantInfo.careGuide,
                image: plantImage,
                wateringInterval: 3
            });

            if (result.success) {
                toast.success('Plant added to monitoring!');
                navigate('/monitoring');
            } else {
                toast.error('Failed to add to monitoring');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    return (
        <div className="scan-results-container">
            {/* Header */}
            <div className="scan-results-header">
                <button className="back-btn" onClick={onClose}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <h1>Scan Results</h1>
                <div className="header-actions">
                    <button className="icon-btn" onClick={handleSave}>
                        <FontAwesomeIcon icon={faBookmark} />
                    </button>
                    <button className="icon-btn">
                        <FontAwesomeIcon icon={faShare} />
                    </button>
                </div>
            </div>

            {/* Plant Image */}
            <div className="plant-image-section">
                <img src={plantImage} alt={plantInfo.name} />
                <div className="match-badge">89% Match</div>
            </div>

            {/* Plant Info */}
            <div className="plant-info-section">
                <h2 className="plant-title">{plantInfo.name}</h2>
                <p className="scientific-name">{plantInfo.scientificName}</p>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab ${activeTab === 'care' ? 'active' : ''}`}
                    onClick={() => setActiveTab('care')}
                >
                    Care Guide
                </button>
                <button
                    className={`tab ${activeTab === 'facts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('facts')}
                >
                    Fun Facts
                </button>
              
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'care' && (
                    <div className="care-guide-content">
                        <div className="care-item">
                            <div className="care-icon water">
                                <FontAwesomeIcon icon={faTint} />
                            </div>
                            <div className="care-details">
                                <h4>Watering</h4>
                                <p>{plantInfo.careGuide?.water || 'Water regularly'}</p>
                            </div>
                        </div>

                        <div className="care-item">
                            <div className="care-icon sunlight">
                                <FontAwesomeIcon icon={faSun} />
                            </div>
                            <div className="care-details">
                                <h4>Sunlight</h4>
                                <p>{plantInfo.careGuide?.sunlight || 'Bright indirect light'}</p>
                            </div>
                        </div>

                        <div className="care-item">
                            <div className="care-icon soil">
                                <FontAwesomeIcon icon={faSeedling} />
                            </div>
                            <div className="care-details">
                                <h4>Soil</h4>
                                <p>{plantInfo.careGuide?.soil || 'Well-draining soil'}</p>
                            </div>
                        </div>

                        <div className="care-item">
                            <div className="care-icon temperature">
                                <FontAwesomeIcon icon={faTemperatureHigh} />
                            </div>
                            <div className="care-details">
                                <h4>Temperature</h4>
                                <p>{plantInfo.careGuide?.temperature || '65-75°F (18-24°C)'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'facts' && (
                    <div className="fun-facts-content">
                        {plantInfo.funFacts?.map((fact, index) => (
                            <div key={index} className="fact-card">
                                <div className="fact-number">{index + 1}</div>
                                <p>{fact}</p>
                            </div>
                        ))}
                    </div>
                )}


            </div>

            {/* Bottom Actions */}
            <div className="bottom-actions">
                <button className="primary-btn" onClick={handleAddToMonitoring}>
                    <FontAwesomeIcon icon={faSeedling} />
                    Monitor
                </button>
            </div>
        </div>
    );
};

export default ScanResults;