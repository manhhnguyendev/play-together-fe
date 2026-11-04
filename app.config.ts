import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Google sign-in on a device build returns through a custom scheme derived from the installed-app
 * OAuth client — `com.googleusercontent.apps.<client ID without its suffix>` — so that scheme has
 * to exist in the native project or Android/iOS never hands the response back to the app.
 *
 * The client ID only exists after the Cloud Console entry is created, and it is not a secret (it
 * ships inside the bundle), so it is read from the environment here instead of being hard-coded.
 * `app.config.ts` cannot import from `src/` — Expo evaluates this file with plain `require`, which
 * resolves neither TS nor the project's aliases — so the rule is inlined and kept honest by
 * `src/features/auth/__tests__/googleNativeRedirect.spec.ts`, which fails if the two drift apart.
 *
 * Without either variable the config stays exactly as `app.json` declares it, so Expo Go and web
 * builds are untouched.
 */
const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';
const APP_AUTH_SCHEME_PREFIX = 'com.googleusercontent.apps.';

function googleInstalledScheme(clientId: string | undefined): string | null {
  const trimmed = clientId?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith(APP_AUTH_SCHEME_PREFIX)) return trimmed;
  if (trimmed.endsWith(GOOGLE_CLIENT_ID_SUFFIX)) {
    return `${APP_AUTH_SCHEME_PREFIX}${trimmed.slice(0, -GOOGLE_CLIENT_ID_SUFFIX.length)}`;
  }
  return null;
}

export default function withGoogleScheme({ config }: ConfigContext): Partial<ExpoConfig> {
  const googleScheme = googleInstalledScheme(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  );
  if (!googleScheme) return config;

  const declared = Array.isArray(config.scheme) ? config.scheme : config.scheme ? [config.scheme] : [];
  return { ...config, scheme: Array.from(new Set([...declared, googleScheme])) };
};
