import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/AuthShell';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { Button, TextField, useToast } from '@/components/ui';
import { useContinueAfterSignIn } from '@/features/auth/useContinueAfterSignIn';
import { messages, validateEmail } from '@/lib/validators';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  const signInWithCredentials = useAuthStore(
    (state) => state.signInWithCredentials,
  );
  const continueAfterSignIn = useContinueAfterSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const emailValidation = validateEmail(email);
    const passwordValidation = password ? null : messages.passNull;
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    if (emailValidation || passwordValidation) return;

    setLoading(true);
    try {
      const user = await signInWithCredentials({
        email: email.trim(),
        password,
      });
      toast.show('ĐĂNG NHẬP THÀNH CÔNG', 'success');
      await continueAfterSignIn(user.id);
    } catch (error) {
      toast.show(
        error instanceof ApiError && error.status === 401
          ? 'Email hoặc mật khẩu không chính xác'
          : error instanceof Error
            ? error.message
            : 'Mật khẩu không chính xác',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay lại Play Together"
      footer={
        <View style={styles.footer}>
          <View style={styles.links}>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.link}>Tạo tài khoản?</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.link}>Quên mật khẩu?</Text>
            </Pressable>
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Hoặc</Text>
            <View style={styles.line} />
          </View>

          <GoogleLoginButton />
        </View>
      }
    >
      <TextField
        label="Email"
        leftIcon="mail-outline"
        placeholder="Nhập vào email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        error={emailError}
        onChangeText={(value) => {
          setEmail(value);
          if (emailError) setEmailError(null);
        }}
      />
      <TextField
        label="Mật khẩu"
        leftIcon="lock-closed-outline"
        placeholder="Nhập vào mật khẩu"
        secure
        autoCapitalize="none"
        value={password}
        error={passwordError}
        onChangeText={(value) => {
          setPassword(value);
          if (passwordError) setPasswordError(null);
        }}
      />
      <Button
        label="ĐĂNG NHẬP"
        size="lg"
        loading={loading}
        onPress={submit}
        style={styles.submit}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: spacing.xs },
  footer: { gap: spacing.md },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});
