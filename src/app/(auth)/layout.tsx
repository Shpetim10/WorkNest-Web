"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');

  return (
    <div className="relative min-h-screen w-full bg-slate-50 overflow-hidden">
      {/* Background Gradients (Excluded for Login) */}
      {!isLoginPage && (
        <>
          {/* Top-left gradient */}
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] pointer-events-none z-0 opacity-60">
            <Image 
              src="/gradients/container2.png" 
              alt="" 
              fill
              sizes="50vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Bottom-right gradient */}
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] pointer-events-none z-0 opacity-60">
            <Image 
              src="/gradients/container1.png" 
              alt="" 
              fill
              sizes="50vw"
              className="object-contain"
              priority
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}
