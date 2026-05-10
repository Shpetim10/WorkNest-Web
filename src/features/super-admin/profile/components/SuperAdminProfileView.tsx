'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Check, Eye, EyeOff, KeyRound, Loader2, Lock, Save, ShieldCheck, UserCircle, X } from 'lucide-react';
import { PageHeaderDecorativeCircles } from '@/common/ui';
import { useChangePassword } from '@/features/auth/api/change-password';
import {
  DEFAULT_SUPER_ADMIN_PROFILE,
  useSuperAdminProfile,
  useUpdateSuperAdminProfile,
} from '../api/use-super-admin-profile';
import type { SuperAdminProfile } from '../types';

function subscribeToUserEmail(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener('worknest:user-email-changed', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('worknest:user-email-changed', onStoreChange);
  };
}

function getUserEmailSnapshot() {
  return localStorage.getItem('user_email') || DEFAULT_SUPER_ADMIN_PROFILE.email;
}

function getStoredSuperAdminProfile(): SuperAdminProfile {
  if (typeof window === 'undefined') return DEFAULT_SUPER_ADMIN_PROFILE;

  return {
    ...DEFAULT_SUPER_ADMIN_PROFILE,
    displayName:
      localStorage.getItem('superadmin_profile_name') || DEFAULT_SUPER_ADMIN_PROFILE.displayName,
    email: localStorage.getItem('user_email') || DEFAULT_SUPER_ADMIN_PROFILE.email,
  };
}

function persistSuperAdminProfile(profile: SuperAdminProfile) {
  if (typeof window === 'undefined') return;

  localStorage.setItem('superadmin_profile_name', profile.displayName);
  localStorage.setItem('user_email', profile.email);
  window.dispatchEvent(new Event('worknest:user-email-changed'));
}

type PasswordKey = 'current' | 'next' | 'confirm';
export type SuperAdminProfileSection = 'personal-info' | 'change-password';

const PASSWORD_LABELS: Record<PasswordKey, string> = {
  current: 'Current Password',
  next: 'New Password',
  confirm: 'Confirm New Password',
};

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (password: string) => password.length >= 8 },
  { label: 'At least one uppercase letter', test: (password: string) => /[A-Z]/.test(password) },
  { label: 'At least one number', test: (password: string) => /[0-9]/.test(password) },
];

