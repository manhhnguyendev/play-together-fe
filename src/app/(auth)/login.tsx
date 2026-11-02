import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/AuthShell';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { Button, TextField, type TextFieldHandle, useToast } from '@/components/ui';
import { useContinueAfterSignIn } from '@/features/auth/useContinueAfterSignIn';
import { useAppRouter } from '@/hooks/useAppRouter';
import { messages, validateEmail } from '@/lib/validators';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, hitSlop, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useAppRouter();
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
  const passwordRef = useRef<TextFieldHandle>(null);

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
            <Pressable
              hitSlop={hitSlop.sm}
              accessibilityRole="link"
              accessibilityLabel="Tạo tài khoản mới"
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.link}>Tạo tài khoản?</Text>
            </Pressable>
            <Pressable
              hitSlop={hitSlop.sm}
              accessibilityRole="link"
              accessibilityLabel="Quên mật khẩu"
              onPress={() => router.push('/(auth)/forgot-password')}
            >
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
        variant="floating"
        label="Email"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        error={emailError}
        onChangeText={(value) => {
          setEmail(value);
          if (emailError) setEmailError(null);
        }}
      />
      <TextField
        variant="floating"
        label="Mật khẩu"
        leftIcon="lock-closed-outline"
        secure
        autoCapitalize="none"
        inputRef={passwordRef}
        returnKeyType="done"
        onSubmitEditing={submit}
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
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryAction,
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
