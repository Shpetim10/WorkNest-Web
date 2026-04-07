"use client";

import React from 'react';
import { Search, Languages, Bell, ChevronDown, User } from 'lucide-react';

export function TopHeader() {
  return (
    <header className="h-[64px] w-full bg-white border-b border-[#f1f5f9] flex items-center justify-between px-8 sticky top-0 z-20">
      
      {/* Search Bar */}
      <div className="flex-1 max-w-[480px]">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-gray-400">
            <Search size={18} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search employees, staff..."
            className="w-full h-11 pl-11 pr-4 bg-[#f8fafc] border border-gray-100 rounded-xl text-[13.5px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-7">
        
        {/* Language */}
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-all font-semibold">
          <Languages size={18} strokeWidth={2.2} />
          <span className="text-[12.5px] tracking-tight">EN</span>
        </button>

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-gray-600 transition-all p-1">
          <Bell size={21} strokeWidth={2} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ff4d4f] rounded-full border-2 border-white" />
        </button>

        {/* Profile Dropdown */}
        <button className="flex items-center gap-3 pl-6 border-l border-gray-100 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#00a63e] flex items-center justify-center text-white shadow-sm shadow-[#00a63e]/20 group-hover:scale-105 transition-transform duration-200">
              <User size={18} strokeWidth={2.2} />
            </div>
            {/* Online Indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#01c951] border-2 border-white rounded-full shadow-sm" />
          </div>
          <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" strokeWidth={2.8} />
        </button>

      </div>
    </header>
  );
}
