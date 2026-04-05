import { create } from 'zustand';

interface RegistrationStore {
  // Company Data
  companyName: string;
  nipt: string;
  primaryEmail: string;
  primaryPhone: string;
  industry: string;
  currency: string;
  dateFormat: string;

  // Admin Data
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  preferredLanguage: string; // 'en' | 'sq' matching AdminView UI

  // Media (Logo)
  logoFile: File | null;
  logoPreviewUrl: string | null;

  // Actions
  setCompanyData: (data: Partial<Pick<RegistrationStore, 'companyName' | 'nipt' | 'primaryEmail' | 'primaryPhone' | 'industry' | 'currency' | 'dateFormat'>>) => void;
  setAdminData: (data: Partial<Pick<RegistrationStore, 'adminFirstName' | 'adminLastName' | 'adminEmail' | 'adminPhone' | 'preferredLanguage'>>) => void;
  setLogoFile: (file: File | null) => void;
  resetStore: () => void;
}

export const useRegistrationStore = create<RegistrationStore>((set) => ({
  // Defaults
  companyName: '',
  nipt: '',
  primaryEmail: '',
  primaryPhone: '',
  industry: '',
  currency: 'ALL',
  dateFormat: 'DD/MM/YYYY',

  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPhone: '',
  preferredLanguage: 'en',

  logoFile: null,
  logoPreviewUrl: null,

  setCompanyData: (data) => set((state) => ({ ...state, ...data })),
  setAdminData: (data) => set((state) => ({ ...state, ...data })),
  setLogoFile: (file) => set((state) => {
    // Revoke old URL to avoid memory leaks
    if (state.logoPreviewUrl) {
      URL.revokeObjectURL(state.logoPreviewUrl);
    }
    
    return {
      ...state,
      logoFile: file,
      logoPreviewUrl: file ? URL.createObjectURL(file) : null,
    };
  }),

  resetStore: () => set({
    companyName: '',
    nipt: '',
    primaryEmail: '',
    primaryPhone: '',
    industry: '',
    currency: 'ALL',
    dateFormat: 'DD/MM/YYYY',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    preferredLanguage: 'en',
    logoFile: null,
    logoPreviewUrl: null,
  }),
}));