function EditableField({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[11px] font-medium leading-none text-[#6B7280]">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-gray-100 bg-[#f8fafc] px-3 text-[14px] font-medium text-[#111827] outline-none transition-all disabled:cursor-not-allowed disabled:bg-white disabled:text-[#111827] focus:border-[#155dfc]/40 focus:ring-2 focus:ring-[#155dfc]/10"
      />
    </label>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  onChange,
  onToggleVisible,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[13px] font-semibold text-gray-700">{label}</span>
      <span className="relative block">
        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className="h-11 w-full rounded-xl border border-gray-100 bg-[#f8fafc] pl-9 pr-10 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#155dfc]/40 focus:ring-2 focus:ring-[#155dfc]/10"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}

interface SuperAdminProfileViewProps {
  activeSection?: SuperAdminProfileSection;
  enableProfileQuery?: boolean;
}

export function SuperAdminProfileView({
  activeSection = 'personal-info',
  enableProfileQuery = false,
}: SuperAdminProfileViewProps = {}) {
  const changePassword = useChangePassword();
  const profileQuery = useSuperAdminProfile({ enabled: enableProfileQuery });
  const updateProfile = useUpdateSuperAdminProfile();
  const userEmail = useSyncExternalStore(
    subscribeToUserEmail,
    getUserEmailSnapshot,
    () => DEFAULT_SUPER_ADMIN_PROFILE.email,
  );
  const [localProfile, setLocalProfile] = useState<SuperAdminProfile>(() => getStoredSuperAdminProfile());
  const syncedLocalProfile: SuperAdminProfile = { ...localProfile, email: userEmail };
  const currentProfile = profileQuery.data ?? syncedLocalProfile;
  const [draftProfile, setDraftProfile] = useState<SuperAdminProfile | null>(null);
  const isEditing = draftProfile !== null;
  const profileForm = draftProfile ?? currentProfile;
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordData, setPasswordData] = useState<Record<PasswordKey, string>>({
    current: '',
    next: '',
    confirm: '',
  });
  const [visiblePassword, setVisiblePassword] = useState<Record<PasswordKey, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const userInitial = (profileForm.email || currentProfile.email || 'S').charAt(0).toUpperCase() || 'S';
  const newPassword = passwordData.next;
  const passedRuleCount = PASSWORD_RULES.filter((rule) => rule.test(newPassword)).length;
  const strength =
    passedRuleCount === 0 ? 'empty' : passedRuleCount === 1 ? 'weak' : passedRuleCount === 2 ? 'fair' : 'strong';
  const strengthColor = {
    empty: 'bg-gray-200',
    weak: 'bg-red-400',
    fair: 'bg-amber-400',
    strong: 'bg-emerald-500',
  }[strength];
  const isPasswordSection = activeSection === 'change-password';
  const PageIcon = isPasswordSection ? KeyRound : UserCircle;
  const pageTitle = isPasswordSection ? 'Change Password' : 'Personal Info';
  const pageSubtitle = isPasswordSection
    ? 'Update your super administrator account password'
    : 'Manage your super administrator account details';
  const profileLoadError =
    enableProfileQuery && profileQuery.isError ? 'Profile could not be loaded from API. Showing local values.' : '';

  const updateProfileField = (field: keyof SuperAdminProfile) => (value: string) => {
    setDraftProfile((current) => ({ ...(current ?? currentProfile), [field]: value }));
    setProfileMessage('');
    setProfileError('');
  };

  const saveProfile = async () => {
    const displayName = profileForm.displayName.trim();
    const email = profileForm.email.trim();

    if (!displayName || !email) {
      setProfileError('Display name and email are required.');
      setProfileMessage('');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError('Please enter a valid email address.');
      setProfileMessage('');
      return;
    }

    try {
      const serverProfile = enableProfileQuery
        ? await updateProfile.mutateAsync({ displayName, email })
        : {};
      const savedProfile: SuperAdminProfile = {
        ...currentProfile,
        ...serverProfile,
        displayName: serverProfile.displayName?.trim() || displayName,
        email: serverProfile.email?.trim() || email,
      };

      setLocalProfile(savedProfile);
      persistSuperAdminProfile(savedProfile);
      setDraftProfile(null);
      setProfileError('');
      setProfileMessage('Profile saved successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error && error.message ? error.message : 'Failed to save profile.';
      setProfileError(message);
      setProfileMessage('');
    }
  };

  const cancelEdit = () => {
    setDraftProfile(null);
    setProfileError('');
    setProfileMessage('');
  };

  const updatePasswordField = (field: PasswordKey) => (value: string) => {
    setPasswordData((current) => ({ ...current, [field]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.current || !passwordData.next || !passwordData.confirm) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (passwordData.next !== passwordData.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passedRuleCount < PASSWORD_RULES.length) {
      setPasswordError('New password does not meet the requirements.');
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: passwordData.current,
        newPassword: passwordData.next,
      });
      setPasswordData({ current: '', next: '', confirm: '' });
      setPasswordSuccess('Password updated successfully.');
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message ? error.message : 'Failed to change password. Please try again.';
      setPasswordError(message);
    }
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      <div
        className="group relative flex min-h-[120px] items-center justify-between overflow-hidden rounded-2xl px-8 py-8"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <PageHeaderDecorativeCircles />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <PageIcon size={25} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
            <p className="mt-0.5 text-sm text-white/80">{pageSubtitle}</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/5" />
      </div>

      {activeSection === 'personal-info' && (
        <div
          className="overflow-hidden rounded-2xl border border-[#2B7FFF] bg-white"
          style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
        >
          <div
            className="flex items-center gap-4 px-6 py-5"
            style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[22px] font-bold text-[#155DFC]">
              {userInitial}
            </div>
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold leading-7 text-white">{profileForm.displayName}</h2>
              <p className="truncate text-[13px] font-medium text-white/85">{profileForm.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex h-9 items-center gap-2 rounded-xl bg-white/15 px-4 text-[13px] font-bold text-white transition-colors hover:bg-white/20"
                  >
                    <X size={15} strokeWidth={2.2} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={updateProfile.isPending}
                    className="flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-bold text-[#155DFC] transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updateProfile.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} strokeWidth={2.2} />
                    )}
                    {updateProfile.isPending ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraftProfile(currentProfile);
                    setProfileMessage('');
                    setProfileError('');
                  }}
                  className="flex h-9 items-center rounded-xl bg-white px-4 text-[13px] font-bold text-[#155DFC] transition-colors hover:bg-white/90"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-6 px-6 py-6">
            <EditableField
              label="Display Name"
              value={profileForm.displayName}
              disabled={!isEditing}
              onChange={updateProfileField('displayName')}
            />
            <EditableField
              label="Email Address"
              value={profileForm.email}
              disabled={!isEditing}
              type="email"
              onChange={updateProfileField('email')}
            />
            <EditableField label="Role" value={profileForm.role} disabled onChange={updateProfileField('role')} />
            <EditableField
              label="Account Status"
              value={profileForm.accountStatus}
              disabled
              onChange={updateProfileField('accountStatus')}
            />
          </div>

          {(profileMessage || profileError || profileLoadError) && (
            <div className="border-t border-[#EEF2F7] px-6 py-3">
              <p
                className={`text-[13px] font-medium ${
                  profileError || profileLoadError ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {profileError || profileMessage || profileLoadError}
              </p>
            </div>
          )}
        </div>
      )}

      {activeSection === 'change-password' && (
        <div
          className="overflow-hidden rounded-2xl border border-[#DDE8F8] bg-white"
          style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
        >
          <div className="flex items-center gap-3 border-b border-[#EEF2F7] px-6 py-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#155DFC]">
              <KeyRound size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-[17px] font-bold text-[#111827]">Change Password</h2>
              <p className="text-[12px] font-medium text-[#6B7280]">Update your account password</p>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-8 px-6 py-6">
            <div className="max-w-[480px] space-y-5">
              {(['current', 'next', 'confirm'] as PasswordKey[]).map((key) => (
                <PasswordInput
                  key={key}
                  label={PASSWORD_LABELS[key]}
                  value={passwordData[key]}
                  visible={visiblePassword[key]}
                  onChange={updatePasswordField(key)}
                  onToggleVisible={() => setVisiblePassword((current) => ({ ...current, [key]: !current[key] }))}
                />
              ))}

              {(passwordError || passwordSuccess) && (
                <p className={`text-[13px] font-medium ${passwordError ? 'text-red-500' : 'text-emerald-600'}`}>
                  {passwordError || passwordSuccess}
                </p>
              )}

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changePassword.isPending}
                className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] px-5 text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changePassword.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={15} strokeWidth={2.2} />
                    Save Password
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#F8FBFF] p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#008F45]">
                  <ShieldCheck size={17} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#111827]">Password Rules</p>
                  <p className="text-[11px] font-medium text-[#8A9BB2]">Required before saving</p>
                </div>
              </div>

              <div className="mb-4 flex gap-1.5">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                      passedRuleCount > index ? strengthColor : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <div className="space-y-3">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(newPassword);

                  return (
                    <div key={rule.label} className="flex items-center gap-2.5">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          passed ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {passed ? <Check size={11} strokeWidth={3} /> : null}
                      </span>
                      <span className={`text-[12px] ${passed ? 'font-medium text-emerald-600' : 'text-gray-500'}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
