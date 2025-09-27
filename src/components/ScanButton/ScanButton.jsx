import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faSyncAlt, faTh, faCamera } from "@fortawesome/free-solid-svg-icons";
import '../../css/ScanButton.css';
// Detect if we are in the Android wrapper
const isAndroidWrapper = () => window.navigator.userAgent.includes("Median");

// Dynamically import Capacitor Camera only on device
let CameraModule;
if (typeof window !== "undefined" && window.Capacitor) {
  try {
    CameraModule = require("@capacitor/camera").Camera;
  } catch (e) {
    console.warn("Capacitor Camera plugin not available in this environment.");
  }
}



const ScanButton = ({ onCapture }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  useEffect(() => {
    if (isCapturing) {
      document.body.classList.add("hide-bottom-nav");
    } else {
      document.body.classList.remove("hide-bottom-nav");
    }
    return () => document.body.classList.remove("hide-bottom-nav");
  }, [isCapturing]);
  const [facingMode, setFacingMode] = useState("environment"); // back camera
  const [flashMode, setFlashMode] = useState("off"); // android only
  const [timer, setTimer] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Web camera start
  const startCameraWeb = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      streamRef.current = stream;
      setIsCapturing(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start camera.");
    }
  };

  // Stop web camera
  const stopCameraWeb = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setIsCapturing(false);
    }
  };

  const switchCamera = async () => {
    if (isAndroidWrapper()) {
      toast("Camera switching is automatic on Android.");
    } else {
      stopCameraWeb();
      setFacingMode(facingMode === "environment" ? "user" : "environment");
      setTimeout(startCameraWeb, 100);
    }
  };

  const toggleFlash = () => {
    if (!isAndroidWrapper()) return;
    const modes = ["off", "on", "auto"];
    const nextIndex = (modes.indexOf(flashMode) + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
    toast(`Flash: ${modes[nextIndex]}`);
  };

  const setTimerMode = () => {
    const timers = [0, 3, 5, 10];
    const nextIndex = (timers.indexOf(timer) + 1) % timers.length;
    setTimer(timers[nextIndex]);
  };

  const toggleGrid = () => setShowGrid(!showGrid);

  const capturePhoto = async () => {
    setLoading(true);
    try {
      if (timer > 0) {
        toast.loading(`Capturing in ${timer}s...`, { duration: timer * 1000 });
        await new Promise((res) => setTimeout(res, timer * 1000));
      }

      if (isAndroidWrapper() && CameraModule) {
        // Capacitor Android capture
        const result = await CameraModule.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: "Base64",
          source: "CAMERA",
          direction: facingMode === "user" ? "FRONT" : "BACK",
          flash: flashMode.toUpperCase(),
        });
        if (result.base64String) onCapture(result.base64String);
        else toast.error("Failed to capture image.");
      } else {
        // Web capture via canvas
        if (!videoRef.current) {
          toast.error("Camera not started.");
          setLoading(false);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg").split(",")[1];
        onCapture(imageData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to capture image.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAndroidWrapper()) startCameraWeb();
    return () => stopCameraWeb();
  }, [facingMode]);

  return (
    <div className="scan-button-wrapper">
      {/* Top Controls */}
      <div className="camera-controls-top">
        <button onClick={switchCamera} title="Switch Camera">
          <FontAwesomeIcon icon={faSyncAlt} />
        </button>
        {isAndroidWrapper() && (
          <button onClick={toggleFlash} title={`Flash: ${flashMode}`}>
            <FontAwesomeIcon icon={faBolt} />
          </button>
        )}
        <button onClick={toggleGrid} title="Grid Overlay">
          <FontAwesomeIcon icon={faTh} />
        </button>
        <button onClick={setTimerMode} title={`Timer: ${timer}s`}>
          {timer > 0 ? `${timer}s` : "Timer"}
        </button>
      </div>

      {/* Camera Preview */}
      <div className="camera-preview">
        {!isAndroidWrapper() && (
          <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        )}
        {showGrid && <div className="camera-grid-overlay"></div>}
      </div>

      {/* Bottom Controls */}
      <div className="camera-controls-bottom">
        <button className="capture-btn" onClick={capturePhoto} disabled={loading}>
          <FontAwesomeIcon icon={faCamera} /> {loading ? "Capturing..." : "Capture"}
        </button>
      </div>
    </div>
  );
};

export default ScanButton;
