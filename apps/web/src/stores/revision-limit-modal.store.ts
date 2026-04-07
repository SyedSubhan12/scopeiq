import { create } from "zustand";

export interface RevisionLimitModalData {
  deliverableId: string;
  deliverableName: string;
  currentRound: number;
  maxRevisions: number;
  projectId: string;
  addonQuote?: {
    price: number;
    description: string;
    label: string;
  };
}

interface RevisionLimitModalState {
  isOpen: boolean;
  data: RevisionLimitModalData | null;
  openModal: (data: RevisionLimitModalData) => void;
  closeModal: () => void;
}

export const useRevisionLimitModal = create<RevisionLimitModalState>((set) => ({
  isOpen: false,
  data: null,
  openModal: (data) => set({ isOpen: true, data }),
  closeModal: () => set({ isOpen: false, data: null }),
}));
