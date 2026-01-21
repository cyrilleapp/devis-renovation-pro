import api from './api';

export const referenceService = {
  async getCuisineTypes() {
    const response = await api.get('/references/cuisine/types');
    return response.data;
  },

  async getCuisineElements() {
    const response = await api.get('/references/cuisine/elements');
    return response.data;
  },

  async getCuisineMateriaux() {
    const response = await api.get('/references/cuisine/materiaux');
    return response.data;
  },

  async getCloisons() {
    const response = await api.get('/references/cloisons');
    return response.data;
  },

  async getPeintures() {
    const response = await api.get('/references/peintures');
    return response.data;
  },

  async getParquets() {
    const response = await api.get('/references/parquets');
    return response.data;
  },

  async getExtras(categorie?: string) {
    const params = categorie ? { categorie } : {};
    const response = await api.get('/references/extras', { params });
    return response.data;
  },
};
