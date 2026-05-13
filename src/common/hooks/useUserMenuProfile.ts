import { useEffect, useState } from 'react';
import {
  getDefaultUserMenuProfile,
  readUserMenuProfile,
  USER_EMAIL_CHANGE_EVENT,
  USER_PROFILE_CHANGE_EVENT,
  type UserMenuProfile,
  type UserProfileScope,
} from '@/common/utils/user-session-profile';

export function useUserMenuProfile(scope: UserProfileScope): UserMenuProfile {
  const [profile, setProfile] = useState<UserMenuProfile>(() => getDefaultUserMenuProfile(scope));

  useEffect(() => {
    const refreshProfile = () => {
      setProfile(readUserMenuProfile(scope));
    };

    refreshProfile();
    window.addEventListener('storage', refreshProfile);
    window.addEventListener(USER_PROFILE_CHANGE_EVENT, refreshProfile);
    window.addEventListener(USER_EMAIL_CHANGE_EVENT, refreshProfile);

    return () => {
      window.removeEventListener('storage', refreshProfile);
      window.removeEventListener(USER_PROFILE_CHANGE_EVENT, refreshProfile);
      window.removeEventListener(USER_EMAIL_CHANGE_EVENT, refreshProfile);
    };
  }, [scope]);

  return profile;
}
