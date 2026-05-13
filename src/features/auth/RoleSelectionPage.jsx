import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiTruck, FiHome, FiUsers, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

/* ─── DESIGN TOKENS (Warm Charity Theme) ─── */
const T = {
  orange:       '#E8622A',
  orangeDark:   '#D4541E',
  orangeGlow:   'rgba(232,98,42,0.12)',
  orangeLight:  '#FFF0EA',
  green:        '#2D9B6F',
  bg:           '#FFFDF9',
  surface:      '#FFFFFF',
  border:       'rgba(28,25,23,0.08)',
  textPrimary:  '#1C1917',
  textSecondary:'#78716C',
};

/* ─── DOT GRID ─── */
function DotGrid({ opacity = 0.025 }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }}>
      <defs>
        <pattern id="roles-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1C1917" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#roles-dots)" />
    </svg>
  );
}

export const RoleSelectionPage = () => {
  const roles = [
    {
      id: 'donor',
      title: 'Donor',
      description: 'I want to donate items like clothing, books, and food to children in need.',
      icon: <FiHeart size={28} />,
      color: T.orange,
      path: '/auth/register/donor',
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      description: 'I want to help deliver items and support the operations securely.',
      icon: <FiTruck size={28} />,
      color: T.green,
      path: '/auth/register/volunteer',
    },
    {
      id: 'orphanage',
      title: 'Orphanage',
      description: 'I represent an orphanage and need to request assistance and resources.',
      icon: <FiHome size={28} />,
      color: '#D97706',
      path: '/auth/register/orphanage',
    },
    {
      id: 'partner',
      title: 'Community Partner',
      description: 'I represent a school or institution and want to join the network.',
      icon: <FiUsers size={28} />,
      color: '#4F46E5',
      path: '/auth/register/partner',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <DotGrid />

      {/* Decorative Glows */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '40vw', height: '40vw', background: `radial-gradient(ellipse, ${T.orangeGlow} 0%, transparent 70%)`, filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '40vw', height: '40vw', background: `radial-gradient(ellipse, rgba(45,155,111,0.05) 0%, transparent 70%)`, filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1000, width: '100%' }}>
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display" 
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.03em' }}
          >
            How will you <span style={{ color: T.orange }}>contribute?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginTop: 12, fontSize: 18, color: T.textSecondary, maxWidth: 600, margin: '12px auto 0' }}
          >
            Choose your role to start making an impact in our community.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -8 }}
              style={{ height: '100%' }}
            >
              <Link to={role.path} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                <div 
                  style={{ 
                    height: '100%', padding: 32, background: T.surface, 
                    borderRadius: 24, border: `1px solid ${T.border}`,
                    transition: 'all 0.3s ease',
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 4px 20px rgba(28,25,23,0.05)'
                  }}
                  className="group"
                >
                  {/* Subtle Hover Glow */}
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${role.color}08 0%, transparent 100%)`, opacity: 0, transition: 'opacity 0.3s' }} className="group-hover:opacity-100" />

                  <div 
                    style={{ 
                      width: 56, height: 56, borderRadius: 16, background: `${role.color}12`, 
                      border: `1px solid ${role.color}22`, display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                      color: role.color
                    }}
                  >
                    {role.icon}
                  </div>
                  
                  <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>{role.title}</h2>
                  <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6, marginBottom: 24, flex: 1 }}>{role.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: role.color }}>
                    Join Hub <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: 48, textAlign: 'center' }}
        >
          <Link to="/auth/login" style={{ color: T.textSecondary, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }} className="hover:text-stone-900">
            Already have an account? <span style={{ color: T.orange, fontWeight: 600 }}>Log in here</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
