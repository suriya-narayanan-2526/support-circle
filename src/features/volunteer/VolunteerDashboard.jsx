import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
  FiTarget, FiShield, FiUser, FiMapPin, FiActivity, FiArrowRight, 
  FiCheckCircle, FiInfo, FiSmartphone, FiCalendar, FiBox, 
  FiChevronRight, FiStar, FiCamera, FiRefreshCcw, FiX, FiCheck,
  FiNavigation, FiClock, FiLayers, FiPlus, FiDownload, FiEdit3
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/PageLoader';
import { useLocationSystem } from '../../hooks/useLocationSystem';
import { LocationGuard } from '../../components/LocationGuard';
import { SmoothMap } from '../../components/SmoothMap';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as faceapi from '@vladmandic/face-api';

/* ─── WARM CHARITY THEME TOKENS ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#D4541E',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0EA',
  green:        '#2D9B6F',
  greenGlow:    'rgba(45,155,111,0.12)',
  greenLight:   '#EDFAF4',
  amber:        '#D97706',
  amberLight:   '#FFF8E8',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceMid:   '#FFF5EE',
  border:       'rgba(28,25,23,0.08)',
  borderHover:  'rgba(28,25,23,0.16)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
  textMuted:    '#A8A29E',
};

/* ─── UI HELPERS ─── */
function DotGrid() {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
      <defs><pattern id="adaptive-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#1C1917" /></pattern></defs>
      <rect width="100%" height="100%" fill="url(#adaptive-dots)" />
    </svg>
  );
}

function StatCard({ label, value, icon, color, glow, light, delay = 0, loading }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const onMove = (e) => {
    if (window.innerWidth < 768) return; 
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) / 10);
    y.set((e.clientY - rect.top - rect.height / 2) / 10);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -4, boxShadow: `0 24px 48px -8px ${glow}` }}
      style={{ rotateX: mouseY, rotateY: mouseX, transformStyle: 'preserve-3d', willChange: 'transform',
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, boxShadow: `0 2px 16px -2px ${glow}`,
        padding: '24px', position: 'relative', overflow: 'hidden'
      }}
      className="w-full transition-shadow duration-300"
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 60% at 0% 0%, ${light} 0%, transparent 80%)`, opacity: 0.7 }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: light, border: `1px solid ${glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
            {icon}
          </div>
        </div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 4 }}>{label}</p>
        <h3 style={{ fontSize: 36, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {loading ? (
             <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ height: 36, width: '60%', background: T.borderHover, borderRadius: 8, marginTop: 4, display: 'inline-block' }} />
          ) : value}
        </h3>
      </div>
    </motion.div>
  );
}

