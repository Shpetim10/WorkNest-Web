"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Languages, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useLogout } from '@/features/auth/api/logout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function TopHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logoutMutation = useLogout();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Attempt backend logout if possible
    if (refreshToken) {
      try {
        await logoutMutation.mutateAsync({ refreshToken });
      } catch (error) {
        // We catch errors silently here because we want to proceed with local logout 
        // even if the server-side revocation fails (e.g. token already expired or server error)
        console.warn('Backend logout failed, proceeding with local cleanup');
      }
    }

    // Always clear local state regardless of API success
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="h-[64px] w-full border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-20" style={{ background: '#BEDBFF4D' }}>
      
      {/* Search Bar */}
      <div className="flex-1 max-w-[480px]">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-gray-400">
            <Search size={18} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search employees, staff..."
            className="w-full h-11 pl-11 pr-4 bg-[#f8fafc] border border-gray-100 rounded-xl text-[13.5px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all font-sans"
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

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-6 border-l border-gray-100 group focus:outline-none"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#00a63e] flex items-center justify-center text-white shadow-sm shadow-[#00a63e]/20 group-hover:scale-105 transition-transform duration-200">
                <User size={18} strokeWidth={2.2} />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#01c951] border-2 border-white rounded-full shadow-sm" />
            </div>
            <ChevronDown 
              size={14} 
              className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              strokeWidth={2.8} 
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-[14px] font-bold text-gray-800">Administrator</p>
                <p className="text-[12px] text-gray-400 font-medium">admin@worknest.com</p>
              </div>

              <Link 
                href="/dashboard/settings/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] font-medium text-gray-600 hover:bg-gray-50 hover:text-[#155DFC] transition-all"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings size={18} strokeWidth={2} />
                My Profile
              </Link>

              <button 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] font-bold text-red-500 hover:bg-red-50/50 transition-all text-left disabled:opacity-50"
              >
                <LogOut size={18} strokeWidth={2.5} />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
