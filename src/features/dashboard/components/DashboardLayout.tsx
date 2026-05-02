"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { useDashboardStore } from '../store/useDashboardStore';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarExpanded } = useDashboardStore();

  return (
    <div className="min-h-screen font-sans flex" style={{ background: '#E8EFFA' }}>
      {/* Floating sidebar */}
      <Sidebar />

      {/* Content column — offset to clear the floating sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarExpanded ? 'md:pl-[252px]' : 'md:pl-[86px]'
        }`}
      >
        {/* Sticky wrapper gives the topbar card its top/right margin while keeping the bg consistent on scroll */}
        <div className="sticky top-0 z-20 pt-3 pr-3" style={{ background: '#E8EFFA' }}>
          <TopHeader />
        </div>

        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-[1440px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
