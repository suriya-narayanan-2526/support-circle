import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiBox, FiArrowLeft, FiChevronRight, FiBriefcase } from 'react-icons/fi';

const T = {
  orange:       '#E8622A',
  orangeGlow:   'rgba(232,98,42,0.15)',
  orangeLight:  '#FFF0E8',
  green:        '#2D9B6F',
  greenGlow:    'rgba(45,155,111,0.12)',
  greenLight:   '#EEFAF4',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  borderMid:    'rgba(28,25,23,0.11)',
  text:         '#1C1917',
  textSub:      '#57534E',
};

export const PartnerContributions = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '40px 24px', position: 'relative' }}>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/partner/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: T.textSub, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 32 }}
        >
          <FiArrowLeft /> Back to Dashboard
        </button>

        <div style={{ marginBottom: 40 }}>
          <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Contributions Ledger
          </h1>
          <p style={{ fontSize: 16, color: T.textSub, maxWidth: 600 }}>
            Select a category to view your institution's complete contribution history and to record new donations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          
          {/* IN-KIND RESOURCES CARD */}
          <motion.div 
            onClick={() => navigate('/partner/contributions/in-kind')}
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(232,98,42,0.12)' }}
            whileTap={{ scale: 0.98 }}
            style={{ background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 24, padding: 32, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.orangeLight, border: `1px solid ${T.orangeGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBox size={24} color={T.orange} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>In-Kind Resources</h2>
              <p style={{ fontSize: 15, color: T.textSub, marginTop: 8, lineHeight: 1.5 }}>View history of physical supplies, food, and equipment donated, and record new physical resources.</p>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: T.orange, fontWeight: 700, fontSize: 14 }}>
              View Details <FiChevronRight />
            </div>
          </motion.div>

          {/* FINANCIAL FUNDING CARD */}
          <motion.div 
            onClick={() => navigate('/partner/contributions/financial')}
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(45,155,111,0.12)' }}
            whileTap={{ scale: 0.98 }}
            style={{ background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 24, padding: 32, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.greenLight, border: `1px solid ${T.greenGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBriefcase size={24} color={T.green} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Financial Funding</h2>
              <p style={{ fontSize: 15, color: T.textSub, marginTop: 8, lineHeight: 1.5 }}>Track all monetary donations and institutional grants your organization has provided.</p>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: T.green, fontWeight: 700, fontSize: 14 }}>
              View Details <FiChevronRight />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
