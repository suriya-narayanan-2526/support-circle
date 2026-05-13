import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  default: 'bg-white border border-gray-100 shadow-sm',
  stat: 'bg-gradient-to-br from-white to-warm-white border border-gray-100 shadow-sm',
  elevated: 'bg-white shadow-xl shadow-navy/5',
};

export const Card = ({
  children,
  variant = 'default',
  className = '',
  animate = false,
  ...props
}) => {
  const baseClasses = 'rounded-2xl overflow-hidden';
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
