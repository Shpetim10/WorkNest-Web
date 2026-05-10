"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Bell, Globe, LogOut, Search, Settings } from 'lucide-react';
import { useLogout } from '@/features/auth/api/logout';
import { useAuthStore } from '@/features/auth/store/authStore';

function subscribeToUserEmail() {
  return () => {};
}

function getUserEmailSnapshot() {
  return localStorage.getItem('user_email') || 'superadmin@worknest.com';
}

export function SuperAdminTopHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userEmail = useSyncExternalStore(subscribeToUserEmail, getUserEmailSnapshot, () => 'superadmin@worknest.com');
  const userInitial = userEmail.charAt(0).toUpperCase() || 'S';
  const logoutMutation = useLogout();
  const clearAuth = useAuthStore((state) => state.clearAuth);

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
    window.location.href = '/login';
  };

  return (
    <header className="flex h-[60px] w-full items-center justify-between rounded-2xl bg-white px-6 shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
      <div className="max-w-[400px] flex-1">
        <div className="relative flex items-center">
          <Search size={15} className="pointer-events-none absolute left-3.5 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search companies, staff..."
            className="h-9 w-full rounded-xl border border-gray-100 bg-gray-50 pl-10 pr-4 text-[13px] text-gray-600 transition-all placeholder:text-gray-400 focus:border-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          className="flex items-center gap-1.5 text-gray-500 transition-colors hover:text-gray-700"
        >
          <Globe size={16} strokeWidth={2} />
          <span className="text-[12px] font-semibold tracking-wide">EN</span>
        </button>

        <button type="button" className="relative text-gray-400 transition-colors hover:text-gray-600">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-white bg-red-500" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((value) => !value)}
            className="focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B7FFF] text-[14px] font-bold text-white transition-colors hover:bg-[#155DFC]">
              {userInitial}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-52 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_8px_32px_rgba(0,0,0,0.10)] animate-in fade-in zoom-in-95 duration-150">
              <div className="mb-1 border-b border-gray-50 px-4 py-2.5">
                <p className="text-[13.5px] font-bold text-gray-800">Super Administrator</p>
                <p className="truncate text-[11.5px] font-medium text-gray-400">{userEmail}</p>
              </div>

              <Link
                href="/superadmin_dashboard/profile"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#155DFC]"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings size={16} strokeWidth={2} />
                My Profile
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut size={16} strokeWidth={2.5} />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
