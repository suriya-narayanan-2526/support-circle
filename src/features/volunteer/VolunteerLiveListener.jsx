import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBox, FiLayers, FiArrowRight, FiX, FiCheck, FiShield, FiCamera
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import * as faceapi from '@vladmandic/face-api';

/* ─── THEME TOKENS (Matching Dashboard) ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#D4541E',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0EA',
  green:        '#2D9B6F',
  greenGlow:    'rgba(45,155,111,0.12)',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  border:       'rgba(28,25,23,0.08)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
};

/* ─── LIVE NOTIFICATION MODAL ─── */
const LiveNotificationModal = ({ notification, onAccept, onClose }) => {
  if (!notification) return null;
  const isAudit = notification.type === 'audit';
  const data = notification.data;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="w-full max-w-md relative z-10 bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden border border-stone-100">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
           <div className={`w-20 h-20 rounded-[28px] ${isAudit ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'} flex items-center justify-center mb-8 shadow-inner`}>
              {isAudit ? <FiLayers size={36} /> : <FiBox size={36} />}
           </div>
           
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              <span className="text-[10px] font-black tracking-[0.2em] text-stone-500 uppercase">New Live Request</span>
           </div>
           
           <h2 className="text-3xl font-black text-stone-900 tracking-tight mb-4">
              {isAudit ? 'Inventory Audit' : 'Donation Alert'}
           </h2>
           
           <p className="text-stone-500 text-sm font-medium leading-relaxed mb-8 max-w-[280px]">
              {isAudit 
                ? `A new audit has been requested for an orphanage. Action required.` 
                : `New ${data.category} donation available for pickup near you.`}
           </p>

           <div className="w-full space-y-3">
              <button onClick={() => onAccept(notification)} className="w-full py-5 rounded-[24px] bg-stone-900 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 flex items-center justify-center gap-3">
                 Accept Task <FiArrowRight />
              </button>
              <button onClick={onClose} className="w-full py-4 rounded-[24px] text-stone-400 hover:text-stone-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
                 Ignore for now
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── FACE VERIFICATION MODAL ─── */
const FaceVerificationModal = ({ baselineImageBase64, onVerified, onClose }) => {
  const videoRef = React.useRef(null);
  const [status, setStatus] = useState('Initializing Models...');
  const [isVerifying, setIsVerifying] = useState(false);
  const streamRef = React.useRef(null);

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
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const verifyFace = async () => {
    if (!videoRef.current || !baselineImageBase64) {
      toast.error("Missing profile photo. Please update your photo in the dashboard first.");
      onClose();
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
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }}
        className="w-full max-w-md relative z-10 rounded-3xl p-8 flex flex-col items-center text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: T.textPrimary }}>Face Target Lock</h2>
        <p className="text-sm mb-6 font-medium text-stone-500">{status}</p>
        <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${isVerifying ? T.green : 'rgba(0,0,0,0.05)'}`, marginBottom: 24, position: 'relative' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {isVerifying && <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center border-t-4 border-emerald-400 rounded-full" />}
        </div>
        <div className="flex gap-4 w-full">
          <button onClick={onClose} disabled={isVerifying} className="flex-1 py-3 rounded-xl font-bold transition-colors hover:bg-gray-50 border border-stone-200 text-stone-500">Cancel</button>
          <button onClick={verifyFace} disabled={isVerifying || status.includes('Initializing')} className="flex-1 py-3 items-center justify-center rounded-xl font-bold text-white transition-all shadow-lg flex border-none hover:-translate-y-0.5 disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${T.green}, #1e7d55)` }}>
            {isVerifying ? 'Analyzing Photo...' : <><FiCamera className="mr-2" /> Take a Photo</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── GLOBAL LISTENER ─── */
export const VolunteerLiveListener = () => {
  const { user, role } = useAuth();
  const [liveNotification, setLiveNotification] = useState(null);
  const [verifyingTask, setVerifyingTask] = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null);

  useEffect(() => {
    console.log("VolunteerLiveListener: Mounting...", { user: user?.id, role });
    if (!user || role !== 'volunteer') {
      console.log("VolunteerLiveListener: Not a volunteer or not logged in. Skipping.");
      return;
    }

    // Fetch baseline photo
    const fetchProfile = async () => {
      console.log("VolunteerLiveListener: Fetching volunteer profile for face baseline...");
      const { data, error } = await supabase.from('volunteers').select('face_image').eq('user_id', user.id).maybeSingle();
      if (error) console.error("VolunteerLiveListener: Profile fetch error", error);
      if (data) {
        console.log("VolunteerLiveListener: Profile found. Face image available:", !!data.face_image);
        setVolunteerProfile(data);
      } else {
        console.warn("VolunteerLiveListener: No volunteer profile found for this user.");
      }
    };
    fetchProfile();

    console.log("VolunteerLiveListener: Initializing Supabase Realtime channels...");

    const donationsSub = supabase.channel('global-volunteer-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload) => {
        console.log("VolunteerLiveListener: Received Donation Change!", payload);
        if (payload.eventType === 'INSERT' && payload.new.status === 'submitted') {
          console.log("VolunteerLiveListener: Triggering Donation Notification!");
          setLiveNotification({ type: 'donation', data: payload.new });
        }
      })
      .subscribe((status) => {
        console.log("VolunteerLiveListener: Donations Channel Status:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("VolunteerLiveListener: Failed to subscribe to donations channel. Realtime might be disabled in Supabase.");
        }
      });
    
    const auditsSub = supabase.channel('global-volunteer-audits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_audits' }, (payload) => {
        console.log("VolunteerLiveListener: Received Audit Change!", payload);
        if (payload.eventType === 'INSERT' && payload.new.status === 'requested') {
          console.log("VolunteerLiveListener: Triggering Audit Notification!");
          setLiveNotification({ type: 'audit', data: payload.new });
        }
      })
      .subscribe((status) => {
        console.log("VolunteerLiveListener: Audits Channel Status:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("VolunteerLiveListener: Failed to subscribe to audits channel.");
        }
      });

    return () => { 
      console.log("VolunteerLiveListener: Unmounting and removing channels.");
      supabase.removeChannel(donationsSub); 
      supabase.removeChannel(auditsSub); 
    };
  }, [user, role]);

  // Add a test trigger to the window for debugging
  useEffect(() => {
    window.testNotification = (type = 'donation') => {
      console.log("VolunteerLiveListener: Triggering manual test notification for", type);
      setLiveNotification({ 
        type, 
        data: { id: 'test-id', category: 'Testing', orphanage_name: 'Test Orphanage' } 
      });
    };
    return () => { delete window.testNotification; };
  }, []);

  const handleConfirmAcceptDonation = async (mid) => {
    try {
      // Fetch active missions count first
      const { data: activeMissions } = await supabase.from('donations').select('id').eq('status', 'in_transit').eq('volunteer_id', user.id);
      if (activeMissions && activeMissions.length > 0) {
        toast.error('You already have an active mission in progress.');
        return;
      }

      const pickup_otp = Math.floor(1000 + Math.random() * 9000).toString();
      // Fetch donation first to get current address
      const { data: donation } = await supabase.from('donations').select('pickup_address').eq('id', mid).single();
      const updatedAddress = { ...(donation?.pickup_address || {}), pickup_otp };

      const { error } = await supabase.from('donations').update({ 
        status: 'in_transit', 
        volunteer_id: user.id, 
        pickup_address: updatedAddress 
      }).eq('id', mid);
      
      if (error) throw error;
      toast.success('Mission accepted globally! Head to the dashboard for details.');
    } catch (e) { 
      console.error(e);
      toast.error('Failed to accept mission.'); 
    }
  };

  const handleAcceptAudit = async (auditId) => {
    try {
      const auditCode = Math.floor(10000 + Math.random() * 90000).toString();
      const { error } = await supabase.from('inventory_audits').update({
        status: 'accepted',
        volunteer_id: user.id,
        audit_code: auditCode
      }).eq('id', auditId);
      if (error) throw error;
      toast.success('Audit Task Accepted! Check your dashboard for the location.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept audit.');
    }
  };

  if (!user || role !== 'volunteer') return null;

  return (
    <AnimatePresence>
      {liveNotification && (
        <LiveNotificationModal 
           notification={liveNotification} 
           onAccept={(n) => { 
             setVerifyingTask({ id: n.data.id, type: n.type }); 
             setLiveNotification(null); 
           }} 
           onClose={() => setLiveNotification(null)} 
        />
      )}
      {verifyingTask && (
        <FaceVerificationModal 
           baselineImageBase64={volunteerProfile?.face_image} 
           onVerified={() => {
              if (verifyingTask.type === 'donation') handleConfirmAcceptDonation(verifyingTask.id);
              else handleAcceptAudit(verifyingTask.id);
              setVerifyingTask(null);
           }} 
           onClose={() => setVerifyingTask(null)} 
        />
      )}
    </AnimatePresence>
  );
};
