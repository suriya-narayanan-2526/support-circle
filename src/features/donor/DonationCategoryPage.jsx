import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiShield, FiArrowRight, FiCheck, FiZap, FiTarget } from 'react-icons/fi';
import { DONATION_CATEGORIES } from '../../utils/constants';
import { aiRecommendationService } from '../../services/aiRecommendationService';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#D4541E',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0EA',
  green:        '#2D9B6F',
  greenDim:     'rgba(45,155,111,0.12)',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceMid:   '#FFF5EE',
  border:       'rgba(28,25,23,0.08)',
  borderHover:  'rgba(28,25,23,0.16)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
  textMuted:    '#A8A29E',
};

const IntegrityDialog = ({ onAccept, onCancel }) => (
  <AnimatePresence>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(28,25,23,0.6)' }}
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{ background: T.surface, border: `1px solid ${T.borderHover}` }}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#FFF7ED', border: '1px solid #FFEDD5' }}>
          <FiAlertTriangle className="h-8 w-8 text-amber-500" />
        </div>

        <h2 className="font-display text-center text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>
          Honesty Matters
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          You are about to make a donation to children who genuinely need your help. Please ensure all information you provide is accurate and real.
        </p>

        <div className="mt-6 rounded-2xl border p-4 space-y-2" style={{ background: '#FEF2F2', borderColor: '#FEE2E2' }}>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#EF4444' }}>
            <FiAlertTriangle className="h-4 w-4 shrink-0" /> Do not provide fake information
          </p>
          <ul className="ml-6 list-disc text-xs space-y-1.5" style={{ color: '#B91C1C' }}>
            <li>Our volunteers rely on your contact number for pickup coordination.</li>
            <li>False contacts delay deliveries and deprive children.</li>
            <li>Repeated fraud will result in permanent suspension.</li>
          </ul>
        </div>

        <div className="mt-5 rounded-2xl border p-4 flex items-start gap-3" style={{ background: '#F0FDF4', borderColor: '#DCFCE7' }}>
          <FiShield className="h-5 w-5 mt-0.5 shrink-0" style={{ color: T.green }} />
          <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>
            Your data is kept private and only used to coordinate donations. We never share your contact information publicly.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAccept}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-md"
            style={{ background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})` }}
          >
            I Understand — Proceed
          </motion.button>
          <motion.button
            whileHover={{ backgroundColor: T.bg }}
            onClick={onCancel}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-colors border"
            style={{ color: T.textSecondary, borderColor: T.border }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
);

const FoodWarningDialog = ({ onAccept, onCancel }) => (
  <AnimatePresence>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(28,25,23,0.6)' }}
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{ background: T.surface, border: `1px solid ${T.borderHover}` }}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#FFF7ED', border: '1px solid #FFEDD5' }}>
          <span className="text-3xl">🍱</span>
        </div>
        <h2 className="font-display text-center text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>
          Food Donation Rules
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          Thank you for choosing to donate food! Please read these important guidelines.
        </p>
        <div className="mt-6 rounded-2xl border p-5 space-y-3" style={{ background: '#FFF7ED', borderColor: '#FFEDD5' }}>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#EA580C' }}>
            <span>⚠️</span> Only raw materials &amp; dry rations
          </p>
          <ul className="ml-6 list-disc text-xs space-y-1.5" style={{ color: '#C2410C' }}>
            <li>Staple grains: rice, wheat, lentils, oats</li>
            <li>Packaged / sealed non-perishables only</li>
            <li>No cooked food, leftovers, or perishables</li>
            <li>No homemade or open-packaged food items</li>
            <li>All items must be within their expiry date</li>
          </ul>
        </div>
        <div className="mt-5 rounded-2xl border p-4 flex items-start gap-3" style={{ background: '#F0FDF4', borderColor: '#DCFCE7' }}>
          <FiShield className="h-5 w-5 mt-0.5 shrink-0" style={{ color: T.green }} />
          <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>
            Following these guidelines ensures the food reaches children safely.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onAccept}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-md"
            style={{ background: '#EA580C' }}
          >
            I Understand — Continue
          </motion.button>
          <motion.button
            whileHover={{ backgroundColor: T.bg }}
            onClick={onCancel}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-colors border"
            style={{ color: T.textSecondary, borderColor: T.border }}
          >
             Different Category
          </motion.button>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
);

export const DonationCategoryPage = () => {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(true);
  const [dialogAccepted, setDialogAccepted] = useState(false);
  const [showFoodDialog, setShowFoodDialog] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [restrictedCategory, setRestrictedCategory] = useState(null);

  React.useEffect(() => {
    const fetchAi = async () => {
      const suggestions = await aiRecommendationService.getSmartSuggestions();
      setAiSuggestions(suggestions);
    };
    fetchAi();

    // Check for restricted category based on request_id
    const fetchRequestCategory = async () => {
      const requestId = location.state?.request_id;
      if (!requestId) return;

      try {
        const { data } = await supabase
          .from('orphan_requests')
          .select('category')
          .eq('id', requestId)
          .single();
        if (data) setRestrictedCategory(data.category);
      } catch (err) { console.error('Error fetching request category:', err); }
    };
    fetchRequestCategory();
  }, [location.state?.request_id]);

  const handleAccept = () => {
    setShowDialog(false);
    setDialogAccepted(true);
  };

  const handleCancel = () => navigate('/donor/dashboard');

  const handleSelectCategory = (category) => {
    if (category === 'Food') {
      setPendingCategory(category);
      setShowFoodDialog(true);
      return;
    }
    navigate('/donor/donate/items', { state: { 
      selectedCategory: category,
      orphanage_id: location.state?.orphanage_id,
      request_id: location.state?.request_id
    } });
  };

  const handleFoodAccept = () => {
    setShowFoodDialog(false);
    navigate('/donor/donate/items', { state: { 
      selectedCategory: pendingCategory,
      orphanage_id: location.state?.orphanage_id,
      request_id: location.state?.request_id
    } });
  };

  const handleFoodCancel = () => {
    setShowFoodDialog(false);
    setPendingCategory(null);
  };

  return (
    <div className="min-h-screen pt-20 pb-16 relative overflow-hidden" style={{ background: T.bg }}>
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-1/2 h-[500px] pointer-events-none" style={{ background: `radial-gradient(ellipse at top right, ${T.orangeGlow} 0%, transparent 60%)`, zIndex: 0 }} />
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] pointer-events-none" style={{ background: `radial-gradient(ellipse at bottom left, rgba(244,161,53,0.1) 0%, transparent 60%)`, zIndex: 0 }} />
      
      {/* Background Dots */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.04, zIndex: 0 }}>
        <defs>
          <pattern id="light-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#1C1917" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#light-dots)" />
      </svg>

      {/* Dialogs */}
      {showDialog && <IntegrityDialog onAccept={handleAccept} onCancel={handleCancel} />}
      {showFoodDialog && <FoodWarningDialog onAccept={handleFoodAccept} onCancel={handleFoodCancel} />}

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
            style={{ background: T.orangeLight, border: `1px solid rgba(232,98,42,0.2)` }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Step 1 of 3
            </span>
          </motion.div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: T.textPrimary }}>
            Select Category
          </h1>
          <p className="text-lg" style={{ color: T.textSecondary }}>
            What kind of items would you like to donate today?
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-lg text-white" style={{ background: T.orange, boxShadow: `0 0 20px ${T.orangeGlow}` }}>1</motion.div>
            <div className="h-1 w-16 rounded" style={{ background: T.surfaceMid }}></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold" style={{ background: T.surface, borderColor: T.border, color: T.textMuted }}>2</div>
            <div className="h-1 w-16 rounded" style={{ background: T.surfaceMid }}></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold" style={{ background: T.surface, borderColor: T.border, color: T.textMuted }}>3</div>
          </div>
        </div>

        <motion.div 
          className={`transition-all duration-700 ease-in-out ${!dialogAccepted ? 'opacity-30 pointer-events-none blur-sm' : 'opacity-100 blur-none'}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DONATION_CATEGORIES.filter(c => !restrictedCategory || c === restrictedCategory).map((category, i) => {
              const suggestion = aiSuggestions.find(s => s.category === category);
              const isRecommended = !!suggestion;
              return (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => handleSelectCategory(category)}
                  className="cursor-pointer relative rounded-3xl p-8 group flex items-start justify-between transition-all duration-300"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: `0 4px 20px rgba(0,0,0,0.02)` }}
                  whileHover={{ y: -4, borderColor: 'rgba(232,98,42,0.3)', boxShadow: `0 16px 32px rgba(232,98,42,0.12)` }}
                >
                  {isRecommended && (
                    <div style={{ position:'absolute', top: 16, right: 64, display:'flex', alignItems:'center', gap:4, background: T.orange, color:'#fff', padding:'5px 12px', borderRadius:10, fontSize:9, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em', boxShadow:`0 4px 12px ${T.orangeGlow}`, zIndex: 10 }}>
                       <FiZap size={10} className="animate-pulse" /> AI Suggestion (Live Analysis)
                    </div>
                  )}

                  <div className="relative z-10 pr-14">
                    <h3 className="font-bold text-xl mb-2 tracking-tight transition-colors" style={{ color: T.textPrimary }}>
                      <span className="group-hover:text-[#E8622A] transition-colors">{category}</span>
                    </h3>
                    <p style={{ color: T.textSecondary, fontSize: 13.5, lineHeight: 1.6 }}>
                      {category === 'Food' ? 'Raw materials & dry rations only.' : `Donate gently used or new ${category.toLowerCase()} items.`}
                    </p>
                    {isRecommended && (
                      <p style={{ color: T.orange, fontSize: 11, fontWeight: 700, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                         <FiTarget size={12} /> {suggestion.reason.replace(/at .*/, 'across our partner network.')}
                      </p>
                    )}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-300 relative z-10" style={{ borderColor: T.borderHover, background: T.surfaceMid, flexShrink: 0 }}>
                    <FiArrowRight className="w-5 h-5 transition-all duration-300 transform group-hover:translate-x-1" style={{ color: T.textMuted }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <div className="mt-12 flex justify-center">
            <motion.button 
               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
               onClick={handleCancel}
               className="px-8 py-3 rounded-2xl text-sm font-bold transition-all border shadow-sm"
               style={{ color: T.textPrimary, background: T.surface, borderColor: T.border }}
            >
              Back to Dashboard
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
