import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
}

interface AdminAuthState {
  admin: AdminProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAdminAuth: (admin: AdminProfile, token: string) => void;
  clearAdminAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      setAdminAuth: (admin, token) =>
        set({ admin, token, isAuthenticated: true }),
      clearAdminAuth: () =>
        set({ admin: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'apexpay-admin-auth-storage',
    }
  )
);
