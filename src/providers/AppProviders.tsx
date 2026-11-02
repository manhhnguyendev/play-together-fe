import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { type ReactNode, useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { ToastProvider } from '@/components/ui/Toast';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * React Query's "window focus" is a browser concept, so on a phone nothing ever
 * refetches unless the app says so. Without this, a balance that was topped up
 * by another device, an order the counterpart just accepted, or a session the
 * scheduler just started all stay frozen on screen until the user pulls to
 * refresh — which most users never learn to do.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ForegroundSync />
      <OnlineSync />
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

/**
 * Without a signal here React Query assumes the device is always online: it keeps
 * firing requests into a dead radio, shows a spinner instead of an error, and —
 * worse — never refetches when the connection comes back. `expo-network` is the
 * one bundled in Expo Go that reports connectivity, so no development build is
 * needed for this.
 */
function OnlineSync(): null {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    void Network.getNetworkStateAsync().then((state) => {
      onlineManager.setOnline(Boolean(state.isConnected));
    });

    const subscription = Network.addNetworkStateListener((event) => {
      onlineManager.setOnline(Boolean(event.isConnected));
    });
    return () => subscription.remove();
  }, []);

  return null;
}

function ForegroundSync(): null {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const apply = (status: AppStateStatus): void => {
      focusManager.setFocused(status === 'active');
    };
    const current = AppState.currentState as AppStateStatus | null;
    if (current) apply(current);

    const subscription = AppState.addEventListener('change', apply);
    return () => subscription.remove();
  }, []);

  return null;
}
