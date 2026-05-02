import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (userData, token) => {
        set({ user: userData, token });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      // Call this after profile update to reflect changes instantly
      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },

      isAuthenticated: () => {
        const { token, user } = get();
        return !!(token && user);
      }
    }),
    {
      name: 'daf3tna-auth', // localStorage key
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);
