// ============================================
// Fichier : stores/authStore.ts
// Description : Store Zustand pour l'authentification globale
// Gère : user, tokens, login, logout, refresh
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import type { Role } from '../types';
import api from '../lib/api';

function extractApiErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role?: 'Employe' | 'Formateur_Interne' | 'Formateur_Externe';
    departementId: number;
    telephone?: string;
    poste?: string;
    otpVerificationToken?: string;
  }) => Promise<{ pending: boolean; message: string }>;
  logout: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = res.data.data;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          set({ isLoading: false });
          throw new Error(extractApiErrorMessage(err, 'Erreur de connexion'));
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', payload);
          set({ isLoading: false });
          return res.data.data as { pending: boolean; message: string };
        } catch (err: unknown) {
          set({ isLoading: false });
          throw new Error(extractApiErrorMessage(err, 'Erreur lors de la création du compte'));
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const res = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          set({ accessToken, refreshToken: newRefresh });
          return true;
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'cni-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper : obtenir le rôle courant
export const useRole = () => useAuthStore((s) => s.user?.role as Role | undefined);
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
