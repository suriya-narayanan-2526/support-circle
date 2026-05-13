import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardRoute } from '../../utils/constants';

const ROLES = [
  { id: 'donor',             label: 'Donor',     emoji: '💝', color: 'bg-amber-500' },
  { id: 'volunteer',         label: 'Volunteer', emoji: '🚚', color: 'bg-teal-500' },
  { id: 'orphanage',         label: 'Orphanage', emoji: '🏚️', color: 'bg-rose-500' },
  { id: 'community_partner', label: 'Partner',   emoji: '🏛️', color: 'bg-blue-500' },
  { id: 'admin',             label: 'Admin',     emoji: '⚙️', color: 'bg-purple-500' },
];

export const DevRoleSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { role, setMockRole } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = (newRole) => {
    setMockRole(newRole);
    navigate(getDashboardRoute(newRole));
    setOpen(false);
  };

  const current = ROLES.find(r => r.id === role) || ROLES[0];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="mb-2 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden w-52"
          >
            <div className="bg-navy px-4 py-3">
              <p className="text-xs font-bold text-white uppercase tracking-widest">🛠 Dev Role Switcher</p>
              <p className="text-xs text-navy-200 text-teal-200 mt-0.5">Switch role without login</p>
            </div>
            <div className="p-2 space-y-1">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSwitch(r.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${role === r.id
                      ? 'bg-navy text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                  {role === r.id && (
                    <span className="ml-auto text-xs bg-white/20 rounded-full px-2 py-0.5">Active</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-white text-sm font-bold shadow-lg transition-all ${current.color} hover:opacity-90`}
        title="Dev Role Switcher"
      >
        <span>{current.emoji}</span>
        <span>{current.label}</span>
        <span className="ml-1 text-white/70 text-xs">{open ? '▲' : '▼'}</span>
      </motion.button>
    </div>
  );
};
