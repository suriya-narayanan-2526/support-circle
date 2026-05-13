import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { FiBox, FiX, FiUser, FiTruck, FiMapPin, FiCalendar, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange:       '#E8622A',
  green:        '#2D9B6F',
  amber:        '#D97706',
  surface:      '#FFFFFF',
  surfaceWarm:  '#FFF5EE',
  border:       'rgba(28,25,23,0.07)',
  borderHover:  'rgba(28,25,23,0.15)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
  textMuted:    '#A8A29E',
};

const StatusBadge = ({ status }) => {
  const styles = {
    submitted: { bg: T.surfaceWarm, text: T.orange, border: 'rgba(232,98,42,0.2)', label: 'SUBMITTED' },
    allocated: { bg: '#EEFAF4', text: T.green, border: 'rgba(45,155,111,0.2)', label: 'VOLUNTEER ASSIGNED' },
    in_transit: { bg: '#EEFAF4', text: T.green, border: 'rgba(45,155,111,0.2)', label: 'ON THE WAY' },
    delivered: { bg: '#F3F4F6', text: '#6B7280', border: 'rgba(107,114,128,0.2)', label: 'DELIVERED' },
    cancelled: { bg: '#FEF2F2', text: '#EF4444', border: 'rgba(239,68,68,0.2)', label: 'CANCELLED' }
  };
  const s = styles[status] || styles.submitted;
  
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      padding: '4px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 800,
      letterSpacing: '0.08em', textTransform: 'uppercase'
    }}>
      {s.label}
    </span>
  );
};

export const DonationHistory = ({ limit }) => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [volunteerInfo, setVolunteerInfo] = useState(null);

  // Fetch volunteer info when a donation with a volunteer_id is selected
  useEffect(() => {
    if (selectedDonation?.volunteer_id) {
       const fetchVol = async () => {
          const { data } = await supabase.from('volunteers').select('full_name, phone, face_image').eq('user_id', selectedDonation.volunteer_id).maybeSingle();
          if (data) setVolunteerInfo(data);
       };
       fetchVol();
    } else {
       setVolunteerInfo(null);
    }
  }, [selectedDonation]);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        if (!user) return;
        let query = supabase.from('donations').select('*').eq('donor_id', user.id).order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        const { data } = await query;
        if (data) setDonations(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchDonations();
  }, [user, limit]);

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: T.textSecondary, fontWeight: 500 }}>Syncing history...</div>;
  if (donations.length === 0) return (
    <div style={{ padding: 36, textAlign: 'center', background: T.surfaceWarm, borderRadius: 16, border: `1px dashed ${T.borderHover}`, color: T.textSecondary, fontWeight: 500 }}>
      No donation records found. Make your first impact today!
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {donations.map((donation) => (
        <div key={donation.id} onClick={() => setSelectedDonation(donation)} style={{
          background: T.surface, padding: '16px 20px', borderRadius: 16,
          border: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.borderColor = T.borderHover}
        onMouseOut={(e) => e.currentTarget.style.borderColor = T.border}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, background: T.surfaceWarm, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.orange, border: `1px solid rgba(232,98,42,0.15)`
            }}>
              <FiBox size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 2 }}>{donation.category} Donation</h4>
              <p style={{ fontSize: 11, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                {donation.items_json?.length || 0} ITEMS DONATED
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={donation.status} />
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 8, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {new Date(donation.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      ))}
    </div>

      <AnimatePresence>
        {selectedDonation && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDonation(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }}
              className="w-full max-w-md relative z-10 rounded-3xl overflow-hidden flex flex-col">
              
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg, ${T.surfaceWarm}, ${T.surface})`, padding: '24px', borderBottom: `1px solid ${T.border}` }}>
                <button onClick={() => setSelectedDonation(null)} style={{ position: 'absolute', top: 20, right: 20, background: '#fff', border: `1px solid ${T.border}`, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <FiX size={16} />
                </button>
                <div style={{ display: 'inline-block', marginBottom: 12 }}>
                  <StatusBadge status={selectedDonation.status} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary, m: 0 }}>{selectedDonation.category} Donation</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.textSecondary, fontWeight: 600 }}><FiCalendar size={14}/> {new Date(selectedDonation.created_at).toLocaleDateString()}</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.textSecondary, fontWeight: 600 }}><FiClock size={14}/> {new Date(selectedDonation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                 {/* Items */}
                 <h4 style={{ fontSize: 12, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Items Donated</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {(selectedDonation.items_json || []).map((it, idx) => (
                       <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: T.bg, border: `1px solid ${T.border}` }}>
                          <span style={{ fontWeight: 700, color: T.textPrimary, fontSize: 14 }}>{it.name}</span>
                          <span style={{ fontWeight: 800, color: T.textSecondary, fontSize: 13, background: T.surfaceWarm, padding: '2px 8px', borderRadius: 6 }}>{it.quantity}X</span>
                       </div>
                    ))}
                 </div>

                 {/* Volunteer Info */}
                 {selectedDonation.volunteer_id ? (
                   <>
                     <h4 style={{ fontSize: 12, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Delivery Partner</h4>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #EEFAF4 0%, #FFFFFF 100%)', border: '1px solid rgba(45,155,111,0.2)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: T.green, border: `2px solid ${T.surface}` }}>
                           {volunteerInfo?.face_image ? <img src={volunteerInfo.face_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><FiUser size={20}/></div>}
                        </div>
                        <div>
                           <div style={{ fontWeight: 800, color: T.textPrimary, fontSize: 15 }}>{volunteerInfo?.full_name || 'Loading partner...'}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.green, fontWeight: 700, marginTop: 4 }}>
                              <FiTruck size={12}/> Assigned to pickup
                           </div>
                        </div>
                     </div>
                   </>
                 ) : (
                   <div style={{ textAlign: 'center', padding: '20px', background: T.surfaceWarm, borderRadius: 16, border: `1px dashed ${T.borderHover}` }}>
                     <FiClock size={24} style={{ color: T.orange, opacity: 0.5, margin: '0 auto 8px' }} />
                     <p style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600, margin: 0 }}>Waiting for a delivery partner to be assigned.</p>
                   </div>
                 )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
