"use client";

import React from 'react';
import { UserCircle } from 'lucide-react';
import { PageHeaderDecorativeCircles, ProfilePhotoUploader } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { uploadMedia } from '@/common/api/upload-media';
import { useUserMenuProfile } from '@/common/hooks/useUserMenuProfile';
import {
  clearUserProfileImage,
  persistUserProfileFromAuthPayload,
  resolveProfileImageUrl,
} from '@/common/utils/user-session-profile';

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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-2">
      <span className="block text-[11px] font-medium leading-none text-[#6B7280]">{label}</span>
      <span className="flex h-10 w-full items-center rounded-xl border border-gray-100 bg-[#f8fafc] px-3 text-[14px] font-medium text-[#111827]">
        {value || '-'}
      </span>
    </label>
  );
}

export function AdminProfileView() {
  const { t } = useI18n();
  const profile = useUserMenuProfile('admin');
  const roleLabel = getRoleLabel(profile.role, t('shell.topHeader.adminRole'), t('shell.topHeader.superAdminRole'));

  const handlePhotoUpload = async (file: File) => {
    const uploaded = await uploadMedia(file, 'USER_PROFILE');
    const imageUrl = resolveProfileImageUrl('', uploaded.storageKey);

    persistUserProfileFromAuthPayload(
      {},
      {
        displayName: profile.displayName,
        email: profile.email,
        role: profile.role,
        imageUrl,
        imageKey: uploaded.storageKey,
      },
    );
  };

  const handlePhotoRemove = () => {
    clearUserProfileImage();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div
        className="relative flex min-h-[120px] items-center justify-between overflow-hidden rounded-2xl px-8 py-8"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <PageHeaderDecorativeCircles />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <UserCircle size={25} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('dashboard.profile.title')}</h1>
            <p className="mt-0.5 text-sm text-white/80">{t('dashboard.profile.subtitle')}</p>
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-[#DDE8F8] bg-white"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="border-b border-[#EEF2F7] px-6 py-5">
          <h2 className="text-[17px] font-bold text-[#111827]">{t('dashboard.profile.detailsTitle')}</h2>
          <p className="mt-1 text-[12px] font-medium text-[#6B7280]">{t('dashboard.profile.detailsSubtitle')}</p>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <ProfilePhotoUploader
            imageUrl={profile.imageUrl}
            initial={profile.initial}
            displayName={profile.displayName}
            onUpload={handlePhotoUpload}
            onRemove={handlePhotoRemove}
          />

          <div className="grid content-start gap-6 sm:grid-cols-2">
            <ReadOnlyField label={t('superAdmin.profile.displayName')} value={profile.displayName} />
            <ReadOnlyField label={t('common.fields.emailAddress')} value={profile.email} />
            <ReadOnlyField label={t('common.fields.role')} value={roleLabel} />
            <ReadOnlyField label={t('common.fields.status')} value={t('common.statuses.active')} />
          </div>
        </div>
      </div>
    </div>
  );
}
