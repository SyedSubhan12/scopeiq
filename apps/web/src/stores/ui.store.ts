import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  /** When true, sidebar stays expanded permanently; when false, collapse/hover controls it. */
  sidebarPinned: boolean;
  /** Set by Sidebar on pointer enter; cleared after leave when not pinned. */
  sidebarHoverOpen: boolean;
  mobileSidebarOpen: boolean;
  activeProjectId: string | null;
  activeTab: string;
  toggleSidebarPinned: () => void;
  setSidebarPinned: (open: boolean) => void;
  setSidebarHoverOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setActiveProjectId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarPinned: false,
      sidebarHoverOpen: false,
      mobileSidebarOpen: false,
      activeProjectId: null,
      activeTab: "brief",
      toggleSidebarPinned: () => set((s) => ({ sidebarPinned: !s.sidebarPinned })),
      setSidebarPinned: (open) => set({ sidebarPinned: open }),
      setSidebarHoverOpen: (open) => set({ sidebarHoverOpen: open }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "scopeiq-ui",
      // Only persist the pinned state — ephemeral state is not saved
      partialize: (state) => ({ sidebarPinned: state.sidebarPinned }),
    },
  ),
);
