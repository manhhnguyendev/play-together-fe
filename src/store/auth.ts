import { create } from 'zustand';
import {
  getSessionTokens,
  setSessionTokens,
  setTokenRefreshHandler,
  setUnauthorizedHandler,
  type SessionTokens,
} from '@/api/client';
import { authService } from '@/api/services/auth';
import { userService } from '@/api/services/users';
import type { LoginModel, UserModel } from '@/api/types';
import type { AuthResponse } from '@/api/v2/types';
import { STORAGE_KEYS, storage } from '@/lib/storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: UserModel | null;
  bootstrap: () => Promise<void>;
  signInWithCredentials: (credentials: LoginModel) => Promise<UserModel>;
  signInWithAuth: (auth: AuthResponse) => Promise<UserModel>;
  applyAuthResponse: (auth: AuthResponse) => Promise<UserModel>;
  refreshUser: () => Promise<UserModel | null>;
  setUser: (user: UserModel) => void;
  signOut: (options?: { callApi?: boolean }) => Promise<void>;
}

const tokensOf = (auth: AuthResponse): SessionTokens => ({
  accessToken: auth.accessToken,
  refreshToken: auth.refreshToken,
});

const persistTokens = async (tokens: SessionTokens) => {
  await Promise.all([
    storage.set(STORAGE_KEYS.token, tokens.accessToken),
    storage.set(STORAGE_KEYS.refreshToken, tokens.refreshToken),
  ]);
};

const clearStoredTokens = async () => {
  await Promise.all([
    storage.remove(STORAGE_KEYS.token),
    storage.remove(STORAGE_KEYS.refreshToken),
  ]);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  token: null,
  user: null,

  bootstrap: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      storage.get(STORAGE_KEYS.token),
      storage.get(STORAGE_KEYS.refreshToken),
    ]);

    if (!accessToken || !refreshToken) {
      setSessionTokens(null);
      await clearStoredTokens();
      set({ status: 'signedOut', token: null, user: null });
      return;
    }

    const tokens = { accessToken, refreshToken };
    setSessionTokens(tokens);

    try {
      const profile = await userService.getProfile();
      set({ status: 'signedIn', token: accessToken, user: profile.content });
    } catch {
      // The HTTP client already tried to refresh the session; a failure here
      // means the stored tokens are unusable.
      if (get().status === 'loading') {
        await get().signOut({ callApi: false });
      }
    }
  },

  signInWithCredentials: async (credentials) => {
    const auth = await authService.login(credentials);
    return get().signInWithAuth(auth);
  },

  signInWithAuth: async (auth) => get().applyAuthResponse(auth),

  applyAuthResponse: async (auth) => {
    const tokens = tokensOf(auth);
    setSessionTokens(tokens);
    await persistTokens(tokens);
    const profile = await userService.getProfile();
    set({
      status: 'signedIn',
      token: tokens.accessToken,
      user: profile.content,
    });
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
    const refreshToken = getSessionTokens()?.refreshToken ?? null;
    if (options?.callApi !== false) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Token may already be expired; local sign-out still proceeds.
      }
    }
    setSessionTokens(null);
    await clearStoredTokens();
    set({ status: 'signedOut', token: null, user: null });
  },
}));

setUnauthorizedHandler(() => {
  void useAuthStore.getState().signOut({ callApi: false });
});

setTokenRefreshHandler((tokens) => {
  void persistTokens(tokens);
  useAuthStore.setState({ token: tokens.accessToken });
});
