import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaTimes, FaSync, FaVideo, FaStop, FaCamera } from 'react-icons/fa';

const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
  </div>
);

export default function CameraModal({ onClose, onCapture }) {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordTime, setRecordTime] = useState(0);

  // --- منطق الوقت (التايمر) ---
  useEffect(() => {
    let interval = null;
    if (capturing) {
      interval = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [capturing]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // --- منطق الفيديو ---
  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    setRecordedChunks([]);
    setRecordTime(0);
    
    const mimeType = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, { mimeType });
    mediaRecorderRef.current.addEventListener("dataavailable", ({ data }) => {
      if (data.size > 0) setRecordedChunks((prev) => prev.concat(data));
    });
    mediaRecorderRef.current.start();
  }, []);

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, []);

  // إرسال الفيديو بعد التسجيل
  useEffect(() => {
    if (!capturing && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
      onCapture(file);
      onClose();
    }
  }, [capturing, recordedChunks, onClose, onCapture]);

  // --- منطق الصورة ---
  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
          onCapture(file);
          onClose();
        });
    }
  };

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal-content">
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
        
        {!isCameraReady && <LoadingSpinner />}

        <Webcam
          audio={true}
          muted={true} // لمنع صدى الصوت أثناء التسجيل
          ref={webcamRef}
          videoConstraints={{ facingMode }}
          className="webcam-preview"
          onUserMedia={() => setIsCameraReady(true)}
        />

        {isCameraReady && (
          <div className="camera-actions">
            <button onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}>
              <FaSync />
            </button>
            
            {capturing ? (
              <div className="recording-status">
                <div className="recording-dot"></div>
                <span className="recording-timer">{formatTime(recordTime)}</span>
                <button className="capture-btn stop" onClick={handleStopCaptureClick}>
                  <FaStop />
                </button>
              </div>
            ) : (
              <>
                <button className="capture-btn" onClick={captureImage} title="التقاط صورة"><FaCamera /></button>
                <button className="capture-btn" onClick={handleStartCaptureClick} title="بدء تسجيل فيديو"><FaVideo /></button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}