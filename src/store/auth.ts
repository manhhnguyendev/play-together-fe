import { create } from 'zustand';
import { setAccessToken, setUnauthorizedHandler } from '@/api/client';
import { authService } from '@/api/services/auth';
import { userService } from '@/api/services/users';
import type { LoginModel, UserModel } from '@/api/types';
import { STORAGE_KEYS, storage } from '@/lib/storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: UserModel | null;
  bootstrap: () => Promise<void>;
  signInWithCredentials: (credentials: LoginModel) => Promise<UserModel>;
  signInWithToken: (token: string) => Promise<UserModel>;
  refreshUser: () => Promise<UserModel | null>;
  setUser: (user: UserModel) => void;
  signOut: (options?: { callApi?: boolean }) => Promise<void>;
}

let signOutHandler: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  token: null,
  user: null,

  bootstrap: async () => {
    const token = await storage.get(STORAGE_KEYS.token);
    if (!token) {
      setAccessToken(null);
      set({ status: 'signedOut', token: null, user: null });
      return;
    }

    setAccessToken(token);
    try {
      const profile = await userService.getProfile();
      set({ status: 'signedIn', token, user: profile.content });
    } catch {
      setAccessToken(null);
      await storage.remove(STORAGE_KEYS.token);
      set({ status: 'signedOut', token: null, user: null });
    }
  },

  signInWithCredentials: async (credentials) => {
    const result = await authService.login(credentials);
    return get().signInWithToken(result.message);
  },

  signInWithToken: async (token) => {
    setAccessToken(token);
    const profile = await userService.getProfile();
    await storage.set(STORAGE_KEYS.token, token);
    set({ status: 'signedIn', token, user: profile.content });
    return profile.content;
  },

  refreshUser: async () => {
    if (!get().token) return null;
    const profile = await userService.getProfile();
    set({ user: profile.content });
    return profile.content;
  },

  setUser: (user) => set({ user }),

  signOut: async (options) => {
    if (options?.callApi !== false) {
      try {
        await authService.logout();
      } catch {
        // Token may already be expired; local sign-out still proceeds.
      }
    }
    setAccessToken(null);
    await storage.remove(STORAGE_KEYS.token);
    set({ status: 'signedOut', token: null, user: null });
  },
}));

signOutHandler = () => {
  void useAuthStore.getState().signOut({ callApi: false });
};

setUnauthorizedHandler(signOutHandler);
