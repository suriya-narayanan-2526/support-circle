import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DonationHistory } from './DonationHistory';

/* ─── THEME TOKENS ─── */
const T = {
  bg: '#FFFDF9',
  surface: '#FFFFFF',
  text: '#1C1917',
  textSub: '#78716C',
  orange: '#E8622A',
  orangeLight: '#FFF0E8',
  orangeBorder: 'rgba(232,98,42,0.18)',
};

export const DonationHistoryPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '40px 24px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.orangeLight, border: `1px solid ${T.orangeBorder}`, borderRadius: 99, padding: '5px 13px', marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.orange, boxShadow: `0 0 8px ${T.orange}`, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.orange }}>Full Record</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 800, color: T.text, letterSpacing: '-0.025em', lineHeight: 1.14 }}>
            Donation History
          </h1>
          <p style={{ fontSize: 15, color: T.textSub, marginTop: 8, maxWidth: 500 }}>
            Review all your past contributions and see the impact you've made.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <DonationHistory />
        </motion.div>
        
      </div>
    </div>
  );
};
