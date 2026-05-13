import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-amber text-navy hover:bg-opacity-90',
  secondary: 'bg-teal text-white hover:bg-opacity-90',
  outline: 'border-2 border-navy text-navy hover:bg-navy hover:text-white',
  ghost: 'text-navy hover:bg-navy/5',
  danger: 'bg-red-500 text-white hover:bg-opacity-90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg font-medium',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  fullWidth = false,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type={type}
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
};
