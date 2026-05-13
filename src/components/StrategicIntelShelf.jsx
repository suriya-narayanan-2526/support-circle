import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiArrowRight, FiTarget, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { aiRecommendationService } from '../services/aiRecommendationService';

const T = {
  orange: '#E8622A',
  orangeDark: '#D4541E',
  orangeGlow: 'rgba(232,98,42,0.15)',
  orangeLight: '#FFF0EA',
  surface: '#FFFFFF',
  border: 'rgba(28,25,23,0.08)',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
};

export const StrategicIntelShelf = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await aiRecommendationService.getSmartSuggestions();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Failed to fetch AI suggestions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (!loading && suggestions.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2 }}
      className="w-full mb-8"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
            <FiZap className="text-amber-500" size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: T.textPrimary }}>Priority Needs Intelligence</h2>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: T.textMuted }}>AI-Driven Real-time Network Analysis</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live System Sync</span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar snap-x">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="min-w-[300px] h-40 rounded-3xl animate-pulse bg-stone-100" />
          ))
        ) : (
          suggestions.map((intel, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(232,98,42,0.12)', borderColor: 'rgba(232,98,42,0.3)' }}
              onClick={() => navigate('/donor/donate', { state: { 
                category: intel.category, 
                orphanage_id: intel.target,
                request_id: intel.requestId 
              }})}
              className="min-w-[320px] md:min-w-[380px] snap-start relative cursor-pointer rounded-3xl p-6 transition-all duration-300 group"
              style={{ 
                background: T.surface, 
                border: `1px solid ${T.border}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                  <FiTarget size={20} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-100">
                   <span className="text-[9px] font-black text-stone-500 uppercase tracking-tighter">Impact Level</span>
                   <span className="text-[10px] font-bold text-orange-600">Critical</span>
                </div>
              </div>

              <h3 className="text-xl font-black mb-2 uppercase tracking-tight group-hover:text-orange-600 transition-colors" style={{ color: T.textPrimary }}>
                {intel.category} Shortage
              </h3>
              
              <p className="text-xs font-medium leading-relaxed mb-6" style={{ color: T.textSecondary }}>
                {intel.reason.replace(/at .*/, 'across our partner network. Your immediate contribution can stabilize local supplies.')}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiInfo size={12} /> Personalized Recommendation
                </span>
                <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                  <FiArrowRight size={14} />
                </div>
              </div>

              {/* Decorative Gradient Line */}
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
