import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserData } from '../services/authService';

interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nom: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      await AsyncStorage.setItem('auth_token', response.access_token);
      set({ user: response.user, token: response.access_token, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },

  register: async (email: string, password: string, nom: string) => {
    try {
      const response = await authService.register(email, password, nom);
      await AsyncStorage.setItem('auth_token', response.access_token);
      set({ user: response.user, token: response.access_token, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        global.authToken = token;
        const user = await authService.getCurrentUser();
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading token:', error);
      set({ isLoading: false });
    }
  },
}));
