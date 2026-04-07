import { create } from 'zustand';

interface DashboardState {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isSidebarExpanded: false, // Collapsed by default per requirement
  toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  setSidebarExpanded: (expanded: boolean) => set({ isSidebarExpanded: expanded }),
}));
