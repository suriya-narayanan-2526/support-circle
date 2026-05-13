import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { FiMenu, FiX, FiLogOut, FiHome, FiInfo, FiUsers, FiGrid, FiChevronRight, FiAward } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../common/Logo';
import { getDashboardRoute } from '../../utils/constants';

/* ─────────────────────────────────────────────
   DESIGN TOKENS — Warm Charity Theme
───────────────────────────────────────────── */
const T = {
  orange:        '#E8622A',
  orangeGlow:    'rgba(232,98,42,0.14)',
  orangeLight:   '#FFF0EA',
  borderWarm:    'rgba(232,98,42,0.20)',
  green:         '#2D9B6F',
  bg:            '#FFFDF9',
  surface:       '#FFFFFF',
  surfaceMid:    '#FFF5EE',
  border:        'rgba(28,25,23,0.08)',
  borderHover:   'rgba(28,25,23,0.14)',
  textPrimary:   '#1C1917',
  textSecondary: '#78716C',
};

const getRoleBadge = (role) => {
  const map = {
    donor:             { label: 'Donor',     bg: '#FFF0EA',                color: '#E8622A', border: 'rgba(232,98,42,0.25)' },
    volunteer:         { label: 'Volunteer', bg: '#EEFAF4',                color: '#2D9B6F', border: 'rgba(45,155,111,0.25)' },
    orphanage:         { label: 'Orphanage', bg: 'rgba(251,113,133,0.10)', color: '#E11D48', border: 'rgba(251,113,133,0.25)' },
    community_partner: { label: 'Partner',   bg: '#FFF8EC',                color: '#B45309', border: 'rgba(244,161,53,0.3)'  },
    admin:             { label: 'Admin',     bg: 'rgba(167,139,250,0.10)', color: '#7C3AED', border: 'rgba(167,139,250,0.25)' },
  };
  return map[role] || { label: role, bg: T.surfaceMid, color: T.textSecondary, border: T.border };
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 10));

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setIsOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home',      path: user ? '/home' : '/', icon: <FiHome /> },
    { name: 'About',     path: '/about',             icon: <FiInfo /> },
    { name: 'Community', path: '/community',         icon: <FiUsers /> },
  ];

  if (role === 'donor' || role === 'volunteer') {
    navLinks.push({ name: 'Impact Hub', path: '/impact-hub', icon: <FiAward /> });
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'My Account';
  const badge = getRoleBadge(role);
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Desktop / Sticky Navbar ── */}
      <motion.nav
        animate={{
          borderBottomColor: T.border,
          backdropFilter: 'blur(18px)',
          background: scrolled
            ? 'rgba(255,253,249,0.97)'
            : 'rgba(255,253,249,0.92)',
          boxShadow: scrolled ? '0 1px 16px rgba(28,25,23,0.08)' : 'none',
        }}
        transition={{ duration: 0.25 }}
        className="sticky top-0 z-50 w-full border-b"
        style={{ borderBottomColor: T.border }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <Logo to={user ? '/home' : '/'} />

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <motion.div
                  key={link.name}
                  className="relative"
                  whileHover="hovered"
                  initial="rest"
                  animate="rest"
                >
                  <Link
                    to={link.path}
                    className="relative block px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    style={{ color: isActive(link.path) ? T.textPrimary : T.textSecondary }}
                  >
                    {link.name}
                    {/* Active indicator */}
                    {isActive(link.path) && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 bottom-0.5 h-[2px] rounded-full"
                        style={{ background: T.orange }}
                      />
                    )}
                    {/* Hover underline (only when NOT active) */}
                    {!isActive(link.path) && (
                      <motion.span
                        className="absolute inset-x-2 bottom-0.5 h-[2px] rounded-full"
                        style={{ background: T.orange, originX: 0 }}
                        variants={{
                          rest:    { scaleX: 0, opacity: 0 },
                          hovered: { scaleX: 1, opacity: 1 },
                        }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Desktop Auth Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {role && (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                      style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                    >
                      {badge.label}
                    </span>
                  )}
                  <Link to={getDashboardRoute(role)}>
                    <motion.button
                      whileHover={{ background: T.surfaceMid, borderColor: T.borderHover }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ color: T.textPrimary, border: `1px solid ${T.border}` }}
                    >
                      Dashboard
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: '#DC2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}
                  >
                    <FiLogOut className="w-4 h-4" /> Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link to="/auth/login">
                    <motion.button
                      whileHover={{ background: T.surfaceMid, borderColor: T.borderHover }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ color: T.textSecondary, border: `1px solid ${T.border}` }}
                    >
                      Log In
                    </motion.button>
                  </Link>
                  <Link to="/donor/donate">
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: `0 8px 20px ${T.orangeGlow}` }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                      style={{ background: `linear-gradient(135deg, ${T.orange}, #D4541E)`, boxShadow: `0 4px 12px ${T.orangeGlow}` }}
                    >
                      Donate Now
                    </motion.button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: T.textPrimary, border: `1px solid ${T.border}`, background: T.surface }}
              aria-label="Open menu"
            >
              <FiMenu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] backdrop-blur-sm md:hidden"
              style={{ background: 'rgba(28,25,23,0.45)' }}
            />

            {/* Drawer */}
            <motion.div
              key="sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 z-[110] w-[min(85vw,22rem)] flex flex-col md:hidden overflow-hidden"
              style={{ background: '#FFFDF9', borderLeft: `1px solid ${T.border}` }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${T.orange}, ${T.green})` }} />

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.border, background: T.surface }}>
                <Logo to={user ? '/home' : '/'} />
                <motion.button
                  whileHover={{ background: T.surfaceMid }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: T.textSecondary, border: `1px solid ${T.border}` }}
                  aria-label="Close menu"
                >
                  <FiX className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3" style={{ color: T.textSecondary }}>Navigation</p>
                <div className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Link
                        to={link.path}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group"
                        style={{
                          background: isActive(link.path) ? T.orangeLight : 'transparent',
                          border: `1px solid ${isActive(link.path) ? T.borderWarm : 'transparent'}`,
                          color: isActive(link.path) ? T.textPrimary : T.textSecondary,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              background: isActive(link.path) ? T.orangeLight : T.surfaceMid,
                              color: isActive(link.path) ? T.orange : T.textSecondary,
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            {link.icon}
                          </span>
                          <span className="font-medium text-sm">{link.name}</span>
                        </div>
                        <FiChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Account Section */}
                <div className="mt-8 pt-6 border-t" style={{ borderColor: T.border }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3" style={{ color: T.textSecondary }}>Account</p>

                  {user ? (
                    <div className="space-y-2">
                      {/* User card */}
                      <div className="p-4 rounded-xl border mb-4" style={{ background: T.surfaceMid, borderColor: T.border }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-white capitalize text-base"
                            style={{ background: `linear-gradient(135deg, ${T.orange}, #D4541E)`, boxShadow: `0 4px 12px ${T.orangeGlow}` }}
                          >
                            {displayName.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-semibold truncate" style={{ color: T.textPrimary }}>{displayName}</p>
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5 border"
                              style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link to={getDashboardRoute(role)} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all border group" style={{ background: T.orangeLight, borderColor: T.borderWarm, color: T.textPrimary }}>
                        <FiGrid className="w-4 h-4" style={{ color: T.orange }} />
                        <span className="text-sm font-medium">View Dashboard</span>
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border"
                        style={{ background: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.15)', color: '#DC2626' }}
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link to="/auth/login" className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all border" style={{ color: T.textPrimary, border: `1px solid ${T.border}`, background: T.surface }}>
                        Log In
                      </Link>
                      <Link to="/donor/donate">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-white"
                          style={{ background: `linear-gradient(135deg, ${T.orange}, #D4541E)`, boxShadow: `0 6px 16px ${T.orangeGlow}` }}
                        >
                          Donate Now
                        </motion.div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-5 py-4 border-t text-center" style={{ borderColor: T.border, background: T.surface }}>
                <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: T.textSecondary, opacity: 0.6 }}>Support Circle · Made with ❤️</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
