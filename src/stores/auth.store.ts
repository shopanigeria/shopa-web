import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
      setTokens: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: "shopa-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
