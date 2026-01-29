import { create } from 'zustand';
import { PosteCreate } from '../services/devisService';

export interface ClientInfo {
  nom: string;
  prenom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
}

interface DevisFormData {
  client: ClientInfo;
  tvaTaux: number;
  postes: PosteCreate[];
  editingDevisId?: string | null; // ID du devis en cours de modification
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
