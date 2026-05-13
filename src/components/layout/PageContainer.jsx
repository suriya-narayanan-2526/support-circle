import React from 'react';

export const PageContainer = ({ children, className = '' }) => {
  // We can inject a sidebar or other layout elements here conditionally based on role in the future
  return (
    <div className="flex min-h-screen flex-col bg-warm-white">
      <main className={`flex-grow ${className}`}>
        {children}
      </main>
    </div>
  );
};
