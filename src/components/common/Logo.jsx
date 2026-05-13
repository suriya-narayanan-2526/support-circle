import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Logo = ({ className = '', showText = true, onClick, to = '/' }) => {
  return (
    <Link to={to} onClick={onClick} className={`flex items-center gap-3 ${className}`}>
      <motion.div 
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-teal-600 text-white shadow-lg"
        whileHover={{ rotate: 10, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="h-6 w-6"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </motion.div>
      {showText && (
        <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Support <span className="text-teal-600">Circle</span>
        </span>
      )}
    </Link>
  );
};
