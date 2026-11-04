/**
 * Redirect URI an installed app must use with a Google OAuth client of type
 * "Android" or "iOS".
 *
 * Those clients have no registered redirect URI in the Cloud Console (they are
 * matched by package name + SHA-1, or bundle ID), but Google still requires the
 * request to carry the AppAuth-form redirect derived from the client ID itself:
 * `com.googleusercontent.apps.<id-without-the-suffix>:/oauth2redirect`.
 *
 * The scheme half of that string also has to be declared in the app config, or
 * Android/iOS never hands the response back to the app.
 */

const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';
const APP_AUTH_SCHEME_PREFIX = 'com.googleusercontent.apps.';
const OAUTH_REDIRECT_PATH = '/oauth2redirect';

/** The custom scheme that must appear in `app.json` → `scheme`. */
export function googleInstalledScheme(clientId: string | undefined | null): string | null {
  const trimmed = clientId?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(APP_AUTH_SCHEME_PREFIX)) return trimmed;
  if (trimmed.endsWith(GOOGLE_CLIENT_ID_SUFFIX)) {
    return `${APP_AUTH_SCHEME_PREFIX}${trimmed.slice(0, -GOOGLE_CLIENT_ID_SUFFIX.length)}`;
  }
  return null;
}

/** The `redirect_uri` to send for an installed-app client, or null when the ID is unusable. */
export function googleInstalledRedirectUri(clientId: string | undefined | null): string | null {
  const scheme = googleInstalledScheme(clientId);
  return scheme ? `${scheme}:${OAUTH_REDIRECT_PATH}` : null;
}
