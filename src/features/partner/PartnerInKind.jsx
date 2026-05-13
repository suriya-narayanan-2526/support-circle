import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { FiBox, FiArrowLeft, FiPlusCircle } from 'react-icons/fi';

const T = {
  orange:       '#E8622A',
  orangeDark:   '#C4521F',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0E8',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceWarm:  '#FFF5EE',
  borderMid:    'rgba(28,25,23,0.11)',
  text:         '#1C1917',
  textSub:      '#57534E',
  textMuted:    '#A8A29E',
};

export const PartnerInKind = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const { data } = await supabase
          .from('donations')
          .select('*')
          .eq('donor_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setDonations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDonations();
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '40px 24px' }}>
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/partner/contributions')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: T.textSub, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 32 }}
        >
          <FiArrowLeft /> Back to Contributions
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: T.orangeLight, border: `1px solid ${T.orangeGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiBox size={18} color={T.orange} />
              </div>
              <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                In-Kind Resources
              </h1>
            </div>
            <p style={{ fontSize: 15, color: T.textSub }}>Log and track physical supplies, food, and equipment donated.</p>
          </div>
          <motion.button 
            onClick={() => navigate('/donor/donate')}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.orange, color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: `0 4px 12px ${T.orangeGlow}` }}
          >
             <FiPlusCircle /> Record Resource
          </motion.button>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.borderMid}`, background: T.surfaceWarm }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Recent Donations</h3>
          </div>

          {loading ? (
             <div style={{ padding: '64px 24px', textAlign: 'center', color: T.textMuted }}>Loading resources...</div>
          ) : donations.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
              <p style={{ color: T.textMuted, fontSize: 15, fontWeight: 500 }}>No physical resources recorded yet.</p>
            </div>
          ) : (
            <div>
              {donations.map((donation, idx) => (
                <div key={donation.id} style={{ padding: '24px 32px', borderBottom: idx === donations.length - 1 ? 'none' : `1px solid ${T.borderMid}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{donation.category}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: T.orangeLight, color: T.orange, borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {donation.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: T.textSub, marginBottom: 8 }}>
                      {donation.items_json?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Various items'}
                    </p>
                    <p style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>
                      {new Date(donation.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                     <span style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{donation.quantity}</span>
                     <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Total Items</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
