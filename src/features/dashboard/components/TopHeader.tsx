"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, Bell, LogOut, Settings } from 'lucide-react';
import { useLogout } from '@/features/auth/api/logout';
import { useAuthStore } from '@/features/auth/store/authStore';
import Link from 'next/link';

export function TopHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInitial, setUserInitial] = useState('U');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logoutMutation = useLogout();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const email = localStorage.getItem('user_email') ?? '';
    setUserInitial(email.charAt(0).toUpperCase() || 'U');
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (refreshToken) {
      try {
        await logoutMutation.mutateAsync({ refreshToken });
      } catch {
        console.warn('Backend logout failed, proceeding with local cleanup');
      }
    }
    clearAuth();
    // Full page reload clears TanStack Query cache and Next.js Router Cache,
    // preventing stale data from leaking into a subsequent user's session.
    window.location.href = '/login';
  };

  return (
    <header className="h-[60px] w-full flex items-center justify-between px-6 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.07)]">

      {/* Search */}
      <div className="flex-1 max-w-[400px]">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3.5 text-gray-400 pointer-events-none" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search employees, staff..."
            className="w-full h-9 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300/60 transition-all"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-5">

        {/* Language */}
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
          <Globe size={16} strokeWidth={2} />
          <span className="text-[12px] font-semibold tracking-wide">EN</span>
        </button>

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white" />
        </button>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-[14px] font-bold hover:bg-blue-600 transition-colors">
              {userInitial}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] py-2 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
              <div className="px-4 py-2.5 border-b border-gray-50 mb-1">
                <p className="text-[13.5px] font-bold text-gray-800">Administrator</p>
                <p className="text-[11.5px] text-gray-400 font-medium">admin@worknest.com</p>
              </div>

              <Link
                href="/dashboard/settings/profile"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings size={16} strokeWidth={2} />
                My Profile
              </Link>

              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
              >
                <LogOut size={16} strokeWidth={2.5} />
                {logoutMutation.isPending ? 'Logging out…' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
