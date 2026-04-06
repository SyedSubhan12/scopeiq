import { create } from "zustand";

interface UIState {
  /** When true, main content uses full sidebar width (240px); when false, main stays at rail width (60px). */
  sidebarPinned: boolean;
  /** Set by Sidebar on pointer enter; cleared after leave delay when not pinned. */
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

export const useUIStore = create<UIState>((set) => ({
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
}));
