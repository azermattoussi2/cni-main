// ============================================
// Fichier : lib/api.ts
// Description : Instance Axios avec interceptors JWT auto-refresh
// ============================================

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur requête : ajoute le Bearer token automatiquement
api.interceptors.request.use((config) => {
  // Lire depuis le store persisté (localStorage)
  try {
    const stored = localStorage.getItem('cni-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
  } catch {}
  return config;
});

// Intercepteur réponse : si 401, tenter refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const stored = localStorage.getItem('cni-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const res = await axios.post('/api/auth/refresh', {
              refreshToken: state.refreshToken,
            });
            const { accessToken, refreshToken } = res.data.data;
            // Mettre à jour le store
            const newState = { ...state, accessToken, refreshToken };
            localStorage.setItem('cni-auth', JSON.stringify({ state: newState }));
            original.headers.Authorization = `Bearer ${accessToken}`;
            return api(original);
          }
        }
      } catch {
        // Refresh échoué → déconnecter
        localStorage.removeItem('cni-auth');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
