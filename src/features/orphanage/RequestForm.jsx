import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { DONATION_CATEGORIES } from '../../utils/constants';
import { 
  FiArrowLeft, FiAlertTriangle, FiCheckCircle, 
  FiSend, FiBook, FiShoppingBag, FiSmile, FiCoffee, FiAlignLeft
} from 'react-icons/fi';

/* ─── DESIGN TOKENS ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#C4521F',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0E8',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceWarm:  '#FFF5EE',
  border:       'rgba(28,25,23,0.07)',
  borderMid:    'rgba(28,25,23,0.11)',
  text:         '#1C1917',
  textSub:      '#57534E',
  textMuted:    '#A8A29E',
};

/* ─── DOT GRID ─── */
function DotGrid() {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none' }}>
      <defs>
        <pattern id="req-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1.5" fill="#1C1917" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#req-dots)" />
    </svg>
  );
}

// Category Configuration mapped from constants
const CATEGORY_CONFIG = {
  'Clothing': { icon: FiShoppingBag, color: '#EC4899', bg: '#FCE7F3' }, // Pink
  'Books':    { icon: FiBook,        color: '#3B82F6', bg: '#DBEAFE' }, // Blue
  'Toys':     { icon: FiSmile,       color: '#8B5CF6', bg: '#EDE9FE' }, // Purple
  'Food':     { icon: FiCoffee,      color: '#10B981', bg: '#D1FAE5' }, // Green
};

const getUrgencyConfig = (level) => {
  switch (level) {
    case 1: return { color: '#10B981', label: 'Routine Needs' }; // Green
    case 2: return { color: '#3B82F6', label: 'Important' };     // Blue
    case 3: return { color: '#F59E0B', label: 'High Priority' }; // Amber
    case 4: return { color: '#E8622A', label: 'Urgent' };        // Orange
    case 5: return { color: '#EF4444', label: 'Critical / Emergency' }; // Red
    default: return { color: '#94A3B8', label: '' };
  }
};

const submitRequestToBackend = async (payload, sessionToken) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(payload)
    });
    
    // Check if response is valid JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'API reported failure');
      return data;
    } else {
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      return { success: true };
    }
  } catch (err) {
    console.error('API submission failed:', err);
    throw err; // Re-throw to trigger fallback
  }
};

const requestSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Please provide a detailed description (minimum 10 characters)'),
});

const FOOD_GROUPS = [
  {
    name: "Grains & Flours",
    items: [
      { name: "Rice", unit: "kg" },
      { name: "Wheat / Atta", unit: "kg" },
      { name: "Maida", unit: "kg" },
      { name: "Rava / Suji", unit: "kg" }
    ]
  },
  {
    name: "Pulses & Lentils",
    items: [
      { name: "Toor Dall", unit: "kg" },
      { name: "Moong Dall", unit: "kg" },
      { name: "Masoor Dall", unit: "kg" },
      { name: "Urad Dall", unit: "kg" },
      { name: "Chana Dall", unit: "kg" },
      { name: "Chickpeas", unit: "kg" }
    ]
  },
  {
    name: "Essentials & Liquids",
    items: [
      { name: "Salt", unit: "kg" },
      { name: "Sugar", unit: "kg" },
      { name: "Jaggery", unit: "kg" },
      { name: "Cooking Oil", unit: "litre" },
      { name: "Ghee", unit: "litre" },
      { name: "Buttermilk", unit: "litre" }
    ]
  },
  {
    name: "Indian Spices",
    items: [
      { name: "Turmeric Powder", unit: "kg" },
      { name: "Chilli Powder", unit: "kg" },
      { name: "Mustard Seeds", unit: "kg" },
      { name: "Cumin Seeds", unit: "kg" },
      { name: "Tamarind", unit: "kg" }
    ]
  }
];

