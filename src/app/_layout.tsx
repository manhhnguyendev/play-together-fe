import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppRouter } from '@/hooks/useAppRouter';
import { clearPushClaim } from '@/navigation/pushGuard';
import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from '@/store/auth';
import { colors, duration, isDark, stackTransition } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Wallet and password tasks: opened from the personal tab, dismissed back to
 * it. They rise like a sheet so the direction says "this belongs to the hub",
 * unlike content screens that slide in from the side.
 */
const SHEET_ROUTES = [
  'transactions',
  'unactive-balance',
  'deposit',
  'withdraw',
  'personal-change-password',
] as const;

/** Whole groups swapping in place — signing in, finishing onboarding. */
const GROUP_OPTIONS = {
  animation: stackTransition.group,
  animationDuration: duration.enter,
};

const SHEET_OPTIONS = {
  animation: stackTransition.sheet,
  animationDuration: duration.sheet,
  // Swipe from anywhere down the page, not only off the edge, and let the
  // gesture replay the sheet animation instead of a side push.
  fullScreenGestureEnabled: true,
  animationMatchesGesture: true,
};

/**
 * A wizard step drilled into the flow, so it travels on the same horizontal
 * axis as the content around it — and back must mirror that. `gestureEnabled`
 * is off only because completing it is the single way out.
 */
const ONBOARDING_OPTIONS = {
  animation: stackTransition.push,
  gestureEnabled: false,
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const segments = useSegments();
  const pathname = usePathname();
  const router = useAppRouter();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (status !== 'signedOut') return;
    const root = segments[0];
    if (!root || root === '(auth)') return;
    router.replace('/(auth)/login');
  }, [status, segments, router]);

  // Tells `pushGuard` the app moved, so a screen that has finished arriving
  // stops holding the claim.
  useEffect(() => {
    clearPushClaim();
  }, [pathname]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: stackTransition.push,
            gestureEnabled: true,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={GROUP_OPTIONS} />
          <Stack.Screen name="(auth)" options={GROUP_OPTIONS} />
          <Stack.Screen name="(tabs)" options={GROUP_OPTIONS} />
          <Stack.Screen name="onboarding/take-categories" options={ONBOARDING_OPTIONS} />
          {SHEET_ROUTES.map((name) => (
            <Stack.Screen key={name} name={name} options={SHEET_OPTIONS} />
          ))}
        </Stack>
      </AppProviders>
    </SafeAreaProvider>
  );
}