/* ─── MISSION INTEL MODAL ─── */
const MissionIntelModal = ({ mission: assignment, onClose }) => {
  const mission = assignment;
  if (!mission) return null;
  const items = mission.items_json || [];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} 
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        style={{ background: T.surface, border: `1px solid ${T.borderHover}`, boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }} 
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto relative z-10 rounded-3xl p-8 flex flex-col">
        
        <button onClick={onClose} style={{ color: T.textSecondary, background: T.bg, border: `1px solid ${T.border}` }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white transition-colors">
          <FiX size={20} />
        </button>
        
        <div className="mb-8 pr-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full mb-4">
            <FiMapPin className="text-amber-500 w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">Pickup Location Details</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: T.textPrimary }}>
            Donation Intel
          </h2>
        </div>

        <div className="space-y-6 flex-1">
          {/* ITEMS */}
          <div style={{ background: T.bg, border: `1px solid ${T.border}` }} className="p-5 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textSecondary }}>Items to Collect</h4>
            <div className="space-y-3">
               {items.map((it, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-3">
                       <span style={{ color: T.orange, background: T.orangeLight }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                          <FiBox />
                       </span>
                       <span className="font-bold text-sm" style={{ color: T.textPrimary }}>{it.name}</span>
                    </div>
                    <span className="font-bold text-sm px-2.5 py-1 rounded-md" style={{ background: T.surfaceMid, color: T.textSecondary }}>{it.quantity}X</span>
                 </div>
               ))}
               <div className="flex justify-between items-center pt-3 border-t mt-3" style={{ borderColor: T.border }}>
                  <span className="text-xs font-bold" style={{ color: T.textSecondary }}>TOTAL QUANTITY</span>
                  <span className="font-black text-lg" style={{ color: T.textPrimary }}>{mission.quantity || items.length}</span>
               </div>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div style={{ background: T.bg, border: `1px solid ${T.border}` }} className="p-5 rounded-2xl">
                <FiMapPin className="text-xl mb-3" style={{ color: T.amber }} />
                <p className="text-[10px] font-bold uppercase mb-1" style={{ color: T.textSecondary }}>Address</p>
                <p className="font-semibold text-sm leading-relaxed" style={{ color: T.textPrimary }}>
                  {mission.pickup_address?.address_line1 || 'Address strictly provided after acceptance'}<br/>
                  {mission.pickup_address?.city && `${mission.pickup_address.city}, `}
                  {mission.pickup_address?.pincode}
                </p>
             </div>
             <div style={{ background: T.bg, border: `1px solid ${T.border}` }} className="p-5 rounded-2xl">
                <FiUser className="text-xl mb-3" style={{ color: T.orange }} />
                <p className="text-[10px] font-bold uppercase mb-1" style={{ color: T.textSecondary }}>Donor Info</p>
                <p className="font-semibold text-sm capitalize" style={{ color: T.textPrimary }}>{mission.donor_name || 'Anonymous Donor'}</p>
                <p className="text-xs font-medium mt-1" style={{ color: T.textMuted }}>{mission.contact_number || 'Hidden until accepted'}</p>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── PHOTO UPDATE MODAL ─── */
const PhotoUpdateModal = ({ currentImage, onSave, onClose }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      const constraints = { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(e => console.error("Auto-play failed:", e));
        }
      }, 300);
    } catch (err) {
      toast.error('Could not access camera.');
    }
  };

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  }, [stream]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 150);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 512, 512);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleSave = async () => {
    if (!capturedImage) return;
    setIsSaving(true);
    await onSave(capturedImage);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} 
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }} 
        className="w-full max-w-md relative z-10 rounded-3xl p-8 flex flex-col items-center">
        
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors" style={{ color: T.textSecondary }}>
          <FiX size={20} />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold" style={{ color: T.textPrimary }}>Update Profile Photo</h2>
          <p className="text-xs mt-1" style={{ color: T.textSecondary }}>Capture a distinct, professional face image</p>
        </div>

        <div style={{ width: '100%', aspectRatio: '4/3', background: T.surfaceMid, borderRadius: 20, border: `2px dashed ${cameraActive || capturedImage ? T.green : T.border}`, overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
            {cameraActive ? (
              <>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                  <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                    <defs>
                      <mask id="focal-portal-modal">
                        <rect width="100%" height="100%" fill="white" />
                        <rect x="22%" y="15%" width="56%" height="65%" rx="80" fill="black" />
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(255,255,255,0.5)" mask="url(#focal-portal-modal)" />
                  </svg>
                  <div style={{ position: 'absolute', inset: '15% 22%', border: `2px solid ${T.orange}`, borderRadius: '80px', boxShadow: `0 0 0 1000px rgba(255,255,255,0.2)` }} />
                </div>
                <AnimatePresence>
                  {flashActive && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 100 }} />}
                </AnimatePresence>
                <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', zIndex: 50 }}>
                  <motion.button type="button" onClick={takePhoto} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ width: 60, height: 60, borderRadius: '50%', background: T.orange, border: `4px solid #fff`, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${T.orangeGlow}` }}>
                     <FiCamera size={22} color="#fff" />
                  </motion.button>
                </div>
              </>
            ) : capturedImage ? (
              <div className="relative w-full h-full">
                <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 6, color: '#ef4444', fontSize: 12, border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} onClick={() => setCapturedImage(null)}>
                  <FiRefreshCcw size={14} /> Retake
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={startCamera}>
                     <div style={{ width: 60, height: 60, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                       <FiCamera size={28} color={T.textSecondary} style={{ opacity: 0.5 }} />
                     </div>
                     <p style={{ color: T.textSecondary, fontSize: 13, fontWeight: 600, marginTop: 12 }}>Use Camera</p>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                     <div style={{ width: 60, height: 60, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                     </div>
                     <p style={{ color: T.textSecondary, fontSize: 13, fontWeight: 600, marginTop: 12 }}>Upload Image</p>
                   </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="mt-8 w-full flex flex-col-reverse sm:flex-row gap-3">
           <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold transition-colors hover:bg-gray-50 border" style={{ color: T.textSecondary, borderColor: T.border }}>Cancel</button>
           <button 
             onClick={handleSave} 
             disabled={!capturedImage || isSaving}
             className={`flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${!capturedImage || isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
             style={{ background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, boxShadow: `0 8px 24px ${T.orangeGlow}` }}
           >
             {isSaving ? 'Updating...' : 'Save Photo'}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── FACE VERIFICATION MODAL ─── */
const FaceVerificationModal = ({ baselineImageBase64, onVerified, onClose }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Initializing Models...');
  const [isVerifying, setIsVerifying] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    let active = true;
    const startVerification = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        if (!active) return;
        setStatus('Starting Camera...');

        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (!active) { s.getTracks().forEach(t => t.stop()); return; }
        
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(e => console.error("Play prevented", e));
        }
        setStatus('Ready for verification. Look at the camera.');
      } catch (err) {
        console.error("Face-API Error:", err);
        setStatus('Failed to initialize face verification.');
      }
    };
    startVerification();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const verifyFace = async () => {
    if (!videoRef.current || !baselineImageBase64) {
      toast.error("Missing baseline image in your profile. Please update your photo first.");
      return;
    }
    
    setIsVerifying(true);
    setStatus('Capturing and Analyzing Photo...');
    try {
      const img = new Image();
      img.src = baselineImageBase64;
      await new Promise((resolve) => {
         img.onload = resolve;
         img.onerror = () => { toast.error("Error loading profile photo."); resolve(); };
      });
      
      const baselineDetection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      if (!baselineDetection) {
        toast.error("Could not detect a face in your saved profile photo.");
        setIsVerifying(false);
        setStatus('Failed to read baseline face.');
        return;
      }

      const currentDetection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      if (!currentDetection) {
        toast.error("Could not detect a face right now. Ensure good lighting.");
        setIsVerifying(false);
        setStatus('Focus your face in the camera.');
        return;
      }

      const distance = faceapi.euclideanDistance(baselineDetection.descriptor, currentDetection.descriptor);
      if (distance < 0.6) {
        setStatus('Identity Verified!');
        toast.success("Identity verified successfully!");
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setStatus('Face does not match profile.');
        toast.error("Face does not match your profile photo.");
        setIsVerifying(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Verification error.");
      setIsVerifying(false);
      setStatus('Ready for verification. Look at the camera.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }}
        className="w-full max-w-md relative z-10 rounded-3xl p-8 flex flex-col items-center text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: T.textPrimary }}>Face Target Lock</h2>
        <p className="text-sm mb-6 font-medium" style={{ color: T.textSub }}>{status}</p>
        <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${isVerifying ? T.green : T.borderHover}`, marginBottom: 24, position: 'relative', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.06)' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {isVerifying && <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center border-t-4 border-emerald-400 rounded-full" />}
        </div>
        <div className="flex gap-4 w-full">
          <button onClick={onClose} disabled={isVerifying} className="flex-1 py-3 rounded-xl font-bold transition-colors hover:bg-gray-50 border" style={{ color: T.textSecondary, borderColor: T.borderHover }}>Cancel</button>
          <button onClick={verifyFace} disabled={isVerifying || status.includes('Initializing')} className="flex-1 py-3 items-center justify-center rounded-xl font-bold text-white transition-all shadow-lg flex border-none hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0" style={{ background: `linear-gradient(135deg, ${T.green}, #1e7d55)` }}>
            {isVerifying ? 'Analyzing Photo...' : <><FiCamera className="mr-2" /> Take a Photo</>}
          </button>

        </div>
      </motion.div>
    </div>
  );
};

/* ─── OTP VERIFICATION MODAL ─── */
const OtpVerificationModal = ({ correctOtp, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!correctOtp || pin === correctOtp) {
       onSuccess();
    } else {
       setError('Incorrect PIN. Please ask the donor for their Live Tracking code.');
       setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }}
        className="w-full max-w-sm relative z-10 rounded-3xl p-8 flex flex-col items-center text-center">
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.greenLight, border: `1px solid ${T.greenGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
           <FiCheckCircle size={28} style={{ color: T.green }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: T.textPrimary }}>Secure Pickup</h2>
        <p className="text-sm mb-6 font-medium leading-relaxed" style={{ color: T.textSecondary }}>Enter the 4-digit PIN displayed on the Donor's tracking screen to confirm handover.</p>
        <form onSubmit={handleSubmit} className="w-full">
           <input type="text" maxLength={4} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="0000" className="w-full text-center text-4xl tracking-[0.5em] py-4 rounded-2xl font-mono outline-none transition-all mb-2" 
                  style={{ background: T.bg, border: `2px solid ${error ? '#ef4444' : pin.length === 4 ? T.green : T.borderHover}`, color: T.textPrimary, boxShadow: `inset 0 4px 10px rgba(0,0,0,0.02)` }} />
           <div className="min-h-[24px] mb-4">
              {error && <p className="text-red-500 font-bold text-[11px] uppercase tracking-wider">{error}</p>}
              {!correctOtp && <p className="text-amber-500 font-bold text-[11px] uppercase tracking-wider">Legacy order: Any PIN works</p>}
           </div>
           <div className="flex gap-3 mt-2">
              <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold transition-colors hover:bg-gray-50 border" style={{ color: T.textSecondary, borderColor: T.borderHover }}>Cancel</button>
              <button type="submit" disabled={pin.length !== 4 && !!correctOtp} className="flex-1 py-3.5 items-center justify-center rounded-xl font-bold text-white transition-all shadow-lg flex border-none disabled:opacity-50 hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${T.green}, #1e7d55)` }}>
                Verify PIN
              </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ─── AUDIT PIN MODAL ─── */
const AuditPinModal = ({ audit, onVerify, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === audit.audit_code) {
      onVerify();
    } else {
      setError('Incorrect audit code. Please check with the orphanage.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }}
        className="w-full max-w-sm relative z-10 rounded-[40px] p-10 flex flex-col items-center text-center">
        
        <div className="w-16 h-16 rounded-[24px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-inner">
           <FiShield size={32} />
        </div>
        
        <h2 className="text-2xl font-black text-stone-900 mb-2">Audit Verification</h2>
        <p className="text-xs text-stone-500 font-medium leading-relaxed mb-8 px-4">
           Please enter the 5-digit verification code provided by the orphanage to unlock the audit form.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
           <input 
              type="text" 
              maxLength={5} 
              value={pin} 
              autoFocus
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="00000" 
              className="w-full text-center text-4xl tracking-[0.4em] py-5 rounded-[24px] font-mono outline-none transition-all mb-2" 
              style={{ 
                background: T.bg, 
                border: `2px solid ${error ? '#ef4444' : pin.length === 5 ? T.green : T.border}`, 
                color: T.textPrimary, 
                boxShadow: `inset 0 4px 12px rgba(0,0,0,0.03)` 
              }} 
           />
           
           <div className="min-h-[20px] mb-6">
              {error && <p className="text-red-500 font-black text-[10px] uppercase tracking-wider">{error}</p>}
           </div>

           <div className="flex gap-3 w-full">
              <button type="button" onClick={onClose} className="flex-1 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={pin.length !== 5} 
                className="flex-[2] py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest text-white transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${T.green}, #1e7d55)` }}
              >
                Verify & Start
              </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
};



/* ─── AUDIT FORM MODAL ─── */
const AuditFormModal = ({ audit, onSubmit, onClose }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Signature, 3: Success/Download
  const [beneficiaryCount, setBeneficiaryCount] = useState(audit.beneficiary_count || 50);
  const [items, setItems] = useState([
    { name: 'Rice (kg)', available: '', required: '' },
    { name: 'Books', available: '', required: '' },
    { name: 'Clothes', available: '', required: '' }
  ]);
  const [notes, setNotes] = useState('');
  const sigCanvas = useRef({});
  const [signatureData, setSignatureData] = useState(null);

  const calculateDeficit = (req, avail) => Math.max(0, req - avail);
  
  const getStatusLevel = (avail, req) => {
    if (req === 0) return 'Normal';
    if (avail >= req) return 'Normal';
    if (avail >= req * 0.5) return 'Low';
    return 'Critical';
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'name') {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = value === '' ? '' : Number(value);
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', available: '', required: '', per_child: '', isCustom: true }]);
  };

  const validateForm = () => {
    if (!beneficiaryCount || beneficiaryCount <= 0) {
      toast.error('Please enter a valid beneficiary count.');
      return false;
    }
    const invalidItems = items.filter(it => !it.name.trim() || it.available === '' || (it.required === '' && (!it.per_child || it.per_child === '')));
    if (invalidItems.length > 0) {
      toast.error('Please completely fill all fields for all items.');
      return false;
    }
    return true;
  };

  const handleNextToSignature = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep(2);
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setSignatureData(null);
  };

  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) {
      toast.error('Orphanage representative signature is required.');
      return;
    }
    setSignatureData(sigCanvas.current.getCanvas().toDataURL('image/png'));
    setStep(3);
  };

  const generatePDFAndSubmit = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Bar
    doc.setFillColor(30, 41, 59); // Navy Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text('SUPPORT CIRCLE', 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Official Inventory Audit & Needs Assessment', 14, 28);
    
    // Status Badge
    doc.setFillColor(45, 155, 111); // Green
    doc.roundedRect(pageWidth - 45, 14, 31, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text('VERIFIED', pageWidth - 38, 19.5);

    // 2. Metadata Grid
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(16);
    doc.text('Audit Overview', 14, 55);
    
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(14, 60, pageWidth - 14, 60);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont("helvetica", "bold");
    doc.text('ORPHANAGE / FACILITY', 14, 70);
    doc.text('AUDIT DATE', 115, 70);
    doc.text('TOTAL BENEFICIARIES', 155, 70);

    doc.setTextColor(15, 23, 42); 
    doc.setFont("helvetica", "normal");
    doc.text(audit.orphanage_name || 'Unknown Facility', 14, 76);
    doc.text(new Date().toLocaleDateString(), 115, 76);
    doc.text(`${beneficiaryCount} Children`, 155, 76);

    // 3. Table Data
    const tableData = items.map(it => {
      const autoRequired = it.per_child > 0 ? beneficiaryCount * it.per_child : it.required;
      const deficit = calculateDeficit(Number(autoRequired), Number(it.available));
      return [
        it.name, 
        it.available.toString(), 
        autoRequired.toString(), 
        deficit > 0 ? `${deficit} (Deficit)` : '0'
      ];
    });

    autoTable(doc, {
      startY: 90,
      head: [['Resource Item', 'Available Stock', 'Required Stock', 'Status / Deficit']],
      body: tableData,
      theme: 'grid',
      styles: { 
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 6,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: { 
        fillColor: [30, 41, 59], 
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left'
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
           if (data.cell.raw === '0') {
              data.cell.styles.textColor = [45, 155, 111]; // Green
              data.cell.text = ['Fulfilled'];
           } else {
              data.cell.styles.textColor = [220, 38, 38]; // Red
              data.cell.styles.fontStyle = 'bold';
           }
        }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 15;
    
    // 4. Notes Section
    if (notes && notes.trim() !== '' && notes !== 'null') {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text('Volunteer Observations & Notes:', 14, finalY);
      
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(`"${notes}"`, pageWidth - 28);
      
      const textHeight = splitNotes.length * 5;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalY + 5, pageWidth - 28, textHeight + 10, 2, 2, 'F');
      
      doc.text(splitNotes, 19, finalY + 12);
      finalY += textHeight + 25;
    }

    // 5. Signature Section
    if (finalY > pageHeight - 60) {
      doc.addPage();
      finalY = 20;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, finalY, pageWidth - 14, finalY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text('Official Authorization', 14, finalY + 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Digitally signed and verified by the orphanage representative present during the audit.', 14, finalY + 20);

    if (signatureData) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([2, 2], 0);
      doc.rect(14, finalY + 25, 80, 30);
      doc.setLineDashPattern([], 0);
      doc.addImage(signatureData, 'PNG', 16, finalY + 27, 76, 26);
    }
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('_________________________________', 14, finalY + 62);
    doc.setFont("helvetica", "bold");
    doc.text('Representative Signature', 14, finalY + 68);

    doc.text('_________________________________', 115, finalY + 62);
    doc.text('Audit Timestamp', 115, finalY + 68);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleString(), 115, finalY + 73);

    // 6. Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated securely by Support Circle Intelligence Engine • Page ${i} of ${pageCount}`, 
        pageWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
    }

    doc.save(`Audit_Report_${(audit.orphanage_name || 'Facility').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);

    // Submit to DB
    const auditData = items.map(item => {
      const autoRequired = item.per_child > 0 ? beneficiaryCount * item.per_child : item.required;
      return {
        ...item,
        required: autoRequired,
        deficit: calculateDeficit(Number(autoRequired), Number(item.available)),
        status_level: getStatusLevel(Number(item.available), Number(autoRequired))
      };
    });

    onSubmit({ beneficiary_count: beneficiaryCount, audit_data: auditData, notes, signature_image: signatureData });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 rounded-3xl p-8 flex flex-col">
        
        {step === 1 && (
          <div className="mb-6">
             <h2 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>Inventory Audit</h2>
             <p className="text-sm font-medium mt-1" style={{ color: T.textSecondary }}>{audit.orphanage_name}</p>
             <div className="mt-4 p-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg flex items-center gap-2">
               <FiInfo size={16} /> All fields must be completely filled out before proceeding. You cannot close this audit.
             </div>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNextToSignature} className="space-y-6">
             <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Total Beneficiaries (Children)</label>
               <input type="number" required value={beneficiaryCount} onChange={e => setBeneficiaryCount(Number(e.target.value))} className="w-full p-3 rounded-xl border border-stone-200 focus:border-emerald-500 outline-none" min="1" />
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">Items Verification</h4>
                   <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2">
                      <FiPlus /> Add Item
                   </button>
                </div>
                
                {items.map((it, idx) => {
                   const autoRequired = it.per_child > 0 ? beneficiaryCount * it.per_child : it.required;
                   const deficit = calculateDeficit(Number(autoRequired), Number(it.available));
                   const status = getStatusLevel(Number(it.available), Number(autoRequired));

                   return (
                   <div key={idx} className="grid grid-cols-5 gap-3 items-end p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
                      <div className="col-span-1">
                         <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Item Name</label>
                         <input 
                            type="text" 
                            required
                            value={it.name} 
                            placeholder="e.g. Rice"
                            readOnly={!it.isCustom} 
                            onChange={e => handleItemChange(idx, 'name', e.target.value)}
                            className={`w-full p-2.5 rounded-lg text-sm font-bold outline-none ${!it.isCustom ? 'bg-stone-50 border border-stone-100 text-stone-600' : 'border border-stone-200 focus:border-emerald-500'}`} 
                         />
                      </div>
                      <div className="col-span-1">
                         <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Per Child Rate</label>
                         <input type="number" value={it.per_child !== undefined ? it.per_child : ''} onChange={e => handleItemChange(idx, 'per_child', e.target.value)} className="w-full p-2.5 rounded-lg border border-stone-200 focus:border-emerald-500 text-sm font-bold outline-none" min="0" step="0.1" />
                      </div>
                      <div className="col-span-1">
                         <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Available</label>
                         <input type="number" required value={it.available !== undefined ? it.available : ''} onChange={e => handleItemChange(idx, 'available', e.target.value)} className="w-full p-2.5 rounded-lg border border-stone-200 focus:border-emerald-500 text-sm font-bold outline-none" min="0" />
                      </div>
                      <div className="col-span-1">
                         <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Req</label>
                         <input type="number" required={!it.per_child} value={autoRequired !== undefined ? autoRequired : ''} onChange={e => handleItemChange(idx, 'required', e.target.value)} readOnly={it.per_child > 0} className={`w-full p-2.5 rounded-lg text-sm font-bold outline-none ${it.per_child > 0 ? 'bg-stone-50 border border-stone-100 text-stone-600' : 'border border-stone-200 focus:border-emerald-500'}`} min="0" />
                      </div>
                      <div className="col-span-1">
                         <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Deficit</label>
                         <div className={`w-full p-2.5 rounded-lg border text-sm font-bold flex justify-between items-center ${deficit > 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                            <span>{deficit}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded uppercase bg-white/50">{status}</span>
                         </div>
                      </div>
                   </div>
                )})}
             </div>

             <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">Additional Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-4 rounded-2xl border border-stone-200 focus:border-emerald-500 outline-none min-h-[100px] text-sm" placeholder="Any specific observations..." />
             </div>

             <button type="submit" className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${T.green}, #1e7d55)` }}>
               Proceed to Signature <FiArrowRight />
             </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 rounded-[24px] bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                 <FiEdit3 size={32} />
              </div>
              <h2 className="text-2xl font-black text-stone-900 mb-2">Orphanage Authorization</h2>
              <p className="text-sm text-stone-500 font-medium">Please have the orphanage representative sign below to verify the audit.</p>
            </div>

            <div className="bg-stone-50 border-2 border-dashed border-stone-300 rounded-3xl overflow-hidden relative" style={{ height: '250px' }}>
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="#0F172A"
                canvasProps={{className: 'w-full h-full cursor-crosshair'}} 
              />
              <button onClick={clearSignature} className="absolute top-4 right-4 px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
                Clear
              </button>
            </div>

            <button onClick={saveSignature} className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${T.green}, #1e7d55)` }}>
              <FiCheckCircle /> Confirm Signature
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
               <FiCheck size={40} />
            </div>
            <h2 className="text-2xl font-black text-stone-900 mb-2">Audit Successfully Verified</h2>
            <p className="text-sm text-stone-500 font-medium mb-8">The orphanage representative has signed the audit. You can now download the official report.</p>
            
            <button onClick={generatePDFAndSubmit} className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${T.green}, #1e7d55)` }}>
              <FiDownload size={20} /> Download PDF & Complete Audit
            </button>
          </div>
        )}

      </motion.div>
    </div>
  );
};

