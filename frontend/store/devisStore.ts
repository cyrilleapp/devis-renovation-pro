import { create } from 'zustand';
import { PosteCreate } from '../services/devisService';

interface DevisFormData {
  clientNom: string;
  tvaTaux: number;
  postes: PosteCreate[];
}

interface DevisStore {
  formData: DevisFormData | null;
  setFormData: (data: DevisFormData) => void;
  clearFormData: () => void;
}

export const useDevisStore = create<DevisStore>((set) => ({
  formData: null,
  setFormData: (data) => set({ formData: data }),
  clearFormData: () => set({ formData: null }),
}));
