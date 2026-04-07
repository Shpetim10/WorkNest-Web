"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { useDashboardStore } from '../store/useDashboardStore';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarExpanded } = useDashboardStore();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex overflow-x-hidden">
      {/* Sidebar - fixed width toggled by store */}
      <Sidebar />

      {/* Main Content Area - dynamic padding to account for fixed Sidebar */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isSidebarExpanded ? 'md:pl-[280px]' : 'md:pl-[80px]'
        }`}
      >
        <TopHeader />
        
        {/* Scrollable page content */}
        <main className="flex-1 p-6 md:p-8 xl:p-10">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
