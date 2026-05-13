import React from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiNavigation, FiAlertTriangle, FiSettings } from 'react-icons/fi';

export const LocationGuard = ({ children, status, error, onRetry }) => {
  if (status !== 'blocked') return children;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/90 backdrop-blur-xl p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] p-10 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 relative">
           <FiMapPin size={40} />
           <motion.div 
             animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
             transition={{ repeat: Infinity, duration: 2 }}
             className="absolute inset-0 bg-orange-400 rounded-[30px] -z-10"
           />
        </div>

        <h2 className="text-3xl font-black text-stone-900 mb-4 tracking-tight">GPS Required</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <p className="text-stone-500 font-medium leading-relaxed mb-10 text-sm">
          To ensure reliable real-time tracking and mission security, high-accuracy location services must be enabled.
        </p>

        <div className="space-y-4">
          <button 
            onClick={onRetry}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-900/20"
          >
            <FiNavigation size={18} /> Enable Location
          </button>
          
          <div className="flex items-center gap-2 justify-center text-[10px] font-black text-stone-400 uppercase tracking-widest pt-4">
             <FiAlertTriangle className="text-amber-500" /> 
             Required for Volunteer / Donor Safety
          </div>
        </div>
      </motion.div>
    </div>
  );
};
