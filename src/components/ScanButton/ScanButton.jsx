import { useState, useRef, useEffect } from "react";
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faSyncAlt, faTh, faCamera, faHeart, faFolderOpen, faArrowLeft, faClock } from "@fortawesome/free-solid-svg-icons";
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
  const { theme } = useTheme();
  const [showTimerSelect, setShowTimerSelect] = useState(false);
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  useEffect(() => {
    if (window.location.pathname === '/scan') {
      if (isCapturing) {
        document.body.classList.add("hide-bottom-nav");
      } else {
        document.body.classList.remove("hide-bottom-nav");
      }
      return () => document.body.classList.remove("hide-bottom-nav");
    }
  }, [isCapturing]);
  const [facingMode, setFacingMode] = useState("environment"); // back camera
  const [mode, setMode] = useState("normal"); // normal, square, portrait
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
  <div className="scan-button-wrapper" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', minHeight: 0, overflow: 'hidden' }}>
      {/* Top Controls: absolute row */}
      <div className="camera-controls-top" style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', zIndex: 10 }}>
        {/* Back button uses React Router navigation */}
        <button className="icon-btn" onClick={() => navigate('/') /* or useNavigate() */}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div style={{ display: 'flex', gap: '18px', justifyContent: 'center', alignItems: 'center' }}>
          {isAndroidWrapper() && (
            <button className={`icon-btn${flashMode !== 'off' ? ' active' : ''}`} onClick={toggleFlash}>
              <FontAwesomeIcon icon={faBolt} color={flashMode !== 'off' ? '#4CAF50' : theme === 'dark' ? '#fff' : '#222'} />
            </button>
          )}
          <button className={`icon-btn${showGrid ? ' active' : ''}`} onClick={toggleGrid}>
            <FontAwesomeIcon icon={faTh} color={showGrid ? '#4CAF50' : theme === 'dark' ? '#fff' : '#222'} />
          </button>
          <div style={{ position: 'relative' }}>
            <button className={`icon-btn${timer > 0 ? ' active' : ''}`} onClick={() => setShowTimerSelect(v => !v)}>
              <FontAwesomeIcon icon={faClock} color={timer > 0 ? '#4CAF50' : theme === 'dark' ? '#fff' : '#222'} />
            </button>
            {showTimerSelect && (
              <div className="timer-select-dropdown" style={{ position: 'absolute', top: 40, right: 0, background: theme === 'dark' ? '#222' : '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 20 }}>
                {[0,3,5,10].map(t => (
                  <button key={t} className={`timer-option${timer === t ? ' selected' : ''}`} style={{ display: 'block', width: '100%', padding: '8px 16px', background: timer === t ? '#4CAF50' : 'transparent', color: timer === t ? '#fff' : theme === 'dark' ? '#fff' : '#222', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => { setTimer(t); setShowTimerSelect(false); }}>
                    {t === 0 ? 'No Timer' : `${t}s`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Favorite icon navigates to /favorites */}
        <button className="icon-btn" onClick={() => navigate('/favorites')}>
          <FontAwesomeIcon icon={faHeart} />
        </button>
      </div>

      {/* Mode Selector: below top controls */}
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', zIndex: 9 }}>
        <button className={`mode-btn${mode === 'normal' ? ' active' : ''}`} onClick={() => setMode('normal')}>NORMAL</button>
        <button className={`mode-btn${mode === 'square' ? ' active' : ''}`} onClick={() => setMode('square')}>SQUARE</button>
        <button className={`mode-btn${mode === 'portrait' ? ' active' : ''}`} onClick={() => setMode('portrait')}>PORTRAIT</button>
      </div>

      {/* Camera Preview or Placeholder */}
  <div className="camera-preview" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: '100%', minHeight: 0 }}>
        {!isAndroidWrapper() && videoRef.current && videoRef.current.srcObject ? (
          <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        ) : (
          <div className="camera-placeholder" style={{ textAlign: 'center', color: '#888' }}>
            <FontAwesomeIcon icon={faCamera} style={{ fontSize: 64, opacity: 0.5 }} />
            <div style={{ marginTop: 12 }}>Camera Ready</div>
          </div>
        )}
        {/* 2x2 grid overlay (3x3 squares) when showGrid is true */}
        {showGrid && (
          <div className="camera-grid-overlay" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 8,
          }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* 2 vertical lines (33%, 66%) and 2 horizontal lines (33%, 66%) */}
              <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom Controls: absolute row */}
      <div className="camera-controls-bottom" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', zIndex: 10 }}>
        <button className="icon-btn" onClick={switchCamera}>
          <FontAwesomeIcon icon={faSyncAlt} />
        </button>
        {/* Timer logic: if timer > 0, start countdown after camera button click */}
        <button className="capture-btn" style={{ margin: '0 auto' }} onClick={() => {
          if (timer > 0) {
            setLoading(true);
            let countdown = timer;
            const interval = setInterval(() => {
              countdown--;
              toast(`Capturing in ${countdown}...`);
              if (countdown <= 0) {
                clearInterval(interval);
                setLoading(false);
                capturePhoto();
              }
            }, 1000);
          } else {
            capturePhoto();
          }
        }} disabled={loading}>
          <FontAwesomeIcon icon={faCamera} />
        </button>
        <button className="icon-btn" onClick={() => {
          // Open file picker for image upload
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              toast.success('Image selected!');
              // Convert image to base64 and pass to onCapture
              const reader = new FileReader();
              reader.onload = function(evt) {
                // evt.target.result is a base64 data URL
                const base64 = evt.target.result.split(',')[1];
                onCapture(base64);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }}>
          <FontAwesomeIcon icon={faFolderOpen} />
        </button>
      </div>
    </div>
  );
};

export default ScanButton;
