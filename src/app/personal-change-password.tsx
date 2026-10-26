import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/api/services/auth';
import { AppBar, Button, TextField, useToast } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import {
  messages,
  PASSWORD_REGEX,
  validateConfirmPassword,
} from '@/lib/validators';
import { colors, spacing } from '@/theme';

export default function PersonalChangePasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    current?: string | null;
    next?: string | null;
    confirm?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);

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
      await authService.changePassword({
        email: user.email,
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar title="Thay đổi mật khẩu" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <TextField
              label="Mật khẩu cũ"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nhập vào mật khẩu cũ"
              secure
              error={errors.current}
            />
            <TextField
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nhập vào mật khẩu mới"
              secure
              error={errors.next}
            />
            <TextField
              label="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              secure
              error={errors.confirm}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label="Cập nhật"
            size="lg"
            loading={submitting}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: { padding: spacing.md },
  form: { gap: spacing.md },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