export const RequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { "Rice": { selected: true, qty: 10 } }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: { category: '', description: '' }
  });

  const selectedCategory = watch('category');

  const toggleItem = (name) => {
    setSelectedItems(prev => {
      const exists = prev[name];
      if (exists) {
        const { [name]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: { selected: true, qty: 0 } };
    });
  };

  const updateQuantity = (name, qty) => {
    setSelectedItems(prev => ({
      ...prev,
      [name]: { ...prev[name], qty: Math.max(0, parseInt(qty) || 0) }
    }));
  };

  const onSubmit = async (data) => {
    const activeItems = Object.entries(selectedItems)
      .filter(([_, data]) => data.selected && data.qty > 0)
      .map(([name, data]) => {
        // Find unit from FOOD_GROUPS
        let unit = 'kg';
        FOOD_GROUPS.forEach(g => {
          const item = g.items.find(i => i.name === name);
          if (item) unit = item.unit;
        });
        return { name, quantity: data.qty, unit };
      });

    if (selectedCategory === 'Food' && activeItems.length === 0) {
      toast.error('Please select items and specify their quantities.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Get orphanage ID
      const { data: profile } = await supabase.from('orphanages').select('id').eq('user_id', user.id).single();
      if (!profile) throw new Error('Orphanage profile not found');

      const payload = { 
        ...data, 
        orphanage_id: profile.id,
        urgency: 3, 
        beneficiaries: 20, 
        current_stock: 0,
        // Using 'notes' column to store structured JSON items as per user schema
        notes: selectedCategory === 'Food' ? JSON.stringify(activeItems) : null
      };

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        // Attempt API submission
        await submitRequestToBackend(payload, session.access_token);
        toast.success('Request submitted successfully via AI API!');
      } catch (apiError) {
        console.warn('API submission failed, falling back to direct database insert:', apiError);
        
        // Fallback: Direct insert to Supabase
        const { error: dbError } = await supabase.from('orphan_requests').insert(payload);
        if (dbError) throw dbError;
        
        toast.success('Request saved directly to database (AI processing delayed)');
      }

      navigate('/orphanage/dashboard');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit request. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflowX: 'hidden', paddingBottom: 100 }}>
      <DotGrid />

      {/* Cinematic Ambient Glow */}
      <div style={{ position:'fixed', top:'-15%', right:'-10%', width:'60vw', height:'60vw', background:'radial-gradient(ellipse, rgba(232,98,42,0.06) 0%, transparent 60%)', filter:'blur(100px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-10%', left:'-10%', width:'50vw', height:'50vw', background:'radial-gradient(ellipse, rgba(45,155,111,0.05) 0%, transparent 60%)', filter:'blur(100px)', pointerEvents:'none' }}/>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surface, border: `1px solid ${T.borderMid}`, color: T.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '10px 16px', borderRadius: 99, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', transition: 'all 0.2s' }} onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: T.surfaceWarm, color: T.text })} onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: T.surface, color: T.textSub })}>
            <FiArrowLeft size={16} /> Dashboard
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.orangeLight, border: `1px solid ${T.orangeBorder}`, padding: '6px 16px', borderRadius: 999 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.orange }} className="animate-pulse" />
            <span style={{ fontSize: 11, fontWeight: 800, color: T.orange, letterSpacing: '0.08em' }}>AI ENGINE ACTIVE</span>
          </div>
        </div>

        <div className="mb-12">
          <h1 className="font-display font-bold" style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', color: T.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Request Resources
          </h1>
          <p style={{ marginTop: 16, fontSize: 17, color: T.textSub, maxWidth: 500, lineHeight: 1.6, fontWeight: 500 }}>
            Specify your facility's exact needs. Our algorithms will automatically connect you with the highest-priority donors in your sector.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          {/* SECTION 1: CATEGORY SELECTION */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: T.text, color: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>1</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Select Category</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {DONATION_CATEGORIES.map(category => {
                const config = CATEGORY_CONFIG[category] || { icon: FiCheckCircle, color: T.orange, bg: T.orangeLight };
                const Icon = config.icon;
                const isSelected = selectedCategory === category;

                return (
                  <motion.div
                    key={category}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setValue('category', category, { shouldValidate: true })}
                    style={{
                      background: T.surface,
                      border: `2px solid ${isSelected ? config.color : T.borderMid}`,
                      borderRadius: 24, padding: 24, cursor: 'pointer',
                      boxShadow: isSelected ? `0 12px 32px ${config.color}20` : '0 4px 12px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative', overflow: 'hidden'
                    }}
                  >
                    {isSelected && (
                      <motion.div layoutId="activeBg" style={{ position: 'absolute', inset: 0, background: config.bg, opacity: 0.5 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 18, background: isSelected ? config.color : T.surfaceWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#fff' : config.color, transition: 'all 0.2s', marginBottom: 16 }}>
                        <Icon size={24} strokeWidth={2.5} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{category}</h3>
                      <p style={{ fontSize: 13, color: T.textSub, marginTop: 4, fontWeight: 500 }}>
                        {category === 'Food' ? 'Groceries & Meals' : category === 'Clothing' ? 'Apparel & Uniforms' : category === 'Books' ? 'Educational Mats' : 'Toys & Games'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {errors.category && <p style={{ color: '#DC2626', fontSize: 14, marginTop: 12, fontWeight: 600 }}>{errors.category.message}</p>}
          </section>

          {/* SECTION: SPECIFIC ITEMS (Only for Food) */}
          <AnimatePresence>
            {selectedCategory === 'Food' && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: T.orange, color: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                    <FiShoppingBag size={14} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Required Provisions</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                   {FOOD_GROUPS.map(group => (
                     <div key={group.name}>
                        <h3 style={{ fontSize: 11, fontWeight: 900, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                           <span style={{ width: 16, height: 2, background: T.orange, borderRadius: 1 }}></span>
                           {group.name}
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                           {group.items.map(item => {
                             const data = selectedItems[item.name];
                             const isSelected = !!data;
                             
                             return (
                               <motion.div 
                                 key={item.name}
                                 layout
                                 style={{ 
                                   padding: '16px 20px', borderRadius: 24, border: `1px solid ${isSelected ? T.orange : T.border}`,
                                   background: isSelected ? T.orangeLight : T.surface,
                                   transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                   display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                   boxShadow: isSelected ? `0 8px 24px ${T.orangeGlow}` : 'none'
                                 }}
                               >
                                  <div 
                                    onClick={() => toggleItem(item.name)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}
                                  >
                                     <div style={{ 
                                       width: 22, height: 22, borderRadius: 7, border: `2px solid ${isSelected ? T.orange : T.textMuted}`, 
                                       background: isSelected ? T.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' 
                                     }}>
                                        {isSelected && <FiCheckCircle size={14} color="#fff" />}
                                     </div>
                                     <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? T.text : T.textSub }}>{item.name}</span>
                                  </div>

                                  <AnimatePresence>
                                    {isSelected && (
                                      <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 12, padding: '4px 12px', border: `1px solid ${T.orangeBorder}`, width: 100 }}
                                      >
                                         <input 
                                           type="number" 
                                           min="1"
                                           autoFocus
                                           placeholder="Qty"
                                           value={data.qty || ''}
                                           onChange={(e) => updateQuantity(item.name, e.target.value)}
                                           style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontWeight: 800, color: T.text, padding: '4px 0', textAlign: 'center' }}
                                         />
                                         <span style={{ fontSize: 9, fontWeight: 900, color: T.textMuted, textTransform: 'uppercase' }}>
                                           {item.unit === 'litre' ? 'L' : 'KG'}
                                         </span>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                               </motion.div>
                             );
                           })}
                        </div>
                     </div>
                   ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* SECTION 2: DESCRIPTION */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: T.text, color: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>2</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Resource Description</h2>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 20, left: 20, color: focusedInput === 'description' ? T.orange : T.textMuted, transition: 'color 0.2s' }}>
                <FiAlignLeft size={22} />
              </div>
              <textarea
                placeholder="Please describe exactly what you need. Provide specifics like sizes, quantities, ages of children, or any particular brand requirements..."
                {...register('description')}
                onFocus={() => setFocusedInput('description')}
                onBlur={() => setFocusedInput(null)}
                rows={5}
                style={{
                  width: '100%',
                  background: T.surface,
                  border: `2px solid ${focusedInput === 'description' ? T.orange : T.borderMid}`,
                  borderRadius: 24,
                  padding: '20px 24px 20px 56px',
                  color: T.text,
                  fontSize: 16,
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: focusedInput === 'description' ? `0 12px 32px ${T.orangeGlow}` : '0 4px 12px rgba(0,0,0,0.02)',
                  resize: 'vertical',
                  minHeight: 160,
                  lineHeight: 1.6
                }}
              />
            </div>
            {errors.description && <p style={{ color: '#DC2626', fontSize: 14, marginTop: 12, fontWeight: 600 }}>{errors.description.message}</p>}
          </section>

          {/* SUBMIT BUTTON */}
          <div style={{ marginTop: 20 }}>
            <motion.button
              whileHover={{ scale: 1.01, boxShadow: `0 12px 40px ${T.orangeGlow}` }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: T.text, color: T.surfaceWarm, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                padding: '24px', borderRadius: 24, fontWeight: 800, fontSize: 18,
                boxShadow: `0 8px 24px rgba(28,25,23,0.15)`, letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                opacity: isSubmitting ? 0.7 : 1, transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { if(!isSubmitting) e.currentTarget.style.background = T.orangeDark }}
              onMouseLeave={(e) => { if(!isSubmitting) e.currentTarget.style.background = T.text }}
            >
              {isSubmitting ? (
                <>
                   <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                   Processing via AI Engine...
                </>
              ) : (
                <>
                   Transmit Request <FiSend size={20} />
                </>
              )}
            </motion.button>
          </div>

        </form>
      </div>
    </div>
  );
};
