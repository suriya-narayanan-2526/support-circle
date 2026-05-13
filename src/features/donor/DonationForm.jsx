import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiCheck, FiArrowLeft, FiArrowRight, FiBox, FiPhoneCall, FiZap, FiMapPin, FiEdit2, FiTarget, FiPackage, FiShield } from 'react-icons/fi';
import { LocationModal } from './LocationModal';
import { CATEGORY_ITEMS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { aiRecommendationService } from '../../services/aiRecommendationService';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#D4541E',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0EA',
  green:        '#2D9B6F',
  greenDim:     'rgba(45,155,111,0.15)',
  greenLight:   '#EEFAF4',
  amber:        '#D97706',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceMid:   '#FFF5EE',
  border:       'rgba(28,25,23,0.08)',
  borderHover:  'rgba(28,25,23,0.16)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
  textMuted:    '#A8A29E',
};

// Zod schema for individual items
const itemSchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  quantity: z.number({ invalid_type_error: 'Must be a number' }).min(1, 'Quantity must be at least 1'),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair']).default('Good').optional(),
});

const donationSchema = z.object({
  category: z.string(),
  items: z.array(itemSchema).min(1, 'You must add at least one line item'),
  contact_number: z.string().min(10, 'Please provide a valid contact number (min 10 digits)'),
});

