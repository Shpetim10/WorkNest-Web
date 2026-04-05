import React, { ReactNode } from 'react';

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] ${className}`}>
      {children}
    </div>
  );
};
