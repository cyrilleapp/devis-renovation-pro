import api from './api';

export interface UserData {
  id: string;
  email: string;
  nom: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

export const authService = {
  async register(email: string, password: string, nom: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', { email, password, nom });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async getCurrentUser(): Promise<UserData> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