export const DonationForm = () => {
  const [step, setStep] = useState(2); // Start at logical step 2
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddress, setSavedAddress] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const categoryFromState = location.state?.selectedCategory;

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      category: categoryFromState || '',
      items: [{ name: '', quantity: 1, condition: 'Good' }],
      contact_number: ''
    }
  });

  useEffect(() => {
    if (!categoryFromState) {
      toast.error('Please select a category first.');
      navigate('/donor/donate', { replace: true });
    }
  }, [categoryFromState, navigate]);

  // Fetch saved address and coordinates from donors or partners table
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !role) return;

      if (role === 'community_partner') {
        const { data } = await supabase
          .from('partners')
          .select('location, address, institution_name')
          .eq('user_id', user.id)
          .single();
        if (data && (data.address || data.location)) {
          setSavedAddress({
            address_line1: data.address || 'Address not provided',
            city: data.location || 'City not provided',
            pincode: 'N/A',
            label: data.institution_name || 'Partner Location'
          });
        }
      } else {
        const { data } = await supabase
          .from('donors')
          .select('address, latitude, longitude')
          .eq('user_id', user.id)
          .single();
        if (data && data.address) {
          setSavedAddress(data.address);
        }
      }
    };
    loadProfile();

    const fetchAi = async () => {
      const suggestions = await aiRecommendationService.getSmartSuggestions();
      if (suggestions.length > 0) {
        setAiSuggestion(suggestions[0]);
      }
    };
    fetchAi();

    // Fetch request details if request_id is present to restrict items
    const fetchRequestDetails = async () => {
      const requestId = location.state?.request_id;
      if (!requestId) return;

      try {
        const { data, error } = await supabase
          .from('orphan_requests')
          .select('notes, category')
          .eq('id', requestId)
          .single();
        
        if (data && data.notes && data.category === 'Food') {
          try {
            // Attempt to parse notes as JSON items list
            const items = JSON.parse(data.notes);
            if (Array.isArray(items)) {
              // Convert {name, quantity, unit} objects to simple name strings for the restriction logic
              setRestrictedItems(items.map(i => i.name));
            }
          } catch (e) { 
            console.log('Notes is plain text, not JSON');
          }
        }
      } catch (err) { console.error('Error fetching request details:', err); }
    };
    fetchRequestDetails();
  }, [user, role]);

  const [restrictedItems, setRestrictedItems] = useState(null);
  const [requestIntel, setRequestIntel] = useState(null);

  // Fetch full request intel for display
  useEffect(() => {
    const fetchIntel = async () => {
      const requestId = location.state?.request_id;
      if (!requestId) return;
      
      const { data } = await supabase.from('orphan_requests').select('*, orphanages(name)').eq('id', requestId).single();
      if (data) {
        let parsedItems = [];
        try {
          parsedItems = JSON.parse(data.notes);
        } catch (e) {}
        setRequestIntel({ ...data, parsedItems });
      }
    };
    fetchIntel();
  }, [location.state?.request_id]);

  // Prevent hook crash if navigated directly
  if (!categoryFromState) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: T.bg }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: T.orange, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const selectedCategory = watch('category');
  const items = watch('items');

  // Multi-step handlers
  const nextStep = () => {
    if (step === 2) {
      if (!items || items.length === 0) {
        toast.error("Please add at least one item.");
        return;
      }
      // Validate minimum 3 items total across all line items
      const totalQuantity = items.reduce((acc, current) => acc + (current.quantity || 0), 0);
      if (totalQuantity < 3) {
        toast.error("A minimum contribution of 3 items is required.");
        return;
      }
      
      // Enforce raw materials for Food
      if (selectedCategory === 'Food') {
        const hasInvalidFood = items.some(item => 
          item.name.toLowerCase().includes('cooked') || 
          item.name.toLowerCase().includes('leftover')
        );
        if (hasInvalidFood) {
          toast.error("For food category, we only accept raw materials/dry rations.");
          return;
        }

        // Enforce restricted items if they exist
        if (restrictedItems) {
          const invalidItems = items.filter(item => !restrictedItems.includes(item.name));
          if (invalidItems.length > 0) {
            toast.error(`The orphanage specifically requested: ${restrictedItems.join(', ')}. Please only provide these items.`);
            return;
          }
        }
      }
    }
    
    setStep(3);
  };

  const prevStep = () => setStep(2);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let donorName = 'Anonymous Donor';
      let lat = null;
      let lng = null;

      if (role === 'community_partner') {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('institution_name')
          .eq('user_id', user.id)
          .single();
        if (partnerData) {
          donorName = partnerData.institution_name;
        }
      } else {
        const { data: donorData } = await supabase
          .from('donors')
          .select('full_name, latitude, longitude')
          .eq('user_id', user.id)
          .single();
        if (donorData) {
          donorName = donorData.full_name;
          lat = donorData.latitude;
          lng = donorData.longitude;
        }
      }

      const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
      
      const orphanageId = location.state?.orphanage_id;

      const { error: donationError } = await supabase.from('donations').insert({
        donor_id: user.id,
        donor_name: donorName,
        category: data.category,
        items_json: data.items,
        quantity: totalQuantity,
        contact_number: data.contact_number,
        pickup_address: savedAddress || null, 
        latitude: lat,
        longitude: lng,
        status: 'submitted',
        orphanage_id: orphanageId || null,
        request_id: location.state?.request_id || null,
        campaign_id: location.state?.campaign_id || null
      });

      if (donationError) throw donationError;

      // Update donor total donations count (only if they are a donor)
      if (role !== 'community_partner') {
        const { data: donor } = await supabase.from('donors').select('total_donations').eq('user_id', user.id).single();
        if (donor) {
          await supabase.from('donors').update({ total_donations: (donor.total_donations || 0) + 1 }).eq('user_id', user.id);
        }
      }

      toast.success('Donation submitted successfully! Thank you for your contribution.');
      navigate(role === 'community_partner' ? '/partner/dashboard' : '/donor/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to submit donation');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 relative overflow-hidden" style={{ background: T.bg }}>
      {/* Location Modal */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        userId={user?.id}
        currentAddress={savedAddress}
        onSaved={(addr) => setSavedAddress(addr)}
      />

      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-1/2 h-[500px] pointer-events-none" style={{ background: `radial-gradient(ellipse at top right, ${T.orangeGlow} 0%, transparent 60%)`, zIndex: 0 }} />
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] pointer-events-none" style={{ background: `radial-gradient(ellipse at bottom left, rgba(244,161,53,0.1) 0%, transparent 60%)`, zIndex: 0 }} />
      
      {/* Background Dots */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.04, zIndex: 0 }}>
        <defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#1C1917" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-12 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ background: T.orangeLight, border: `1px solid rgba(232,98,42,0.2)` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Step {step} of 3
            </span>
          </motion.div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: T.textPrimary }}>
            {step === 2 ? 'Add Items' : 'Review & Confirm'}
          </h1>
          <p className="text-lg" style={{ color: T.textSecondary }}>
            {step === 2 ? 'Detail the items you are donating.' : 'Verify your donation details before submission.'}
          </p>
        </div>

        {/* MISSION INTEL BANNER - STRONG WORDS */}
        <AnimatePresence>
          {requestIntel && requestIntel.parsedItems && requestIntel.parsedItems.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-10 overflow-hidden rounded-[32px] border-2 shadow-2xl"
              style={{ background: T.surface, borderColor: T.orange }}
            >
              <div className="flex items-center justify-between bg-white px-8 py-4 border-b-2" style={{ borderColor: T.orange }}>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: T.orange }}>
                      <FiTarget size={16} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.orange }}>Official Mission Directive</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Recipient:</span>
                   <span className="text-xs font-black text-stone-900">{requestIntel.orphanages?.name}</span>
                </div>
              </div>
              <div className="p-8" style={{ background: `linear-gradient(to bottom right, #fff, ${T.orangeLight})` }}>
                <p className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: T.textSecondary }}>The Orphanage Urgently Requires:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {requestIntel.parsedItems.map((it, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border-2 shadow-md flex items-center gap-5 group hover:border-orange-500 transition-all" style={{ borderColor: T.orange }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
                        <FiPackage size={24} />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">Mandatory Provision</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-stone-900 tracking-tight">{it.name}</span>
                          <span className="text-base font-black text-orange-600 uppercase">({it.quantity}{it.unit === 'litre' ? 'L' : 'kg'})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-orange-200 flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><FiShield size={12} /></div>
                   <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Only provide the items and quantities listed above for this mission.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border overflow-hidden shadow-2xl"
          style={{ background: T.surface, borderColor: T.borderHover, boxShadow: '0 24px 60px rgba(0,0,0,0.04)' }}
        >
          {step === 2 && (
            <div className="p-6 md:p-10">
              {/* AI SMART SUGGESTION */}
              <AnimatePresence>
                 {aiSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      style={{ background: T.orangeLight, border: `1px solid rgba(232,98,42,0.1)`, borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}
                    >
                       <div style={{ width: 44, height: 44, borderRadius: 12, background: T.orange, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiZap size={22} className="animate-pulse" />
                       </div>
                       <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 10, fontWeight: 900, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>AI Intelligence Recommendation</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                             Consider including {aiSuggestion.category === selectedCategory ? 'essential' : aiSuggestion.category} items. 
                             <span style={{ fontWeight: 500, opacity: 0.8, marginLeft: 4 }}>{aiSuggestion.reason}</span>
                          </p>
                       </div>
                       <button 
                         type="button"
                         onClick={() => setAiSuggestion(null)}
                         style={{ background: 'none', border: 'none', color: T.orange, cursor: 'pointer', padding: 4 }}
                       >
                         <FiCheck />
                       </button>
                    </motion.div>
                 )}
              </AnimatePresence>

              <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: T.border }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: T.textPrimary }}>
                  <FiBox style={{ color: T.orange }} />
                  Items for {selectedCategory}
                </h2>
                <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider" style={{ background: T.orangeLight, color: T.orange, border: '1px solid rgba(232,98,42,0.2)' }}>Min. 3 items total</span>
              </div>

              {/* Quick-add chips */}
              {CATEGORY_ITEMS[selectedCategory] && (
                <div className="mb-8 p-5 rounded-2xl border" style={{ background: T.surfaceMid, borderColor: T.border }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: T.textSecondary }}>
                    <FiZap className="w-3.5 h-3.5" style={{ color: T.orange }} /> 
                    {restrictedItems ? 'Items Requested by Orphanage — click to add' : 'Suggested Items — click to add'}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {(restrictedItems || CATEGORY_ITEMS[selectedCategory]).map((itemLabel) => {
                      const isAdded = fields.some((_, i) => watch(`items.${i}.name`) === itemLabel);
                      return (
                        <motion.button
                          key={itemLabel}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            const emptyIdx = fields.findIndex((_, i) => !watch(`items.${i}.name`));
                            if (emptyIdx !== -1) {
                              setValue(`items.${emptyIdx}.name`, itemLabel, { shouldValidate: true });
                            } else {
                              append({ name: itemLabel, quantity: 1, condition: 'Good' });
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all border shadow-sm"
                          style={{
                            background: isAdded ? T.greenLight : T.surface,
                            borderColor: isAdded ? T.greenDim : T.border,
                            color: isAdded ? T.green : T.textPrimary,
                          }}
                        >
                          {isAdded
                            ? <FiCheck className="w-3.5 h-3.5 shrink-0" style={{ color: T.green }} />
                            : <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.orange, opacity: 0.7 }} />
                          }
                          {itemLabel}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <AnimatePresence>
                  {fields.map((field, index) => (
                     <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col sm:flex-row gap-5 items-start sm:items-end p-6 rounded-2xl relative group border transition-all"
                      style={{ background: T.surface, borderColor: T.borderHover, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                    >
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textSecondary }}>Item Name</label>
                        <input 
                          type="text"
                          placeholder="e.g. Winter Jacket, Math Textbook"
                          className="w-full bg-transparent border-b outline-none pb-2 transition-colors focus:border-[#E8622A]"
                          style={{ borderColor: T.border, color: T.textPrimary, fontWeight: 500 }}
                          {...register(`items.${index}.name`)} 
                        />
                        {errors?.items?.[index]?.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.items[index].name.message}</p>}
                      </div>
                      <div className="w-full sm:w-32 space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textSecondary }}>
                          Qty {selectedCategory === 'Food' ? `(${(() => {
                            const itemName = watch(`items.${index}.name`) || '';
                            const isLiquid = ["oil", "ghee", "buttermilk", "cooking oil"].some(l => itemName.toLowerCase().includes(l));
                            return isLiquid ? 'L' : 'KG';
                          })()})` : ''}
                        </label>
                        <div className="flex items-center gap-2 border-b transition-colors focus-within:border-[#E8622A]" style={{ borderColor: T.border }}>
                          <input 
                            type="number"
                            min="1"
                            className="w-full bg-transparent outline-none pb-2"
                            style={{ color: T.textPrimary, fontWeight: 700 }}
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                          />
                          {selectedCategory === 'Food' && (
                             <span className="text-[10px] font-black text-stone-400 pb-2">
                               {(() => {
                                 const itemName = watch(`items.${index}.name`) || '';
                                 const isLiquid = ["oil", "ghee", "buttermilk", "cooking oil"].some(l => itemName.toLowerCase().includes(l));
                                 return isLiquid ? 'L' : 'KG';
                               })()}
                             </span>
                          )}
                        </div>
                        {errors?.items?.[index]?.quantity && <p className="text-red-500 text-xs mt-1 font-medium">{errors.items[index].quantity.message}</p>}
                      </div>
                      {selectedCategory !== 'Food' && (
                        <div className="w-full sm:w-40 space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textSecondary }}>Condition</label>
                          <select 
                            className="w-full bg-transparent border-b outline-none pb-2 transition-colors focus:border-[#E8622A] cursor-pointer appearance-none"
                            style={{ borderColor: T.border, color: T.textPrimary, fontWeight: 500 }}
                            {...register(`items.${index}.condition`)}
                          >
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                          </select>
                        </div>
                      )}
                      {fields.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto sm:pb-3 transition-colors"
                          style={{ color: T.textMuted }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
                          onMouseOut={(e) => e.currentTarget.style.color = T.textMuted}
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-8">
                <button 
                  type="button" 
                  onClick={() => append({ name: '', quantity: 1, condition: 'Good' })}
                  className="flex items-center gap-3 text-sm font-bold transition-all hover:opacity-80"
                  style={{ color: T.orange }}
                >
                  <div className="p-1.5 rounded-full border" style={{ borderColor: 'rgba(232,98,42,0.3)', background: T.orangeLight }}>
                    <FiPlus />
                  </div>
                  Add another item
                </button>
              </div>

              <div className="mt-12 flex flex-col-reverse sm:flex-row justify-between items-center sm:items-center pt-8 border-t gap-4 sm:gap-0" style={{ borderColor: T.borderHover }}>
                <button 
                  onClick={() => navigate('/donor/donate')}
                  className="text-sm font-bold transition-opacity hover:opacity-70"
                  style={{ color: T.textSecondary }}
                >
                  Back to Categories
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, boxShadow: `0 8px 24px ${T.orangeGlow}` }}
                >
                  Review Details <FiArrowRight />
                </motion.button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Summary side */}
                <div>
                  <h3 className="text-xl font-bold mb-5 border-b pb-3" style={{ color: T.textPrimary, borderColor: T.borderHover }}>Donation Summary</h3>
                  <div className="p-6 rounded-2xl border space-y-5" style={{ background: T.surfaceMid, borderColor: T.border }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: T.textSecondary }}>Category</span>
                      <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-white border" style={{ color: T.textPrimary, borderColor: T.border }}>{selectedCategory}</span>
                    </div>
                    
                    <div>
                      <span className="text-[11px] uppercase tracking-widest font-bold mb-3 block" style={{ color: T.textSecondary }}>Items Included</span>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 rounded-xl border bg-white shadow-sm" style={{ borderColor: T.border }}>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black py-1 px-2.5 rounded-md" style={{ background: T.orangeLight, color: T.orange }}>{item.quantity}x</span>
                              <span className="text-sm font-bold" style={{ color: T.textPrimary }}>{item.name}</span>
                            </div>
                            {selectedCategory !== 'Food' && <span className="text-xs font-semibold" style={{ color: T.textSecondary }}>{item.condition}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 border-t flex justify-between items-center" style={{ borderColor: T.borderHover }}>
                      <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: T.textSecondary }}>Total Items</span>
                      <span className="text-2xl font-black" style={{ color: T.orange }}>{items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Pickup Info Side */}
                <div>
                  <h3 className="text-xl font-bold mb-5 border-b pb-3 flex items-center gap-2" style={{ color: T.textPrimary, borderColor: T.borderHover }}>
                    <FiPhoneCall style={{ color: T.orange }} /> Pickup Info
                  </h3>
                  <div className="p-6 rounded-2xl border space-y-6" style={{ background: T.surfaceMid, borderColor: T.border }}>

                    {/* ── Saved Address Block ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[11px] uppercase tracking-widest font-bold flex items-center gap-2" style={{ color: T.textSecondary }}>
                          <FiMapPin size={12} /> Pickup Address
                        </label>
                        <button
                          type="button"
                          onClick={() => setLocationModalOpen(true)}
                          className="flex items-center gap-1.5 text-xs font-bold transition-colors hover:opacity-70"
                          style={{ color: T.orange }}
                        >
                          <FiEdit2 size={11} />
                          {savedAddress ? 'Change' : 'Set Location'}
                        </button>
                      </div>

                      {savedAddress ? (
                        <div
                          className="rounded-xl p-4 border bg-white shadow-sm"
                          style={{ borderColor: T.amber }}
                        >
                          <div className="flex items-start gap-4">
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: T.amberLight,
                              border: `1px solid rgba(217,119,6,0.2)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <FiMapPin size={16} color={T.amber} />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider" style={{ color: T.amber, marginBottom: 4 }}>
                                {savedAddress.label}
                              </p>
                              <p className="text-[13px] font-bold" style={{ color: T.textPrimary, lineHeight: 1.5 }}>
                                {savedAddress.address_line1}
                                {savedAddress.address_line2 && `, ${savedAddress.address_line2}`}
                              </p>
                              <p className="text-xs font-semibold mt-1" style={{ color: T.textSecondary }}>
                                {savedAddress.city}{savedAddress.state && `, ${savedAddress.state}`} — {savedAddress.pincode}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLocationModalOpen(true)}
                          className="w-full rounded-xl p-5 border text-sm font-bold transition-all hover:bg-white"
                          style={{
                            background: 'transparent',
                            borderColor: T.orange,
                            color: T.orange,
                            borderStyle: 'dashed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                          }}
                        >
                          <FiMapPin size={16} />
                          Tap to set your pickup address
                        </button>
                      )}
                    </div>

                    {/* ── Contact Number ── */}
                    <div className="space-y-3 relative">
                      <label className="text-[11px] uppercase tracking-widest font-bold flex items-center gap-2" style={{ color: T.textSecondary }}>
                        <FiPhoneCall size={12} /> Contact Number
                      </label>
                      <input 
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-white border rounded-xl p-3.5 transition-colors focus:border-[#E8622A] outline-none shadow-sm"
                        style={{ borderColor: T.border, color: T.textPrimary, fontWeight: 600 }}
                        {...register('contact_number')} 
                      />
                      {errors?.contact_number && <p className="text-red-500 text-xs mt-1 font-medium">{errors.contact_number.message}</p>}
                    </div>

                    <p className="text-[11px] leading-relaxed font-medium" style={{ color: T.textSecondary }}>
                      Our verified volunteers will use this number strictly to coordinate your donation pickup. 
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex flex-col-reverse sm:flex-row justify-between items-center sm:items-center pt-8 border-t gap-4 sm:gap-0" style={{ borderColor: T.borderHover }}>
                <button 
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-50 flex items-center gap-2"
                  style={{ color: T.textSecondary }}
                >
                  <FiArrowLeft /> Back to Items
                </button>
                <motion.button 
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 rounded-2xl font-bold text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: T.green, boxShadow: `0 8px 24px rgba(45,155,111,0.25)` }}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
