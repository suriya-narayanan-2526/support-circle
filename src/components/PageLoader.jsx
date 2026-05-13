import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium full-page loading animation for all dashboards.
 * Uses the warm charity theme with smooth orbit + pulse animations.
 */
export const PageLoader = ({ message = 'Loading', subtitle = '' }) => {
  const T = {
    orange: '#E8622A',
    amber: '#F4A135',
    green: '#2D9B6F',
    bg: '#FFFDF9',
    text: '#1C1917',
    textSub: '#78716C',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.bg, position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient background orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(ellipse, rgba(232,98,42,0.06) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(ellipse, rgba(45,155,111,0.05) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative', zIndex: 2 }}
      >
        {/* Orbiting animation container */}
        <div style={{ width: 88, height: 88, position: 'relative' }}>
          {/* Outer ring — spinning */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: T.orange,
              borderRightColor: T.amber,
            }}
          />
          {/* Middle ring — counter-spin */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: T.green,
              borderLeftColor: `${T.green}80`,
            }}
          />
          {/* Inner ring — fast spin */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 18, borderRadius: '50%',
              border: '2px solid transparent',
              borderBottomColor: T.orange,
              borderLeftColor: `${T.amber}60`,
            }}
          />
          {/* Center pulsing dot */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 14, height: 14, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.orange}, ${T.amber})`,
              boxShadow: `0 0 20px ${T.orange}40`,
            }}
          />
          {/* Orbiting satellite dots */}
          {[0, 120, 240].map((deg, i) => (
            <motion.div
              key={i}
              animate={{ rotate: [deg, deg + 360] }}
              transition={{ repeat: Infinity, duration: 4 + i * 0.5, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              }}
            >
              <motion.div
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 1 + i * 0.3, ease: 'easeInOut' }}
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i === 0 ? T.orange : i === 1 ? T.green : T.amber,
                  boxShadow: `0 0 8px ${i === 0 ? T.orange : i === 1 ? T.green : T.amber}50`,
                  marginTop: -3,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <p style={{
              fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.01em',
              backgroundImage: `linear-gradient(135deg, ${T.orange}, ${T.amber})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {message}
            </p>
          </motion.div>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: 12, color: T.textSub, marginTop: 6, fontWeight: 600 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Progress bar shimmer */}
        <div style={{ width: 180, height: 3, borderRadius: 2, background: 'rgba(28,25,23,0.05)', overflow: 'hidden' }}>
          <motion.div
            animate={{ x: [-180, 180] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            style={{
              width: 80, height: '100%', borderRadius: 2,
              background: `linear-gradient(90deg, transparent, ${T.orange}, transparent)`,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};
