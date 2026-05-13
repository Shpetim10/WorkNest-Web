"use client";
import React, { ReactNode } from 'react';
import { LanguageSwitcher } from '@/common/i18n';

interface AuthLayoutProps {
  children: ReactNode;
  containerMaxWidth?: string;
  justify?: 'start' | 'center';
}

export function AuthLayout({
  children,
  containerMaxWidth = "max-w-[1140px]",
  justify = 'start'
}: AuthLayoutProps) {
  const containerClass = justify === 'center' ? 'justify-center' : 'justify-start pt-4 md:pt-5';

  return (
    <div className={`flex flex-col min-h-screen w-full items-center ${containerClass} bg-white font-sans relative pb-10`}>
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>

      {/* Background Glows Wrapper - Shared Auth Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#B9F8CF]/30 rounded-full blur-[140px]" />
      </div>

      {/* Content Container */}
      <div className={`w-full ${containerMaxWidth} px-4 sm:px-6 pb-4 relative z-10 flex flex-col items-center flex-grow`}>
        {children}
      </div>
    </div>
  );
}
