import api from './api';

export interface PosteOptions {
  classe_ac?: string;
  sous_couche?: boolean;
  materiau_plan_travail?: string;
  nb_meubles_haut?: number;
  nb_meubles_bas?: number;
  nb_appareils?: number;
  type_finition?: string;
  extras?: string[];
}

export interface PosteCreate {
  categorie: 'cuisine' | 'cloison' | 'peinture' | 'parquet' | string;
  reference_id: string;
  reference_nom: string;
  quantite: number;
  unite: string;
  prix_min: number;
  prix_max: number;
  prix_default: number;
  prix_ajuste?: number;
  options?: PosteOptions;
}

export interface ClientInfo {
  nom: string;
  prenom?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

export interface DevisCreate {
  client: ClientInfo;
  tva_taux: number;
  validite_jours?: number;
  notes?: string;
  postes: PosteCreate[];
}

export interface Devis {
  id: string;
  numero_devis: string;
  user_id: string;
  client: ClientInfo;
  date_creation: string;
  date_validite: string;
  tva_taux: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  statut: string;
  conditions_paiement: any;
  notes: string;
  postes: any[];
}

export interface DevisListItem {
  id: string;
  numero_devis: string;
  client_nom: string;
  date_creation: string;
  total_ttc: number;
  statut: string;
}

export const devisService = {
  async create(data: DevisCreate): Promise<Devis> {
    const response = await api.post('/devis', data);
    return response.data;
  },

  async list(statut?: string): Promise<DevisListItem[]> {
    const params = statut ? { statut } : {};
    const response = await api.get('/devis', { params });
    return response.data;
  },

  async get(id: string): Promise<Devis> {
    const response = await api.get(`/devis/${id}`);
    return response.data;
  },

  async update(id: string, data: any): Promise<Devis> {
    const response = await api.put(`/devis/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, statut: string): Promise<Devis> {
    const response = await api.patch(`/devis/${id}`, { statut });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/devis/${id}`);
  },

  getPdfUrl(id: string): string {
    const baseUrl = api.defaults.baseURL?.replace('/api', '');
    return `${baseUrl}/api/devis/${id}/pdf`;
  },
};
