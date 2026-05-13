import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { FiCamera, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';

const T = {
  orange:       '#E8622A',
  orangeGlow:   'rgba(232,98,42,0.15)',
  green:        '#2D9B6F',
  surface:      '#FFFFFF',
  surfaceMid:   '#FFF5EE',
  border:       'rgba(28,25,23,0.08)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
};

export const FaceCapture = ({ onCapture, existingImage }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(existingImage || null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    onCapture(imageSrc);
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImgSrc(null);
    onCapture(null);
  };

  return (
    <div className="space-y-4">
      <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginLeft: 4 }}>
        Face Verification <span style={{ color: '#ef4444' }}>*</span>
      </label>
      
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '4/3', 
          background: T.surfaceMid, 
          borderRadius: 20, 
          border: `2px dashed ${imgSrc ? T.green : T.border}`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        {imgSrc ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img 
              src={imgSrc} 
              alt="Captured face" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)' 
            }} />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={retake}
              style={{
                position: 'absolute', bottom: 16, right: 16,
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.95)', color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', cursor: 'pointer'
              }}
            >
              <FiRefreshCw size={20} />
            </motion.button>
            <div style={{
              position: 'absolute', top: 16, left: 16,
              padding: '6px 12px', borderRadius: 8,
              background: T.green, color: 'white',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(45, 155, 111, 0.2)'
            }}>
              <FiCheck size={14} /> Face Captured
            </div>
          </div>
        ) : (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              onUserMedia={() => setIsCameraReady(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isCameraReady && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* Face Frame Overlay */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60%', height: '70%',
                  border: `2px solid ${T.orange}`,
                  borderRadius: '50% 50% 45% 45%',
                  boxShadow: `0 0 0 1000px rgba(255, 255, 255, 0.5)`,
                  opacity: 0.9
                }} />
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={capture}
                  style={{
                    position: 'absolute', bottom: 24, left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '12px 24px', borderRadius: 100,
                    background: T.orange, color: 'white',
                    border: 'none', display: 'flex', alignItems: 'center', gap: 8,
                    fontWeight: 700, fontSize: 14, pointerEvents: 'auto',
                    boxShadow: `0 8px 16px ${T.orangeGlow}`, cursor: 'pointer'
                  }}
                >
                  <FiCamera size={18} /> Capture Photo
                </motion.button>
              </div>
            )}
            {!isCameraReady && (
              <div className="text-center p-6">
                <FiCamera size={40} color={T.textSecondary} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ color: T.textSecondary, fontSize: 14, fontWeight: 500 }}>Initializing camera...</p>
              </div>
            )}
          </>
        )}
      </div>
      <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, padding: '0 4px', fontWeight: 500 }}>
        Please position your face within the frame. Your captured identity is used securely for verifying deliveries.
      </p>
    </div>
  );
};
