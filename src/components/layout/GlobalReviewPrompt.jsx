import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiHeart, FiX, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

/* ─── THEME TOKENS ─── */
const T = {
  orange: '#E8622A', orangeDark: '#D4541E', orangeGlow: 'rgba(232,98,42,0.25)',
  orangeLight: '#FFF0EA',
  green: '#1B7A4A', greenLight: '#E8F5EE', greenGlow: 'rgba(27,122,74,0.15)',
  amber: '#D97706', amberLight: '#FFF7ED',
  bg: '#FFFDF9', surface: '#FFFFFF', surfaceMid: '#FFF5EE',
  border: 'rgba(28,25,23,0.08)', borderHover: 'rgba(28,25,23,0.14)',
  textPrimary: '#1C1917', textSecondary: '#78716C', textMuted: '#A8A29E',
};

export const GlobalReviewPrompt = () => {
  const { user, profile } = useAuth();
  const [pendingRating, setPendingRating] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hovered, setHovered] = useState(0);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'donor') return;

    const checkForUnratedDeliveries = async () => {
      try {
        const { data: deliveredDonations } = await supabase
          .from('donations')
          .select('*')
          .eq('donor_id', user.id)
          .eq('status', 'delivered')
          .order('created_at', { ascending: false });

        const unrated = (deliveredDonations || []).find(
          (d) => d.volunteer_id && !d.pickup_address?.rated_by_donor
        );

        if (unrated) {
          const { data: volData } = await supabase
            .from('volunteers')
            .select('user_id, full_name, face_image, rating, total_reviews')
            .eq('user_id', unrated.volunteer_id)
            .maybeSingle();

          if (volData) {
            setPendingRating({ donation: unrated, volunteer: volData });
            setDismissed(false);
          }
        } else {
          setPendingRating(null);
        }
      } catch (e) {
        console.error('Review check error:', e);
      }
    };

    checkForUnratedDeliveries();

    // Listen for delivery completions in real-time
    const channel = supabase
      .channel('global-review-check')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: `donor_id=eq.${user.id}` }, () => {
        checkForUnratedDeliveries();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, profile]);

  const submitRating = async (stars) => {
    if (!pendingRating) return;
    setIsSubmitting(true);
    const { donation, volunteer } = pendingRating;
    const oldAvg = volunteer.rating || 0;
    const oldCount = volunteer.total_reviews || 0;
    const newCount = oldCount + 1;
    const newAvg = ((oldAvg * oldCount) + stars) / newCount;

    try {
      await supabase.from('volunteers').update({ rating: newAvg, total_reviews: newCount }).eq('user_id', volunteer.user_id);
      const updatedAddress = { ...(donation.pickup_address || {}), rated_by_donor: true, donor_rating: stars };
      await supabase.from('donations').update({ pickup_address: updatedAddress }).eq('id', donation.id);
      toast.success('Thank you for your review! 🎉');
      setPendingRating(null);
      setIsExpanded(false);
      setRating(0);
    } catch (e) {
      toast.error('Failed to submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pendingRating || dismissed) return null;

  const vol = pendingRating.volunteer;
  const firstName = vol?.full_name?.split(' ')[0] || 'Volunteer';

  return (
    <AnimatePresence>
      {!isExpanded ? (
        /* ── COLLAPSED NOTIFICATION PILL ── */
        <motion.div
          key="collapsed"
          initial={{ opacity: 0, x: 100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={{
            position: 'fixed', bottom: 100, right: 24, zIndex: 9998,
            background: T.surface, borderRadius: 20,
            boxShadow: '0 12px 40px rgba(28,25,23,0.14), 0 0 0 1px rgba(28,25,23,0.06)',
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', maxWidth: 340,
          }}
          onClick={() => setIsExpanded(true)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Volunteer Avatar */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${T.greenLight}`, background: T.greenLight,
          }}>
            {vol?.face_image
              ? <img src={vol.face_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiHeart size={18} color={T.green} /></div>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: T.textPrimary, margin: 0, lineHeight: 1.3 }}>
              Pickup Successful! ✅
            </p>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, margin: 0, marginTop: 2 }}>
              Tap to rate <span style={{ color: T.orange, fontWeight: 800, textTransform: 'capitalize' }}>{firstName}</span>
            </p>
          </div>

          {/* Star hint */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: T.amberLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FiStar size={18} fill={T.amber} color={T.amber} />
          </div>

          {/* Dismiss X */}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            style={{
              position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%',
              background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 0,
            }}
          >
            <FiX size={11} color={T.textMuted} />
          </button>
        </motion.div>
      ) : (
        /* ── EXPANDED RATING CARD ── */
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          style={{
            position: 'fixed', bottom: 100, right: 24, zIndex: 9998,
            background: T.surface, borderRadius: 24, width: 340,
            boxShadow: '0 20px 60px rgba(28,25,23,0.16), 0 0 0 1px rgba(28,25,23,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Green header with avatar inside */}
          <div style={{
            background: `linear-gradient(135deg, ${T.green}, #1e7d55)`,
            padding: '20px 20px 24px', position: 'relative', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <FiX size={14} color="#fff" />
            </button>

            <FiCheckCircle size={24} color="#fff" style={{ marginBottom: 6, opacity: 0.9 }} />
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Pickup Successful!
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, margin: '4px 0 16px' }}>
              Rate your volunteer's service
            </p>

            {/* Avatar fully inside green */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
              border: '4px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              background: 'rgba(255,255,255,0.15)',
            }}>
              {vol?.face_image
                ? <img src={vol.face_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiHeart size={30} color="#fff" /></div>
              }
            </div>
          </div>

          {/* Volunteer info + star rating */}
          <div style={{ padding: '16px 20px 20px' }}>
            <p style={{
              textAlign: 'center', fontSize: 15, fontWeight: 800, color: T.textPrimary,
              margin: '0 0 2px', textTransform: 'capitalize',
            }}>
              {vol?.full_name || 'Volunteer'}
            </p>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.textSecondary, margin: 0 }}>
              Support Circle Pickup Partner
            </p>

            {/* Star rating */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '18px 0 20px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', outline: 'none' }}
                >
                  <FiStar
                    size={32}
                    fill={(hovered || rating) >= star ? T.amber : 'transparent'}
                    color={(hovered || rating) >= star ? T.amber : '#D6D3D1'}
                    style={{ transition: 'fill 0.2s, color 0.2s' }}
                  />
                </motion.button>
              ))}
            </div>

            {/* Rating label */}
            <AnimatePresence mode="wait">
              {rating > 0 && (
                <motion.p
                  key={rating}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.amber, margin: '-10px 0 14px' }}
                >
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]} ✨
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              onClick={() => submitRating(rating)}
              disabled={rating === 0 || isSubmitting}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                background: rating > 0 ? `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})` : T.surfaceMid,
                color: rating > 0 ? '#fff' : T.textMuted,
                fontWeight: 800, fontSize: 14, cursor: rating > 0 ? 'pointer' : 'not-allowed',
                boxShadow: rating > 0 ? `0 6px 20px ${T.orangeGlow}` : 'none',
                transition: 'all 0.3s',
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