/* ─── MAIN DASHBOARD ─── */
export const VolunteerDashboard = () => {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  const [historyMissions, setHistoryMissions] = useState([]);
  const [auditTasks, setAuditTasks] = useState([]);
  const [activeAudits, setActiveAudits] = useState([]);
  const [selectedIntel, setSelectedIntel] = useState(null);
  const [showPhotoUpdate, setShowPhotoUpdate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'history' | 'audits'
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [verifyingTask, setVerifyingTask] = useState(null); // { id: string, type: 'donation' | 'audit' }
  const [completingMissionId, setCompletingMissionId] = useState(null);
  const [auditVerificationInputs, setAuditVerificationInputs] = useState({}); // { auditId: "12345" }
  const [verifyingAuditPin, setVerifyingAuditPin] = useState(null); // audit object v420 v420

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        if (!user) return;
        const [invitesRes, activeRes, historyRes, volRes, openAuditsRes, userAuditsRes] = await Promise.all([
          supabase.from('donations').select('*').eq('status', 'submitted').order('created_at', { ascending: false }),
          supabase.from('donations').select('*').eq('status', 'in_transit').eq('volunteer_id', user.id),
          supabase.from('donations').select('*').eq('status', 'delivered').eq('volunteer_id', user.id).order('created_at', { ascending: false }),
          supabase.from('volunteers').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('inventory_audits').select('*, orphanage:orphanages(location)').eq('status', 'requested').order('created_at', { ascending: false }),
          supabase.from('inventory_audits').select('*, orphanage:orphanages(location)').in('status', ['accepted', 'completed']).eq('volunteer_id', user.id).order('created_at', { ascending: false })
        ]);
        
        if (volRes.data) setVolunteerProfile(volRes.data);
        if (openAuditsRes.data) setAuditTasks(openAuditsRes.data);
        if (userAuditsRes.data) setActiveAudits(userAuditsRes.data);

        let fetchedMissions = invitesRes.data || [];
        let fetchedActive = activeRes.data || [];
        let fetchedHistory = historyRes.data || [];

        const allDonorIds = [...new Set([...fetchedMissions, ...fetchedActive, ...fetchedHistory].map(m => m.donor_id).filter(Boolean))];
        if (allDonorIds.length > 0) {
          const [donorProfiles, partnerProfiles] = await Promise.all([
            supabase.from('donors').select('user_id, full_name').in('user_id', allDonorIds),
            supabase.from('partners').select('user_id, institution_name').in('user_id', allDonorIds)
          ]);
          const nameMap = {};
          if (donorProfiles.data) donorProfiles.data.forEach(d => nameMap[d.user_id] = d.full_name);
          if (partnerProfiles.data) partnerProfiles.data.forEach(p => nameMap[p.user_id] = p.institution_name);
          
          const mapper = m => ({
            ...m,
            donor_name: nameMap[m.donor_id] || (m.donor_name !== 'Anonymous Donor' ? m.donor_name : null) || 'Anonymous Donor'
          });
          fetchedMissions = fetchedMissions.map(mapper);
          fetchedActive = fetchedActive.map(mapper);
          fetchedHistory = fetchedHistory.map(mapper);
        }

        setMissions(fetchedMissions);
        setActiveMissions(fetchedActive);
        setHistoryMissions(fetchedHistory);
      } catch (e) { 
        console.error("Error fetching missions:", e); 
        setMissions([]); setActiveMissions([]); setHistoryMissions([]); setAuditTasks([]); setActiveAudits([]);
      } finally { setLoading(false); }
    };
    fetchMissions();

    const donationsSub = supabase.channel('public-donations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        fetchMissions();
      })
      .subscribe();
    
    const auditsSub = supabase.channel('public-audits-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_audits' }, () => {
        fetchMissions();
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(donationsSub); 
      supabase.removeChannel(auditsSub); 
    };

  }, [user]);

  const { status: locationStatus, error, isBlocked, requestRetry } = useLocationSystem(
    user, 
    'volunteer', 
    !!user
  );

  const handleConfirmAccept = async (mid) => {
    try {
       if (activeMissions.length > 0) {
         toast.error('You already have an active mission in progress.');
         return;
       }

       const pickup_otp = Math.floor(1000 + Math.random() * 9000).toString();
       const missionTarget = missions.find(m => m.id === mid) || activeMissions.find(m => m.id === mid);
       const updatedAddress = { ...(missionTarget?.pickup_address || {}), pickup_otp };

       const { error } = await supabase.from('donations').update({ status: 'in_transit', volunteer_id: user.id, pickup_address: updatedAddress }).eq('id', mid);
       if (error) throw error;
       toast.success('Pickup accepted!');
    } catch (e) { toast.error('Failed to accept pickup.'); }
  };

  const [activeAuditForm, setActiveAuditForm] = useState(null);

  const handleCompleteMission = async (mid) => {
    try {
       const { error } = await supabase.from('donations').update({ status: 'delivered' }).eq('id', mid);
       if (error) throw error;
       toast.success('Donation marked as Delivered!');
    } catch (e) { toast.error('Failed to complete mission.'); }
  }

  const handleAcceptAudit = async (auditId) => {
    try {
      const auditCode = Math.floor(10000 + Math.random() * 90000).toString(); 
      const { error } = await supabase.from('inventory_audits').update({ 
        status: 'accepted', 
        volunteer_id: user.id,
        audit_code: auditCode
      }).eq('id', auditId);
      if (error) throw error;
      toast.success('Audit Task Accepted!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept audit: ' + err.message);
    }
  };

  const handleSubmitAudit = async (auditData) => {
    try {
      const { error } = await supabase.from('inventory_audits').update({
        status: 'completed',
        beneficiary_count: auditData.beneficiary_count,
        audit_data: auditData.audit_data,
        notes: auditData.notes,
        visit_date: new Date().toISOString()
      }).eq('id', activeAuditForm.id);

      if (error) throw error;
      toast.success('Audit Report Submitted!');
      setActiveAuditForm(null);
    } catch (err) {
      toast.error('Failed to submit audit.');
    }
  };


  const handleUpdatePhoto = async (newBase64) => {
      try {
         const { error } = await supabase.from('volunteers').update({ face_image: newBase64 }).eq('user_id', user.id);
         if (error) throw error;
         setVolunteerProfile(prev => ({ ...prev, face_image: newBase64 }));
         toast.success('Profile photo updated!');
         setShowPhotoUpdate(false);
      } catch (e) { toast.error('Could not update profile photo.'); }
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Volunteer';

  if (loading) return <PageLoader message="Loading Dashboard" subtitle="Scanning active missions..." />;

  const currentMission = activeMissions[0];

  return (
    <LocationGuard status={locationStatus} error={error} onRetry={requestRetry}>
      <div className="min-h-screen relative overflow-x-hidden pb-32" style={{ background: T.bg }}>
        <DotGrid />
      
      <AnimatePresence>
        {selectedIntel && <MissionIntelModal mission={selectedIntel} onClose={() => setSelectedIntel(null)} />}
        {showPhotoUpdate && <PhotoUpdateModal currentImage={volunteerProfile?.face_image} onSave={handleUpdatePhoto} onClose={() => setShowPhotoUpdate(false)} />}
        {verifyingTask && (
           <FaceVerificationModal 
              baselineImageBase64={volunteerProfile?.face_image} 
              onVerified={() => {
                 if (verifyingTask.type === 'donation') handleConfirmAccept(verifyingTask.id);
                 else handleAcceptAudit(verifyingTask.id);
                 setVerifyingTask(null);
              }} 
              onClose={() => setVerifyingTask(null)} 
           />
        )}
        {completingMissionId && (
           <OtpVerificationModal 
              correctOtp={activeMissions.find(m => m.id === completingMissionId)?.pickup_address?.pickup_otp} 
              onSuccess={() => { setCompletingMissionId(null); handleCompleteMission(completingMissionId); }} 
              onClose={() => setCompletingMissionId(null)} 
           />
        )}
        {verifyingAuditPin && (
          <AuditPinModal 
             audit={verifyingAuditPin}
             onVerify={() => {
                setVerifyingAuditPin(null);
                setActiveAuditForm(verifyingAuditPin);
             }}
             onClose={() => setVerifyingAuditPin(null)}
          />
        )}
        {activeAuditForm && (
           <AuditFormModal audit={activeAuditForm} onSubmit={handleSubmitAudit} onClose={() => setActiveAuditForm(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 pt-28">
        
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-16 p-12 bg-white rounded-[40px] border border-stone-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none" />
           
           <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.6 }} className="relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full mb-6">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black tracking-[0.25em] text-stone-500 uppercase">Response Unit: Active</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-stone-900 leading-none">
                Hello, <span className="text-orange-600">{firstName}.</span>
              </h1>
              <p className="mt-4 text-stone-400 font-medium max-w-sm leading-relaxed">
                Logistics network is optimal. You have {missions.length} available requests nearby.
              </p>
           </motion.div>

           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0 relative group" onClick={() => setShowPhotoUpdate(true)}>
              <div className="w-40 h-40 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative z-10 cursor-pointer">
                 {volunteerProfile?.face_image ? (
                   <img src={volunteerProfile.face_image} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                     <FiUser size={48} />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FiCamera color="#fff" size={24} />
                 </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg z-20">
                 <FiCheck size={20} />
              </div>
              <div className="absolute inset-0 bg-orange-400 blur-3xl opacity-10" />
           </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 }}
              className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <FiShield size={20} />
                 </div>
                 <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Auth Status</span>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Identity Verified</p>
              <h3 className="text-4xl font-black text-stone-900 tracking-tighter mb-6">SECURE</h3>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black">VALID</div>
                 <span className="text-[10px] font-bold text-stone-300">Background Clear</span>
              </div>
           </motion.div>

           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.2 }}
              className="p-8 bg-white border border-stone-100 rounded-[32px] shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-orange-600" />
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100">
                    <FiActivity size={20} />
                 </div>
                 <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Ops Flow</span>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Missions</p>
              <h3 className="text-4xl font-black text-stone-900 tracking-tighter mb-6">{historyMissions.length} COMPLETED</h3>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-[9px] font-black">ACTIVE</div>
                 <span className="text-[10px] font-bold text-stone-300">Live Operation</span>
              </div>
           </motion.div>

           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3 }}
              className="p-8 bg-stone-900 text-white rounded-[32px] shadow-xl relative group overflow-hidden border border-stone-800">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
                 <FiStar size={80} />
              </div>
              <div className="relative z-10">
                 <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 text-amber-400">
                       <FiStar size={22} />
                    </div>
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.25em] bg-amber-400/10 px-3 py-1 rounded-full">Elite Status</span>
                 </div>
                 <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Trust Rating</p>
                 <h3 className="text-5xl font-black text-white tracking-tight mb-8 leading-tight">
                    {volunteerProfile?.rating ? volunteerProfile.rating.toFixed(1) : '5.0'}★
                 </h3>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-1 flex-1 bg-amber-500 rounded-full" />)}
                 </div>
              </div>
           </motion.div>
        </div>

        {currentMission && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex items-center gap-3 mb-6 px-2">
               <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <FiNavigation size={18} />
               </div>
               <h2 className="text-lg font-black uppercase tracking-widest text-stone-800">Current Mission Control</h2>
               <div className="h-[1px] flex-1 bg-stone-100" />
               <span className="text-[10px] font-black text-orange-600 uppercase animate-pulse">Live Operation</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 32, overflow: 'hidden' }} className="shadow-sm">
                 <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                       <span className="text-sm font-bold text-stone-700">Live Navigation</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                       <FiLayers /> High Accuracy GPS
                    </div>
                 </div>
                 <div className="p-4 h-[400px] lg:h-full relative">
                    <SmoothMap 
                       targetUserId={user.id} 
                       targetRole="volunteer"
                       viewerId={currentMission.donor_id}
                       viewerRole="donor"
                    />
                 </div>
              </div>

              <div className="flex flex-col gap-6">
                 <div className="p-8 rounded-[32px] bg-white border border-stone-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <FiUser size={80} />
                    </div>
                    <div className="relative z-10">
                       <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-2">Primary Target</p>
                       <h3 className="text-2xl font-black text-stone-800 mb-1">{currentMission.donor_name}</h3>
                       <p className="text-sm font-bold text-stone-400 mb-6">{currentMission.category} Collection</p>
                       
                       <div className="space-y-4">
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
                                <FiMapPin size={18} />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Pickup Address</p>
                                <p className="text-sm font-bold text-stone-700 leading-relaxed">{currentMission.pickup_address?.address || 'View map for exact pin'}</p>
                             </div>
                          </div>
                          
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
                                <FiSmartphone size={18} />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Secure Contact</p>
                                <p className="text-sm font-bold text-stone-700">{currentMission.contact_number}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 rounded-[32px] bg-stone-900 text-white shadow-xl flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Verification Required</p>
                             <h4 className="text-lg font-bold">Secure Handover</h4>
                          </div>
                          <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                             Step 2 of 2
                          </div>
                       </div>
                       <p className="text-xs text-stone-400 leading-relaxed mb-8">
                         Verify the 4-digit PIN with the donor to finalize the pickup. This ensures chain of custody for all donations.
                       </p>
                    </div>

                    <div className="flex gap-3">
                       <button onClick={() => setSelectedIntel(currentMission)} className="flex-1 py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-widest">
                          Intel
                       </button>
                       <button onClick={() => setCompletingMissionId(currentMission.id)} className="flex-[2] py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 transition-colors text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-900/20">
                          Verify & Complete
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
           
           <div className="w-full">
              <div className="flex items-center gap-8 mb-8 border-b border-stone-100">
                 <button onClick={() => setActiveTab('available')} className={`pb-4 text-sm font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'available' ? 'text-stone-800' : 'text-stone-300'}`}>
                    Available
                    {missions.length > 0 && <span className="ml-2 text-orange-600">{missions.length}</span>}
                    {activeTab === 'available' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-full" />}
                 </button>
                 <button onClick={() => setActiveTab('history')} className={`pb-4 text-sm font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'history' ? 'text-stone-800' : 'text-stone-300'}`}>
                    History
                    {activeTab === 'history' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-stone-800 rounded-full" />}
                 </button>
                 <button onClick={() => setActiveTab('audits')} className={`pb-4 text-sm font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'audits' ? 'text-stone-800' : 'text-stone-300'}`}>
                    Audit Tasks
                    {auditTasks.length > 0 && <span className="ml-2 text-emerald-600">{auditTasks.length}</span>}
                    {activeTab === 'audits' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
                 </button>
              </div>

              <div className="min-h-[400px]">
                 <AnimatePresence mode="wait">
                    {activeTab === 'available' && (
                      <motion.div key="avail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                         {missions.length === 0 ? (
                            <div className="py-20 text-center bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-100">
                               <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">No available requests nearby</p>
                            </div>
                         ) : (
                            missions.map((m) => (
                               <div key={m.id} className="group p-6 bg-white rounded-[32px] border border-stone-100 hover:border-orange-200 transition-all hover:shadow-xl hover:shadow-orange-900/5 flex flex-col md:flex-row items-center gap-6">
                                  <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                     <FiBox size={28} />
                                  </div>
                                  <div className="flex-1 text-center md:text-left">
                                     <h4 className="text-xl font-black text-stone-800">{m.category}</h4>
                                     <div className="flex items-center justify-center md:justify-start gap-4 mt-1">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5"><FiMapPin /> {m.pickup_address?.city || 'Local'}</span>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5"><FiClock /> Just Posted</span>
                                     </div>
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => setSelectedIntel(m)} className="p-4 bg-stone-50 rounded-2xl text-stone-400 hover:bg-stone-100 transition-colors">
                                        <FiInfo size={20} />
                                     </button>
                                     <button 
                                        disabled={activeMissions.length > 0}
                                        onClick={() => {
                                           if (volunteerProfile?.face_image) setVerifyingTask({ id: m.id, type: 'donation' });
                                           else toast.error('Please upload profile photo.');
                                        }} 
                                        className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                                           activeMissions.length > 0 
                                           ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none' 
                                           : 'bg-stone-900 text-white hover:bg-orange-600 shadow-stone-900/10'
                                        }`}
                                     >
                                        {activeMissions.length > 0 ? 'Task in Progress' : 'Accept'}
                                     </button>
                                  </div>
                               </div>
                            ))
                         )}
                      </motion.div>
                    )}

                    {activeTab === 'history' && (
                      <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                         {historyMissions.length === 0 ? (
                            <div className="py-20 text-center bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-100">
                               <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Your delivery record is empty</p>
                            </div>
                         ) : (
                            historyMissions.map((m) => (
                               <div key={m.id} className="p-6 bg-white rounded-[32px] border border-stone-100 flex items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
                                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                     <FiCheckCircle size={20} />
                                  </div>
                                  <div className="flex-1">
                                     <h4 className="text-base font-black text-stone-800">{m.category}</h4>
                                     <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{m.pickup_address?.city} Delivery</p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-sm font-black text-stone-800">{m.quantity} Units</p>
                                     <p className="text-[10px] font-bold text-emerald-600 uppercase">Confirmed</p>
                                  </div>
                               </div>
                            ))
                         )}
                      </motion.div>
                    )}

                    {activeTab === 'audits' && (
                      <motion.div key="audits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                         {auditTasks.length === 0 && activeAudits.length === 0 ? (
                            <div className="py-20 text-center bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-100">
                               <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">No pending audits</p>
                            </div>
                         ) : (
                            <>
                               {activeAudits.map((a) => (
                                 <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-emerald-100 rounded-[32px] overflow-hidden shadow-sm">
                                    <div className="p-6 flex items-center gap-6">
                                       <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                          <FiCheckCircle size={28} />
                                       </div>
                                       <div className="flex-1">
                                          <h4 className="text-xl font-black text-stone-800">{a.orphanage_name}</h4>
                                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><FiMapPin /> {a.status === 'accepted' ? 'Audit In Progress' : 'Audit Completed'}</p>
                                       </div>
                                       {a.status === 'accepted' ? (
                                           <div className="flex items-center gap-3">
                                              <button 
                                                 onClick={() => setVerifyingAuditPin(a)} 
                                                 className="px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                                              >
                                                 <FiShield size={16} /> Enter Audit Code
                                              </button>
                                           </div>
                                        ) : (
                                          <div className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest">
                                             Submitted
                                          </div>
                                       )}
                                    </div>
                                    
                                    {a.status === 'accepted' && a.orphanage && (
                                       <div className="px-6 pb-6">
                                          <div className="h-48 rounded-2xl bg-stone-100 relative overflow-hidden border border-stone-200">
                                             <iframe 
                                                width="100%" height="100%" 
                                                frameBorder="0" style={{ border: 0 }}
                                                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY_HERE&q=${a.orphanage.latitude},${a.orphanage.longitude}`}
                                                allowFullScreen
                                             />
                                             <div className="absolute inset-0 bg-stone-900/10 pointer-events-none" />
                                             <div className="absolute bottom-4 right-4 flex gap-2">
                                                <a href={`https://www.google.com/maps?q=${a.orphanage.latitude},${a.orphanage.longitude}`} target="_blank" rel="noreferrer" 
                                                   className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-stone-50 transition-all">
                                                   <FiMapPin /> Open in Maps
                                                </a>
                                             </div>
                                          </div>
                                       </div>
                                    )}
                                 </motion.div>
                               ))}
                               {auditTasks.map((a) => (
                                 <div key={a.id} className="p-6 bg-white rounded-[32px] border border-stone-100 hover:border-emerald-200 transition-all flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
                                       <FiBox size={28} />
                                    </div>
                                    <div className="flex-1">
                                       <h4 className="text-xl font-black text-stone-800">{a.orphanage_name}</h4>
                                       <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5"><FiMapPin /> Audit Request</p>
                                    </div>
                                    <button onClick={() => { if (volunteerProfile?.face_image) setVerifyingTask({ id: a.id, type: 'audit' }); else toast.error('Please upload profile photo.'); }} className="px-8 py-4 bg-stone-900 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg">
                                       Accept Task
                                    </button>
                                 </div>
                               ))}
                            </>
                         )}
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>

           {/* SIDEBAR: Performance & Identity */}
           <div className="space-y-8">
              {/* Trust Card */}
              <div className="p-10 rounded-[48px] bg-stone-900 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
                    <FiShield size={120} />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2 tracking-tighter">Identity Verified</h3>
                    <p className="text-xs text-stone-400 leading-relaxed mb-8 font-medium">
                      Your credentials have been validated by Support Circle. You are authorized for institutional pickups.
                    </p>
                    <div className="flex gap-2 mb-8">
                       {[1,2,3,4,5].map(i => <div key={i} className="h-1 flex-1 bg-emerald-500 rounded-full" />)}
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-center flex-1 py-4 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-lg font-black">{volunteerProfile?.rating ? Number(volunteerProfile.rating).toFixed(1) : '5.0'}</p>
                          <p className="text-[8px] font-bold uppercase text-stone-500 tracking-widest">Rating</p>
                       </div>
                       <div className="text-center flex-1 py-4 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-lg font-black">{historyMissions.length}</p>
                          <p className="text-[8px] font-bold uppercase text-stone-500 tracking-widest">Missions</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Stats Card */}
              <div className="p-10 rounded-[48px] bg-white border border-stone-100 shadow-sm">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-stone-800">Operational Stats</h3>
                 <div className="space-y-8">
                    {[
                       { label: 'Pickup Success', value: '98%', color: T.orange },
                       { label: 'Time On Route', value: 'Elite', color: T.green },
                       { label: 'Response Score', value: 'High', color: T.amber }
                    ].map((stat, i) => (
                       <div key={i}>
                          <div className="flex justify-between items-center mb-3">
                             <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{stat.label}</span>
                             <span className="text-xs font-black text-stone-800">{stat.value}</span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full rounded-full" style={{ background: stat.color }} />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </LocationGuard>
  );
};
