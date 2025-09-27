import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ScanButton from "../../components/ScanButton/ScanButton";
import { addToFavorites } from "../../firebase/favorites";
import { notificationService } from "../../utils/notificationService";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faLeaf, faBook, faSun, faTint, faTemperatureHigh, faSeedling, faHeart } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import '../../css/Scan.css';



const Scan = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [capturedImage, setCapturedImage] = useState(null);
  const [plantInfo, setPlantInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleCapture = async (imageData) => {
    setCapturedImage(`data:image/jpeg;base64,${imageData}`);
    toast.loading("Identifying plant...", { id: "plantid" });
    try {
      // Plant.id API
      const plantIdApiKey = import.meta.env.VITE_PLANTID_API_KEY;
      const plantIdRes = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': plantIdApiKey,
        },
        body: JSON.stringify({
          images: [imageData],
          /* You can add modifiers, plant details, etc. if needed */
        })
      });
      if (!plantIdRes.ok) throw new Error('Plant.id API error');
      const plantIdData = await plantIdRes.json();
      const suggestions = plantIdData.suggestions || [];
      if (suggestions.length === 0) throw new Error('No plant found');
      // Use best suggestion
      const best = suggestions[0];
      const plantName = best.plant_name || 'Unknown';
      const scientificName = best.plant_details?.scientific_name || plantName;
      toast.dismiss("plantid");
      toast.loading("Getting care guide and fun facts...", { id: "openrouter-ai" });
      // Query OpenRouter
      const openRouterPrompt = `Give a care guide and 3 fun facts for the plant: ${plantName} (${scientificName}). Format response as JSON with keys: careGuide (object with water, sunlight, soil, temperature), funFacts (array of strings), description (string).`;
      const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: 'x-ai/grok-4-fast:free',
          messages: [{ role: 'user', content: openRouterPrompt }],
          max_tokens: 512
        })
      });
      const openRouterData = await openRouterRes.json();
      let aiCareGuide = {}, aiFunFacts = [], aiDescription = '';
      try {
        const aiContent = JSON.parse(openRouterData.choices[0].message.content);
        aiCareGuide = aiContent.careGuide || {};
        aiFunFacts = aiContent.funFacts || [];
        aiDescription = aiContent.description || '';
      } catch (e) {
        aiCareGuide = {
          water: 'See external sources',
          sunlight: 'See external sources',
          soil: 'See external sources',
          temperature: 'See external sources',
        };
        aiFunFacts = [];
        aiDescription = '';
      }
      const plantInfo = {
        name: plantName,
        scientificName,
        description: aiDescription,
        careGuide: aiCareGuide,
        funFacts: aiFunFacts,
      };
      setPlantInfo(plantInfo);
      toast.dismiss("openrouter-ai");
      toast.success("Plant info ready!");
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.dismiss("plantid");
      toast.dismiss("openrouter-ai");
      toast.error("Failed to get plant info. Please try again.");
    }
  };

  const handleAddToFavorites = async () => {
    if (!plantInfo || !capturedImage) return;

    try {
      const result = await addToFavorites({
        name: plantInfo.name,
        scientificName: plantInfo.scientificName,
        description: plantInfo.description,
        careGuide: plantInfo.careGuide,
        funFacts: plantInfo.funFacts,
        image: capturedImage,
      });

      if (result.success) {
        toast.success("Plant added to favorites!");
        notificationService.createPlantSavedNotification(plantInfo.name);
      } else {
        toast.error("Failed to add to favorites. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    // Add camera mode class to body when scan page is active
    document.body.classList.add('camera-mode');
    return () => {
      document.body.classList.remove('camera-mode');
    };
  }, []);

  return (
    <div className="scan-page" style={{ background: theme === 'dark' ? '#111' : '#f8f8f8', minHeight: '100vh' }}>
      {/* Scan Button */}
      <ScanButton onCapture={handleCapture} />

      {/* Modal for plant info */}
      {showModal && plantInfo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: theme === 'dark' ? '#222' : '#fff', color: theme === 'dark' ? '#fff' : '#222' }}>
            <div className="modal-header">
              <h2 className="plant-name">{plantInfo.name}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="plant-image-container">
              <img src={capturedImage} alt="Plant" className="plant-image" />
            </div>
            <div className="plant-details">
              <div className="scientific-name">
                <FontAwesomeIcon icon={faLeaf} />
                {plantInfo.scientificName}
              </div>
              <p className="description">{plantInfo.description}</p>
            </div>
            <div className="care-guide-section">
              <div className="section-title">
                <FontAwesomeIcon icon={faBook} /> Care Guide
              </div>
              <div className="care-cards">
                <div className="care-card">
                  <div className="care-icon water"><FontAwesomeIcon icon={faTint} /></div>
                  <div className="care-content"><h4>Water</h4><p>{plantInfo.careGuide.water}</p></div>
                </div>
                <div className="care-card">
                  <div className="care-icon sunlight"><FontAwesomeIcon icon={faSun} /></div>
                  <div className="care-content"><h4>Sunlight</h4><p>{plantInfo.careGuide.sunlight}</p></div>
                </div>
                <div className="care-card">
                  <div className="care-icon soil"><FontAwesomeIcon icon={faSeedling} /></div>
                  <div className="care-content"><h4>Soil</h4><p>{plantInfo.careGuide.soil}</p></div>
                </div>
                <div className="care-card">
                  <div className="care-icon temperature"><FontAwesomeIcon icon={faTemperatureHigh} /></div>
                  <div className="care-content"><h4>Temperature</h4><p>{plantInfo.careGuide.temperature}</p></div>
                </div>
              </div>
            </div>
            {plantInfo.funFacts && (
              <div className="fun-facts-section">
                <div className="section-title"><FontAwesomeIcon icon={faBook} /> Fun Facts</div>
                <div className="fun-facts-list">
                  {plantInfo.funFacts.map((fact, idx) => (
                    <div className="fun-fact-item" key={idx}>
                      <FontAwesomeIcon icon={faLeaf} />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button className="favorite-button" onClick={handleAddToFavorites}>
                <FontAwesomeIcon icon={faHeart} /> Add to Favorites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scan;
