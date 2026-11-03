import { FontAwesome } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { useToast } from '@/components/ui/Toast';
import { useContinueAfterSignIn } from '@/features/auth/useContinueAfterSignIn';
import { googleFailureMessage } from '@/features/auth/googleFailureMessage';
import { useAuthStore } from '@/store/auth';
import { colors, control, fonts, radius, shadow, spacing } from '@/theme';

/**
 * The "Web application" OAuth client from the Google Cloud project.
 *
 * The token Google hands back is stamped with the client ID that requested it, and the API
 * only trusts tokens stamped with its own `GOOGLE_CLIENT_ID` (plus the optional
 * `GOOGLE_ANDROID_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID`), so the client the app asks for has to
 * be one the API already trusts.
 *
 * In the browser that is this Web client, and `useIdTokenAuthRequest` requests an `id_token`
 * directly. On a device build the same hook switches to the authorization-code flow with a
 * `<package>:/oauthredirect` redirect, which a Web client cannot complete without a client
 * secret — so Google sign-in on a real build needs a native Google library instead of this
 * hook. See `docs/google-signin.md`.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/** Google brand blue, used for the mark on a light button. */
const GOOGLE_BLUE = '#4285F4';

const isConfigured = Boolean(WEB_CLIENT_ID);

export function GoogleLoginButton() {
  const toast = useToast();

  if (!isConfigured) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đăng nhập bằng Google"
        onPress={() =>
          toast.show(
            'Chưa cấu hình Google. Thêm EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID vào .env của app và GOOGLE_CLIENT_ID vào .env của API.',
            'error',
          )
        }
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
    // No iosClientId/androidClientId: see WEB_CLIENT_ID. `clientId` is what the
    // hook falls back to on the platforms where its own key is missing.
    clientId: WEB_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
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
