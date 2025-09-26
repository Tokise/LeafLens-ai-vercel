// src/utils/camera.js

let CapacitorCamera;
let Camera;

if (typeof window !== "undefined" && window.Capacitor) {
  try {
    // Dynamic import only on device
    CapacitorCamera = require('@capacitor/camera');
    Camera = CapacitorCamera.Camera;
  } catch (e) {
    console.warn('Capacitor Camera plugin not available in this environment.');
  }
}

// Capture photo function
export const capturePhoto = async () => {
  if (Camera) {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'Base64',
        source: 'CAMERA', // CAMERA or PHOTOS
      });
      return { data: photo.base64String };
    } catch (err) {
      console.error(err);
      return { error: 'Failed to capture photo on device.' };
    }
  } else {
    return { error: 'Camera not available in this environment.' };
  }
};
