"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUser } from "@/types/auth";

const AUTH_COOKIE_NAME = "rag_scaffold_session";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (payload: { user: AuthUser; token: string }) => void;
  logout: () => void;
  setHydrated: (value: boolean) => void;
};

const setCookie = (token: string) => {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
};

const clearCookie = () => {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: ({ user, token }) => {
        setCookie(token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        clearCookie();
        set({ user: null, token: null, isAuthenticated: false });
      },
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "knowledge-iq-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
