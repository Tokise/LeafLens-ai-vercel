import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ScanButton from "../../components/scanbutton/Scanbutton";
import { addToFavorites } from "../../firebase/favorites";
import { notificationService } from "../../utils/notificationService";
import '../../css/Scan.css';

const Scan = () => {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState(null);
  const [plantInfo, setPlantInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleCapture = async (imageData) => {
    setCapturedImage(`data:image/jpeg;base64,${imageData}`);
    toast.loading("Analyzing plant...", { id: "plant-analysis" });

    try {
      // TODO: replace with your AI plant identification API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockPlantInfo = {
        name: "Sample Plant",
        scientificName: "Plantus Exampleus",
        description:
          "This is a sample plant description that provides information about the identified plant species.",
        careGuide: {
          water: "Water twice a week",
          sunlight: "Partial shade to full sun",
          soil: "Well-draining potting mix",
          temperature: "65-80°F (18-27°C)",
        },
        funFacts: [
          "This plant is native to various regions.",
          "It has been used in traditional medicine.",
          "Can grow up to 2 meters tall.",
        ],
      };

      setPlantInfo(mockPlantInfo);
      toast.dismiss("plant-analysis");
      toast.success("Plant identified successfully!");
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.dismiss("plant-analysis");
      toast.error("Failed to analyze plant. Please try again.");
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

  return (
    <div className="scan-page">
      <h1>LeafLens AI Scanner</h1>

      {/* Scan Button */}
      <ScanButton onCapture={handleCapture} />

      {/* Display captured image */}
      {capturedImage && (
        <div className="captured-image-container">
          <img src={capturedImage} alt="Captured Plant" />
        </div>
      )}

      {/* Modal for plant info */}
      {showModal && plantInfo && (
        <div className="plant-modal">
          <h2>{plantInfo.name}</h2>
          <p><strong>Scientific Name:</strong> {plantInfo.scientificName}</p>
          <p>{plantInfo.description}</p>

          <h3>Care Guide</h3>
          <ul>
            <li>Water: {plantInfo.careGuide.water}</li>
            <li>Sunlight: {plantInfo.careGuide.sunlight}</li>
            <li>Soil: {plantInfo.careGuide.soil}</li>
            <li>Temperature: {plantInfo.careGuide.temperature}</li>
          </ul>

          {plantInfo.funFacts && (
            <>
              <h3>Fun Facts</h3>
              <ul>
                {plantInfo.funFacts.map((fact, index) => (
                  <li key={index}>{fact}</li>
                ))}
              </ul>
            </>
          )}

          <button onClick={handleAddToFavorites}>Add to Favorites</button>
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default Scan;
