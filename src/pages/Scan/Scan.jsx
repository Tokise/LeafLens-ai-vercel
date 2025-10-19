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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = async (imageData) => {
    setCapturedImage(`data:image/jpeg;base64,${imageData}`);
    setIsAnalyzing(true);
    
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
        })
      });
      if (!plantIdRes.ok) throw new Error('Plant.id API error');
      const plantIdData = await plantIdRes.json();
      const suggestions = plantIdData.suggestions || [];
      if (suggestions.length === 0) throw new Error('No plant found');
      
      const best = suggestions[0];
      const plantName = best.plant_name || 'Unknown';
      const scientificName = best.plant_details?.scientific_name || plantName;
      
      // Improved prompt with better formatting instructions
      const openRouterPrompt = `Provide information about ${plantName} (${scientificName}). 
Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "description": "A brief 2-3 sentence description",
  "careGuide": {
    "water": "Watering instructions",
    "sunlight": "Light requirements",
    "soil": "Soil type needed",
    "temperature": "Temperature range"
  },
  "funFacts": [
    "Interesting fact 1",
    "Interesting fact 2",
    "Interesting fact 3"
  ]
}`;

      const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-maverick:free',
          messages: [{ role: 'user', content: openRouterPrompt }],
          max_tokens: 700,
          temperature: 0.7
        })
      });
      
      const openRouterData = await openRouterRes.json();
      let aiCareGuide = {}, aiFunFacts = [], aiDescription = '';
      
      try {
        let aiContent = openRouterData.choices[0].message.content;
        
        console.log('Raw AI Response:', aiContent);
        
        aiContent = aiContent.trim();
        if (aiContent.startsWith('```json')) {
          aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (aiContent.startsWith('```')) {
          aiContent = aiContent.replace(/```\n?/g, '');
        }
        
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiContent = jsonMatch[0];
        }
        
        const parsedContent = JSON.parse(aiContent);
        aiCareGuide = parsedContent.careGuide || {};
        aiFunFacts = parsedContent.funFacts || [];
        aiDescription = parsedContent.description || '';
        
        if (!aiFunFacts.length) {
          console.warn('No fun facts received, using fallback');
          aiFunFacts = [
            `${plantName} is a fascinating plant species.`,
            'This plant has unique characteristics that make it special.',
            'Plant care varies by species and environment.'
          ];
        }
        
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        console.log('Attempted to parse:', openRouterData.choices[0].message.content);
        
        aiCareGuide = {
          water: 'Water when soil is dry to touch',
          sunlight: 'Bright, indirect light',
          soil: 'Well-draining potting mix',
          temperature: '65-75°F (18-24°C)',
        };
        aiFunFacts = [
          `${plantName} is a unique plant species worth learning more about.`,
          'Each plant has specific care requirements for optimal growth.',
          'Regular observation helps you understand your plant\'s needs.'
        ];
        aiDescription = `${plantName} is a plant species that requires proper care and attention.`;
      }
      
      const plantInfo = {
        name: plantName,
        scientificName,
        description: aiDescription,
        careGuide: aiCareGuide,
        funFacts: aiFunFacts,
      };
      
      setPlantInfo(plantInfo);
      setIsAnalyzing(false);
      toast.success("Plant identified!");
      setShowModal(true);
      
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      toast.error("Failed to identify plant. Please try again.");
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
    document.body.classList.add('camera-mode');
    return () => {
      document.body.classList.remove('camera-mode');
    };
  }, []);

  return (
    <div className="scan-page" style={{ background: theme === 'dark' ? '#111' : '#f8f8f8', minHeight: '100vh' }}>
      {/* Scan Button */}
      <ScanButton onCapture={handleCapture} />

      {/* Analyzing Overlay */}
      {isAnalyzing && (
        <div className="analyzing-overlay">
          <div className="analyzing-content">
            <div className="analyzing-icon">
              <div className="leaf-icon-container">
                <FontAwesomeIcon icon={faLeaf} className="leaf-icon" />
              </div>
            </div>
            <h2>Analyzing Plant...</h2>
            <p>Our AI is identifying your plant</p>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
      )}

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
            {plantInfo.funFacts && plantInfo.funFacts.length > 0 && (
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