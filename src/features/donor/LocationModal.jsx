import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiCheck, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const T = {
  orange:       '#E8622A',
  orangeDark:   '#C4521F',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0E8',
  green:        '#2D9B6F',
  greenGlow:    'rgba(45,155,111,0.12)',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceWarm:  '#FFF5EE',
  border:       'rgba(28,25,23,0.07)',
  textPrimary:  '#1C1917',
  textSecondary:'#57534E',
};

const QUICK_TAGS = ['Home', 'Work', 'Office', 'Other'];

export const LocationModal = ({ isOpen, onClose, userId, currentAddress, onSaved }) => {
  const [form, setForm] = useState({
    label: currentAddress?.label || 'Home',
    address_line1: currentAddress?.address_line1 || '',
    address_line2: currentAddress?.address_line2 || '',
    city: currentAddress?.city || '',
    state: currentAddress?.state || '',
    pincode: currentAddress?.pincode || '',
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        label: currentAddress?.label || 'Home',
        address_line1: currentAddress?.address_line1 || '',
        address_line2: currentAddress?.address_line2 || '',
        city: currentAddress?.city || '',
        state: currentAddress?.state || '',
        pincode: currentAddress?.pincode || '',
      });
    }
  }, [isOpen, currentAddress]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.address_line1 || !form.city || !form.pincode) {
      toast.error('Please fill address, city, and pincode.');
      return;
    }
    setSaving(true);
    try {
      console.log('Saving address for user:', userId, 'Data:', form);

      // Attempt high-precision geolocation capture
      let coords = { latitude: null, longitude: null };
      try {
        const getPosition = () => new Promise((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, enableHighAccuracy: true })
        );
        const pos = await getPosition();
        coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (geoErr) {
        console.warn('Geolocation capture failed or denied:', geoErr);
      }

      // 1. Check if donor row exists
      const { data: existingDonor, error: fetchError } = await supabase
        .from('donors')
        .select('id, user_id')
        .eq('user_id', userId)
        .single();

      console.log('Existing donor check:', existingDonor, fetchError);

      if (!existingDonor) {
        // No donor row — create one with the address and coordinates
        console.log('No donor row found, creating one...');
        
        // Fetch user info from public.users to keep donors table in sync
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', userId)
          .single();

        const { error: insertError } = await supabase
          .from('donors')
          .insert({ 
            user_id: userId, 
            address: form,
            full_name: userData?.full_name || null,
            email: userData?.email || null,
            latitude: coords.latitude,
            longitude: coords.longitude
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      } else {
        // Donor row exists — update the address and coordinates
        const { data: updateData, error: updateError } = await supabase
          .from('donors')
          .update({ 
            address: form,
            latitude: coords.latitude,
            longitude: coords.longitude
          })
          .eq('user_id', userId)
          .select();

        console.log('Update result:', updateData, updateError);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        if (!updateData || updateData.length === 0) {
          throw new Error('Update matched 0 rows — possible RLS policy issue. Check Supabase RLS on donors table.');
        }
      }

      toast.success('Location saved with GPS sync!');
      onSaved({ ...form, latitude: coords.latitude, longitude: coords.longitude });
      
      // Dispatch global event for Footer to reactive-ly update
      window.dispatchEvent(new CustomEvent('donorAddressUpdated', { detail: { ...form, ...coords } }));
      
      onClose();
    } catch (err) {
      console.error('Location save failed:', err);
      toast.error(err.message || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(28,25,23,0.4)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            style={{
              position: 'relative', zIndex: 1001,
              width: '100%', maxWidth: 520, maxHeight: '95vh', overflowY: 'auto',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 24,
              boxShadow: '0 32px 80px rgba(0,0,0,0.08)',
            }}
          >
            {/* Header shimmer line */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, transparent, ${T.orange}, transparent)`,
            }} />

            <div style={{ padding: '28px 28px 0' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: T.orangeLight,
                    border: `1px solid ${T.orangeGlow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FiMapPin size={18} color={T.orange} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                      Set Pickup Location
                    </h2>
                    <p style={{ fontSize: 12, color: T.textSecondary, margin: 0 }}>
                      Saved for faster future donations
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: T.surfaceWarm, border: 'none', cursor: 'pointer',
                    color: T.textSecondary, borderRadius: 8, padding: '6px 8px',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Address Type Tags */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Address Type
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {QUICK_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, label: tag }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        border: `1px solid ${form.label === tag ? T.orange : T.border}`,
                        background: form.label === tag ? T.orangeLight : T.surfaceWarm,
                        color: form.label === tag ? T.orange : T.textSecondary,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.2s',
                      }}
                    >
                      {form.label === tag && <FiCheck size={11} />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field
                  label="House / Flat / Floor *"
                  placeholder="e.g. 4B, 3rd Floor, Sunshine Towers"
                  value={form.address_line1}
                  onChange={v => setForm(f => ({ ...f, address_line1: v }))}
                />
                <Field
                  label="Street / Area / Landmark"
                  placeholder="e.g. Near City Park, MG Road"
                  value={form.address_line2}
                  onChange={v => setForm(f => ({ ...f, address_line2: v }))}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field
                    label="City *"
                    placeholder="e.g. Chennai"
                    value={form.city}
                    onChange={v => setForm(f => ({ ...f, city: v }))}
                  />
                  <Field
                    label="State"
                    placeholder="e.g. Tamil Nadu"
                    value={form.state}
                    onChange={v => setForm(f => ({ ...f, state: v }))}
                  />
                </div>
                <Field
                  label="Pincode *"
                  placeholder="e.g. 600001"
                  value={form.pincode}
                  onChange={v => setForm(f => ({ ...f, pincode: v }))}
                  type="number"
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '20px 28px 24px', marginTop: 8 }}>
              <motion.button
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%',
                  background: T.orange,
                  color: '#fff',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  padding: '14px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: `0 6px 20px ${T.orangeGlow}`,
                  opacity: saving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck /> Save Location
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* Small reusable input */
function Field({ label, placeholder, value, onChange, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: T.surfaceWarm,
          border: `1px solid ${focused ? T.orange : T.border}`,
          borderRadius: 10,
          padding: '10px 12px',
          color: T.textPrimary,
          fontSize: 14,
          fontWeight: 600,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? `0 0 0 3px ${T.orangeGlow}` : 'none',
        }}
      />
    </div>
  );
}
