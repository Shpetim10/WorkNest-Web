import { create } from 'zustand';
import { LoginResponse } from '../types';
import { removeCookie } from '@/common/utils/cookies';
import { clearStoredCompanySettings } from '@/features/company-settings/storage';

interface AuthState {
  loginResponse: LoginResponse | null;
  setLoginResponse: (response: LoginResponse | null) => void;
  clearAuth: () => void;
}

/**
 * Zustand store to manage authentication state during the login and role selection flow.
 */
export const useAuthStore = create<AuthState>((set) => ({
  loginResponse: null,
  setLoginResponse: (response) => set({ loginResponse: response }),
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('access_token_expires_at');
      localStorage.removeItem('current_company_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('platform_role');
      clearStoredCompanySettings();
      removeCookie('auth_token');
    }
    set({ loginResponse: null });
  },
}));
