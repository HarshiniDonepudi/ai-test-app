import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ImageUpload.css';

function ImageUpload({ onAnalysisComplete, onAnalysisStart, onError }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseCamera(true);
    } catch (err) {
      onError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setPreview(imageData);
      setSelectedImage(imageData);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      onError('Please select or capture an image first.');
      return;
    }

    onAnalysisStart();

    try {
      let response;

      if (typeof selectedImage === 'string') {
        // Base64 image from camera
        response = await axios.post('/api/analyze/base64', {
          image: selectedImage
        });
      } else {
        // File upload
        const formData = new FormData();
        formData.append('image', selectedImage);
        response = await axios.post('/api/analyze/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      onAnalysisComplete(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to analyze image';
      onError(errorMessage);
      console.error('Analysis error:', err);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreview(null);
    setUseCamera(false);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <div className="upload-card">
        <h2>Upload or Capture Wound Image</h2>

        {!preview && !useCamera && (
          <div className="upload-options">
            <div className="upload-box" onClick={() => fileInputRef.current.click()}>
              <div className="upload-icon">📁</div>
              <h3>Upload Image</h3>
              <p>Click to select a wound image from your device</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            <div className="upload-box" onClick={startCamera}>
              <div className="upload-icon">📸</div>
              <h3>Take Photo</h3>
              <p>Use your camera to capture a wound image</p>
            </div>
          </div>
        )}

        {useCamera && (
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-video"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="camera-controls">
              <button onClick={capturePhoto} className="btn-primary">
                📸 Capture Photo
              </button>
              <button onClick={stopCamera} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {preview && !useCamera && (
          <div className="preview-container">
            <img src={preview} alt="Wound preview" className="preview-image" />
            <div className="preview-controls">
              <button onClick={handleAnalyze} className="btn-primary">
                🔍 Analyze Wound
              </button>
              <button onClick={handleReset} className="btn-secondary">
                Choose Different Image
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="info-box">
        <h3>ℹ️ Important Guidelines</h3>
        <ul>
          <li>Ensure good lighting when capturing images</li>
          <li>Take photos from a consistent distance (6-12 inches)</li>
          <li>Include a reference object if possible for size estimation</li>
          <li>Capture the entire wound and surrounding tissue</li>
          <li>This tool is for assessment only - always verify with clinical examination</li>
        </ul>
      </div>
    </div>
  );
}

export default ImageUpload;
