import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { authService } from '@/api/services/auth';
import { PasswordRules } from '@/components/auth/PasswordRules';
import {
  AppBar,
  Button,
  TextField,
  type TextFieldHandle,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuthStore } from '@/store/auth';
import {
  messages,
  PASSWORD_REGEX,
  validateConfirmPassword,
} from '@/lib/validators';
import { colors, radius, spacing } from '@/theme';

export default function PersonalChangePasswordScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const applyAuthResponse = useAuthStore((state) => state.applyAuthResponse);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    current?: string | null;
    next?: string | null;
    confirm?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const newPwdRef = useRef<TextFieldHandle>(null);
  const confirmPwdRef = useRef<TextFieldHandle>(null);

  const submit = async () => {
    if (submitting || !user) return;

    const currentError = !currentPassword
      ? messages.passNull
      : !PASSWORD_REGEX.test(currentPassword)
        ? messages.invalidPass
        : null;
    const nextError = !newPassword
      ? messages.passNull
      : !PASSWORD_REGEX.test(newPassword)
        ? messages.invalidPass
        : null;
    const confirmError = validateConfirmPassword(newPassword, confirmPassword);

    setErrors({ current: currentError, next: nextError, confirm: confirmError });
    if (currentError || nextError || confirmError) return;

    setSubmitting(true);
    try {
      const auth = await authService.changePassword({
        email: user.email,
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      // v2 rotates the session on password change, so the new tokens must be stored.
      await applyAuthResponse(auth);
      toast.show('Thay đổi mật khẩu thành công', 'success');
      router.dismissTo('/(tabs)/personal');
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Thay đổi mật khẩu thất bại',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Thay đổi mật khẩu" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <TextField
              variant="floating"
              label="Mật khẩu cũ"
              leftIcon="lock-closed-outline"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secure
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => newPwdRef.current?.focus()}
              error={errors.current}
            />
            <View style={styles.group}>
              <TextField
                variant="floating"
                label="Mật khẩu mới"
                leftIcon="lock-closed-outline"
                value={newPassword}
                onChangeText={setNewPassword}
                secure
                autoCapitalize="none"
                textContentType="newPassword"
                autoComplete="new-password"
                inputRef={newPwdRef}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => confirmPwdRef.current?.focus()}
                error={errors.next}
              />
              <PasswordRules value={newPassword} />
            </View>
            <TextField
              variant="floating"
              label="Nhập lại mật khẩu"
              leftIcon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="new-password"
              inputRef={confirmPwdRef}
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              error={errors.confirm}
            />
          </View>
        </ScrollView>
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
        >
          <View style={styles.footerInner}>
            <Button
              label="Cập nhật"
              size="lg"
              loading={submitting}
              onPress={() => void submit()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.md, paddingBottom: spacing.xl },
  form: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  group: { gap: spacing.xs },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
