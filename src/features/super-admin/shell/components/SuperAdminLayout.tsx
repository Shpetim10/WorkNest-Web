"use client";

import React, { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminTopHeader } from './SuperAdminTopHeader';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#E8EFFA] font-sans">
      <SuperAdminSidebar
        isSidebarExpanded={isSidebarExpanded}
        toggleSidebar={() => setIsSidebarExpanded((value) => !value)}
      />

      <div
        className="flex min-w-0 flex-1 flex-col transition-all duration-300"
        style={{ paddingLeft: isSidebarExpanded ? '252px' : '86px' }}
      >
        <div className="sticky top-0 z-20 bg-[#E8EFFA] pr-3 pt-3">
          <SuperAdminTopHeader />
        </div>

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
