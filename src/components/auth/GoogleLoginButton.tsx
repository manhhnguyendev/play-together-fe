import { FontAwesome } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { useToast } from '@/components/ui/Toast';
import { useContinueAfterSignIn } from '@/features/auth/useContinueAfterSignIn';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const isConfigured = Boolean(WEB_CLIENT_ID || IOS_CLIENT_ID || ANDROID_CLIENT_ID);

export function GoogleLoginButton() {
  const toast = useToast();

  if (!isConfigured) {
    return (
      <Pressable
        onPress={() =>
          toast.show(
            'Chưa cấu hình Google Client ID. Thêm EXPO_PUBLIC_GOOGLE_*_CLIENT_ID vào .env.',
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
    clientId: WEB_CLIENT_ID ?? IOS_CLIENT_ID ?? ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'error') {
      toast.show('Đăng nhập Google thất bại', 'error');
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
      <FontAwesome name="google" size={18} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: '#DB4432',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.7 },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.white,
  },
});
