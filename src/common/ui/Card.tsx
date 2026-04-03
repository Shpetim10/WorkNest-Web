import React, { ReactNode } from 'react';

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`bg-white rounded-[24px] ${className}`}>
      {children}
    </div>
  );
};
