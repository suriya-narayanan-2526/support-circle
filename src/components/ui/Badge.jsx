import React from 'react';

const variants = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber/20 text-amber-900',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-teal/10 text-teal-800',
  navy: 'bg-navy/10 text-navy',
};

export const Badge = ({
  children,
  variant = 'info',
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
