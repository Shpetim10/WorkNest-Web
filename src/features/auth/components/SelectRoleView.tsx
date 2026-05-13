'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, LogOut, UserCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSelectRole } from '../api/login';
import { PlatformAccess } from '../types';
import { LanguageSwitcher, useI18n } from '@/common/i18n';

/**
 * Premium Role Selection View
 * Allows users to choose a specific organization/role context after login.
 */
export const SelectRoleView: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const { loginResponse, clearAuth } = useAuthStore();
  const selectRoleMutation = useSelectRole();

  // If no login response is in store, redirect back to login
  React.useEffect(() => {
    if (!loginResponse) {
      router.push('/login');
    }
  }, [loginResponse, router]);

  if (!loginResponse) return null;

  const handleSelectRole = async (roleAssignmentId: string) => {
    try {
      await selectRoleMutation.mutateAsync({
        roleAssignmentId,
        platformAccess: PlatformAccess.WEB,
      });
      // On success, tokens are updated in localStorage via mutation onSuccess
      router.push('/dashboard');
    } catch (error) {
      console.error(t('auth.selectRole.failedLog'), error);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute right-6 top-6 z-20">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            {t('auth.selectRole.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.selectRole.subtitle')}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {loginResponse.availableContexts?.map((context) => (
            <button
              key={context.roleAssignmentId}
              onClick={() => handleSelectRole(context.roleAssignmentId)}
              disabled={selectRoleMutation.isPending}
              className="group relative flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:ring-1 hover:ring-blue-500 focus:outline-none disabled:opacity-50"
            >
              <div className="flex items-center space-x-4 text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50">
                  <UserCircle className="h-6 w-6 text-gray-400 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {context.companyName}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{context.role}</span>
                    <span>•</span>
                    <span>{context.jobTitle}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('auth.selectRole.signOut')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
