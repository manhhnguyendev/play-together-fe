import { FontAwesome } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { useToast } from '@/components/ui/Toast';
import { useContinueAfterSignIn } from '@/features/auth/useContinueAfterSignIn';
import { googleFailureMessage } from '@/features/auth/googleFailureMessage';
import { googleInstalledRedirectUri } from '@/features/auth/googleNativeRedirect';
import { useAuthStore } from '@/store/auth';
import { colors, control, fonts, radius, shadow, spacing } from '@/theme';

/**
 * Which Google OAuth client to ask for, per platform.
 *
 * The token Google hands back is stamped with the client ID that requested it, and the API only
 * trusts tokens stamped with `GOOGLE_CLIENT_ID` plus the optional `GOOGLE_ANDROID_CLIENT_ID` /
 * `GOOGLE_IOS_CLIENT_ID` (`play-together-be/src/modules/auth/google-auth.service.ts`), so every
 * client the app asks for has to be one the API already accepts.
 *
 * `useIdTokenAuthRequest` already does the right thing per platform: on web it requests an
 * `id_token` directly, and on a device build it runs the authorization-code flow with PKCE and
 * exchanges the code itself — an installed-app client has no secret, and that exchange is exactly
 * what a *Web* client cannot do. So a real build needs one more client ID in the Cloud Console,
 * not a different library. See `docs/google-signin.md` §6.B.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/** Google brand blue, used for the mark on a light button. */
const GOOGLE_BLUE = '#4285F4';

const nativeClientId = Platform.select({ android: ANDROID_CLIENT_ID, ios: IOS_CLIENT_ID });

/**
 * The redirect Google sends the code back to. On a device this is derived from the installed-app
 * client ID and the same string has to be declared as a URL scheme, or the OS never returns to the
 * app — `app.config.ts` adds it to the scheme list at build time.
 */
const nativeRedirectUri = Platform.OS === 'web' ? null : googleInstalledRedirectUri(nativeClientId);

/**
 * Expo Go answers the `exp://` return scheme under its own package identity, so on a device the
 * installed-app redirect never reaches the app and Google's package + SHA-1 check never matches.
 * Showing a button that cannot complete in the environment used for every other screen would be a
 * dead interaction, so Expo Go keeps the hint instead.
 */
const runsInExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const isConfigured = !runsInExpoGo && (Platform.OS === 'web' ? Boolean(WEB_CLIENT_ID) : Boolean(nativeRedirectUri));

const missingConfigHint = runsInExpoGo
  ? 'Expo Go không mở được liên kết Google trả về. Đăng nhập Google chỉ chạy trên trình duyệt hoặc bản dựng dev/production.'
  : Platform.select({
      web: 'Chưa cấu hình Google. Thêm EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID vào .env của app và GOOGLE_CLIENT_ID vào .env của API.',
      android:
        'Bản dựng này chưa có client Google cho Android. Thêm EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID vào .env của app và GOOGLE_ANDROID_CLIENT_ID vào .env của API, rồi build lại app.',
      ios: 'Bản dựng này chưa có client Google cho iOS. Thêm EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID vào .env của app và GOOGLE_IOS_CLIENT_ID vào .env của API, rồi build lại app.',
      default: 'Chưa cấu hình Google cho nền tảng này.',
    });

export function GoogleLoginButton() {
  const toast = useToast();

  if (!isConfigured) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đăng nhập bằng Google"
        onPress={() => toast.show(missingConfigHint, 'error')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <GoogleMark />
        <Text style={styles.label}>ĐĂNG NHẬP BẰNG GOOGLE</Text>
      </Pressable>
    );
  }

  return <ConfiguredGoogleButton />;
}

function ConfiguredGoogleButton() {
  const toast = useToast();
  const signInWithAuth = useAuthStore((state) => state.signInWithAuth);
  const continueAfterSignIn = useContinueAfterSignIn();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // The Web client answers on the browser and is the fallback for platforms that have no
    // dedicated key. On a device build `androidClientId` / `iosClientId` win, and the hook
    // exchanges the code with that client — which is why the device needs its own client ID.
    clientId: WEB_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    // Undefined on web, where the hook uses the page origin instead.
    redirectUri: nativeRedirectUri ?? undefined,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'error') {
      toast.show(
        googleFailureMessage({
          code: response.error?.code,
          description: response.error?.description ?? response.params.error_description,
        }),
        'error',
      );
      return;
    }
    if (response.type !== 'success') return;

    const idToken = response.params.id_token;
    if (!idToken) {
      toast.show('Không nhận được mã xác thực Google', 'error');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const auth = await authService.loginGoogle({
          providerName: 'https://accounts.google.com',
          idToken,
        });
        const user = await signInWithAuth(auth);
        if (cancelled) return;
        toast.show('ĐĂNG NHẬP THÀNH CÔNG', 'success');
        await continueAfterSignIn(user.id);
      } catch (error) {
        if (!cancelled) {
          toast.show(
            error instanceof Error ? error.message : 'Tài khoản đã tồn tại',
            'error',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response, toast, signInWithAuth, continueAfterSignIn]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Đăng nhập bằng Google"
      accessibilityState={{ disabled: !request || loading, busy: loading }}
      disabled={!request || loading}
      onPress={() => {
        if (Platform.OS === 'android') {
          toast.show('Đang mở Google...', 'info');
        }
        void promptAsync();
      }}
      style={({ pressed }) => [
        styles.button,
        (pressed || !request || loading) && styles.pressed,
      ]}
    >
      <GoogleMark />
      <Text style={styles.label}>
        {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP BẰNG GOOGLE'}
      </Text>
    </Pressable>
  );
}

function GoogleMark() {
  return (
    <View style={styles.mark}>
      <FontAwesome name="google" size={17} color={GOOGLE_BLUE} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: control.buttonMd,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.75, backgroundColor: colors.surfaceMuted },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 0.2,
    color: colors.text,
  },
});
