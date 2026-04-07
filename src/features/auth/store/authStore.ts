import { create } from 'zustand';
import { LoginResponse } from '../types';
import { removeCookie } from '@/common/utils/cookies';

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
      localStorage.removeItem('current_company_id');
      removeCookie('auth_token');
    }
    set({ loginResponse: null });
  },
}));
