/**
 * useAuthStore — 전역 인증 상태 관리
 *
 * Usage:
 *   import { useAuthStore } from '@/stores';
 *
 *   // 컴포넌트 내부
 *   const { user, token, isAuthenticated } = useAuthStore();
 *   const setAuth = useAuthStore((s) => s.setAuth);
 *
 *   // 로그인 후
 *   setAuth(token, user);
 *
 *   // 로그아웃
 *   useAuthStore.getState().clearAuth();
 *
 *   // 최신 프로필 재조회 (/api/auth/me)
 *   await useAuthStore.getState().refreshUser();
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  provider?: string | null;
  role?: string;
  plan?: string;
  userType?: string;
  companyName?: string;
  companyTitle?: string;
  isOpenToWork?: boolean;
  openToWorkRoles?: string;
  username?: string;
  resumeCount?: number;
  followerCount?: number;
  followingCount?: number;
  [key: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        const token = get().token;
        if (!token) return null;
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            if (res.status === 401) {
              set({ token: null, user: null, isAuthenticated: false });
            }
            return null;
          }
          const user = (await res.json()) as AuthUser;
          set({ user, isAuthenticated: true });
          return user;
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
