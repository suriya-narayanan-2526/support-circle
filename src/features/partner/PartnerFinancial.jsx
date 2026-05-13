import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiArrowLeft, FiPlusCircle } from 'react-icons/fi';

const T = {
  green:        '#2D9B6F',
  greenGlow:    'rgba(45,155,111,0.12)',
  greenLight:   '#EEFAF4',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  surfaceWarm:  '#FFF5EE',
  borderMid:    'rgba(28,25,23,0.11)',
  text:         '#1C1917',
  textSub:      '#57534E',
  textMuted:    '#A8A29E',
};

export const PartnerFinancial = () => {
  const navigate = useNavigate();
  // Financial contributions logic not yet backed by DB, use empty array
  const [donations] = useState([]);

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
              <div style={{ width: 42, height: 42, borderRadius: 12, background: T.greenLight, border: `1px solid ${T.greenGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiBriefcase size={18} color={T.green} />
              </div>
              <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                Financial Funding
              </h1>
            </div>
            <p style={{ fontSize: 15, color: T.textSub }}>Log and track monetary donations and institutional grants.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.green, color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: `0 4px 12px ${T.greenGlow}` }}
          >
             <FiPlusCircle /> Record Funding
          </motion.button>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.borderMid}`, background: T.surfaceWarm }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Recent Funding</h3>
          </div>

          {donations.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
              <p style={{ color: T.textMuted, fontSize: 15, fontWeight: 500 }}>No financial contributions recorded yet.</p>
            </div>
          ) : (
            <div>
              {/* Financial entries would map here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
