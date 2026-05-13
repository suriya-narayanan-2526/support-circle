import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheckCircle, FiUser, FiTruck, FiX, FiBell
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

/* ─── THEME TOKENS ─── */
const T = {
  orange:       '#E8622A',
  orangeLight:  '#FFF0EA',
  green:        '#2D9B6F',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
  surface:      '#FFFFFF',
  border:       'rgba(28,25,23,0.08)',
};

/* ─── DONOR NOTIFICATION MODAL ─── */
const DonorNotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;
  const data = notification.data;

  return (
    <div className="fixed bottom-8 right-8 z-[5000] w-full max-w-sm p-4">
      <motion.div 
        initial={{ opacity: 0, x: 100, scale: 0.9 }} 
        animate={{ opacity: 1, x: 0, scale: 1 }} 
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        className="bg-white rounded-3xl p-6 shadow-2xl border border-stone-100 relative overflow-hidden"
      >
        {/* Progress indicator top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
        
        <div className="flex items-start gap-4">
           <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
              <FiTruck size={24} />
           </div>
           
           <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                 <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">Mission Update</span>
                 <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                    <FiX size={16} />
                 </button>
              </div>
              <h3 className="text-sm font-black text-stone-900 mb-1">Volunteer Assigned!</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                 A verified volunteer has accepted your <span className="text-stone-900 font-bold">{data.category}</span> donation and is heading your way.
              </p>
              
              <div className="mt-4 flex items-center gap-2">
                 <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-400">
                       <FiUser size={12} />
                    </div>
                 </div>
                 <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Courier in transit</span>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── GLOBAL DONOR LISTENER ─── */
export const DonorLiveListener = () => {
  const { user, role } = useAuth();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!user || (role !== 'donor' && role !== 'community_partner')) return;

    console.log("DonorLiveListener: Initializing...");

    const donationsSub = supabase.channel(`donor-updates-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'donations',
        filter: `donor_id=eq.${user.id}`
      }, (payload) => {
        console.log("DonorLiveListener: Received Update Payload:", payload);
        
        // Check if status is now in_transit
        // We simplified this to be more reliable across different replica identities
        if (payload.new && payload.new.status === 'in_transit') {
          console.log("DonorLiveListener: Status is in_transit! Showing notification.");
          setNotification({ data: payload.new });
          
          // Auto-hide after 12 seconds
          setTimeout(() => {
            setNotification(null);
          }, 12000);
        }
      })
      .subscribe((status) => {
        console.log("DonorLiveListener: Channel Subscription Status:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("DonorLiveListener: Real-time subscription failed. Check Supabase publication settings.");
        }
      });

    return () => { 
      supabase.removeChannel(donationsSub); 
    };
  }, [user, role]);

  // Test trigger
  useEffect(() => {
    window.testDonorNotification = () => {
      console.log("DonorLiveListener: Triggering test...");
      setNotification({ data: { category: 'Testing' } });
    };
    return () => { delete window.testDonorNotification; };
  }, []);

  if (!user || (role !== 'donor' && role !== 'community_partner')) return null;

  return (
    <AnimatePresence>
      {notification && (
        <DonorNotificationModal 
           notification={notification} 
           onClose={() => setNotification(null)} 
        />
      )}
    </AnimatePresence>
  );
};
