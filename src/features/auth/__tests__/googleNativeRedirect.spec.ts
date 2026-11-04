import type { ConfigContext } from 'expo/config';

import expoConfig from '../../../../app.config';
import { googleInstalledRedirectUri, googleInstalledScheme } from '../googleNativeRedirect';

const STATIC_CONFIG = { name: 'Play Together', slug: 'play-together', scheme: 'playtogether' };

const contextFor = (clientId?: string): ConfigContext => {
  if (clientId) process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = clientId;
  else delete process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  return {
    projectRoot: '/project',
    staticConfigPath: '/project/app.json',
    packageJsonPath: '/project/package.json',
    config: STATIC_CONFIG,
  };
};

/** `app.config.ts` cannot import this module, so the rule lives twice — this is what keeps them honest. */
describe('the scheme app.config.ts declares matches the redirect the app sends', () => {
  const asSchemes = (scheme: string | readonly string[] | undefined) => (Array.isArray(scheme) ? scheme : [scheme ?? '']);

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  });

  it.each([
    '1234567890-abcdef123456.apps.googleusercontent.com',
    'com.googleusercontent.apps.1234567890-abcdef123456',
  ])('registers the return scheme for %s', (clientId) => {
    const schemes = asSchemes(expoConfig(contextFor(clientId)).scheme);

    expect(schemes).toContain(googleInstalledScheme(clientId));
    expect(schemes).toContain('playtogether');
  });

  it('leaves the config alone when no installed-app client is configured', () => {
    expect(asSchemes(expoConfig(contextFor(undefined)).scheme)).toEqual(['playtogether']);
  });
});

describe('googleInstalledScheme', () => {
  it('turns a Google client ID into the AppAuth scheme', () => {
    expect(googleInstalledScheme('1234567890-abcdef123456.apps.googleusercontent.com')).toBe(
      'com.googleusercontent.apps.1234567890-abcdef123456',
    );
  });

  it('passes a value that is already a scheme through untouched', () => {
    expect(googleInstalledScheme('com.googleusercontent.apps.1234567890-abcdef')).toBe(
      'com.googleusercontent.apps.1234567890-abcdef',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(googleInstalledScheme('  123-abc.apps.googleusercontent.com  ')).toBe(
      'com.googleusercontent.apps.123-abc',
    );
  });

  it.each([[undefined], [null], [''], ['   '], ['not-a-google-client'], ['apps.googleusercontent.com']])(
    'refuses to invent a scheme for %p',
    (value) => {
      expect(googleInstalledScheme(value)).toBeNull();
    },
  );
});

describe('googleInstalledRedirectUri', () => {
  it('appends the oauth2redirect path Google expects for installed apps', () => {
    expect(googleInstalledRedirectUri('1234567890-abcdef123456.apps.googleusercontent.com')).toBe(
      'com.googleusercontent.apps.1234567890-abcdef123456:/oauth2redirect',
    );
  });

  it('is null whenever the scheme cannot be derived, so callers can fall back', () => {
    expect(googleInstalledRedirectUri('')).toBeNull();
    expect(googleInstalledRedirectUri(undefined)).toBeNull();
  });
});
