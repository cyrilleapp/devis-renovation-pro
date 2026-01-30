import api from './api';

export interface Facture {
  id: string;
  numero_facture: string;
  devis_id: string;
  user_id: string;
  client: {
    nom: string;
    prenom?: string;
    adresse?: string;
    code_postal?: string;
    ville?: string;
    telephone?: string;
    email?: string;
  };
  date_creation: string;
  date_paiement?: string;
  tva_taux: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  statut: 'en_attente' | 'payee' | 'annulee';
  postes: any[];
  conditions_paiement?: any;
  notes?: string;
}

export interface FactureListItem {
  id: string;
  numero_facture: string;
  devis_numero: string;
  client_nom: string;
  date_creation: string;
  date_paiement?: string;
  total_ttc: number;
  statut: 'en_attente' | 'payee' | 'annulee';
}

export const factureService = {
  async create(devisId: string): Promise<Facture> {
    const response = await api.post('/factures', { devis_id: devisId });
    return response.data;
  },

  async list(): Promise<FactureListItem[]> {
    const response = await api.get('/factures');
    return response.data;
  },

  async get(id: string): Promise<Facture> {
    const response = await api.get(`/factures/${id}`);
    return response.data;
  },

  async updateStatut(id: string, statut: 'en_attente' | 'payee' | 'annulee'): Promise<void> {
    await api.put(`/factures/${id}/statut?statut=${statut}`);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/factures/${id}`);
  },

  getPdfUrl(id: string): string {
    const baseUrl = api.defaults.baseURL?.replace('/api', '');
    return `${baseUrl}/api/factures/${id}/pdf`;
  },
};
