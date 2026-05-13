"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogOut, Search, Settings } from 'lucide-react';
import { useLogout } from '@/features/auth/api/logout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LanguageSwitcher, useI18n } from '@/common/i18n';
import { useUserMenuProfile } from '@/common/hooks/useUserMenuProfile';
import { ProfileAvatar } from '@/common/ui';
import { getProfileInitial, persistUserProfileFromAuthPayload } from '@/common/utils/user-session-profile';
import { useSuperAdminProfile } from '@/features/super-admin/profile/api/use-super-admin-profile';

function getRoleLabel(role: string, adminRole: string, superAdminRole: string): string {
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, '');

  if (normalized === 'SUPERADMIN') return superAdminRole;
  if (normalized === 'ADMIN') return adminRole;

  return role
    .trim()
    .toLowerCase()
    .replace(/(^|[\s_-])\w/g, (match) => match.toUpperCase())
    .replace(/[_-]/g, ' ');
}

export function SuperAdminTopHeader() {
  const { t } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const storedProfile = useUserMenuProfile('superadmin');
  const hasAuthToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('auth_token'));
  const profileQuery = useSuperAdminProfile({ enabled: hasAuthToken });
  const profileData = profileQuery.data;
  const displayName = profileData?.displayName || storedProfile.displayName;
  const email = profileData?.email || storedProfile.email;
  const role = profileData?.role || storedProfile.role;
  const profile = {
    displayName,
    email,
    role,
    imageUrl: profileData?.imageUrl || storedProfile.imageUrl,
    initial: getProfileInitial(displayName, email),
  };
  const roleLabel = getRoleLabel(role, t('shell.topHeader.adminRole'), t('shell.topHeader.superAdminRole'));
  const logoutMutation = useLogout();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (!profileData) return;

    localStorage.setItem('superadmin_profile_name', profileData.displayName);
    persistUserProfileFromAuthPayload(profileData, {
      displayName: profileData.displayName,
      email: profileData.email,
      role: profileData.role,
      imageUrl: profileData.imageUrl,
    });
  }, [profileData]);

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
        console.warn(t('shell.topHeader.backendLogoutWarning'));
      }
    }

    clearAuth();
    window.location.href = '/login-superadmin';
  };

  return (
    <header className="flex h-[60px] w-full items-center justify-between rounded-2xl bg-white px-6 shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
      <div className="max-w-[400px] flex-1">
        <div className="relative flex items-center">
          <Search size={15} className="pointer-events-none absolute left-3.5 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            placeholder={t('shell.topHeader.superAdminSearch')}
            className="h-9 w-full rounded-xl border border-gray-100 bg-gray-50 pl-10 pr-4 text-[13px] text-gray-600 transition-all placeholder:text-gray-400 focus:border-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <LanguageSwitcher />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((value) => !value)}
            className="focus:outline-none"
            aria-label={profile.displayName}
          >
            <ProfileAvatar
              imageUrl={profile.imageUrl}
              initial={profile.initial}
              alt={profile.displayName}
              fallbackClassName="bg-[#2B7FFF] hover:bg-[#155DFC]"
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_8px_32px_rgba(0,0,0,0.10)] animate-in fade-in zoom-in-95 duration-150">
              <div className="mb-1 border-b border-gray-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar
                    imageUrl={profile.imageUrl}
                    initial={profile.initial}
                    alt={profile.displayName}
                    className="h-10 w-10 shrink-0"
                    fallbackClassName="bg-[#2B7FFF] hover:bg-[#155DFC]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-gray-800">{profile.displayName}</p>
                    <p className="truncate text-[11.5px] font-medium text-gray-400">{profile.email}</p>
                    <p className="mt-1 truncate text-[11px] font-semibold text-[#155DFC]">
                      {t('common.fields.role')}: {roleLabel}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/superadmin_dashboard/profile/personal-info"
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#155DFC]"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings size={16} strokeWidth={2} />
                {t('shell.topHeader.myProfile')}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut size={16} strokeWidth={2.5} />
                {logoutMutation.isPending ? t('shell.topHeader.loggingOut') : t('shell.topHeader.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
