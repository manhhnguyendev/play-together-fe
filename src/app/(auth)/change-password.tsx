import { useRouter } from 'expo-router';
import { useState } from 'react';
import { authService } from '@/api/services/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, TextField, useToast } from '@/components/ui';
import { passwordResetDraft } from '@/features/auth/passwordResetDraft';
import {
  validateConfirmPassword,
  validateStrongPassword,
} from '@/lib/validators';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const draft = passwordResetDraft.get();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!draft) {
    return (
      <AuthShell
        title="Phiên đặt lại đã hết hạn"
        subtitle="Vui lòng xác thực email lại để đổi mật khẩu."
        showBack
      >
        <Button
          label="QUAY LẠI QUÊN MẬT KHẨU"
          size="lg"
          onPress={() => router.replace('/(auth)/forgot-password')}
        />
      </AuthShell>
    );
  }

  const submit = async () => {
    const passwordValidation = validateStrongPassword(password);
    const confirmValidation = validateConfirmPassword(password, confirmPassword);
    setPasswordError(passwordValidation);
    setConfirmError(confirmValidation);
    if (passwordValidation || confirmValidation) return;

    setSubmitting(true);
    try {
      await authService.resetPassword({
        email: draft.email,
        newPassword: password,
        confirmNewPassword: confirmPassword,
        token: draft.token,
      });
      passwordResetDraft.clear();
      toast.show('Đổi mật khẩu thành công', 'success');
      router.replace('/(auth)/login');
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Đổi mật khẩu thất bại',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Mật khẩu mới"
      subtitle={draft.email}
      showBack
    >
      <TextField
        label="Mật khẩu mới"
        leftIcon="lock-closed-outline"
        placeholder="Nhập vào mật khẩu mới"
        secure
        autoCapitalize="none"
        value={password}
        error={passwordError}
        hint="8-30 kí tự, gồm chữ hoa, chữ thường, số và kí tự đặc biệt"
        onChangeText={(value) => {
          setPassword(value);
          if (passwordError) setPasswordError(null);
        }}
      />
      <TextField
        label="Nhập lại mật khẩu mới"
        leftIcon="lock-closed-outline"
        placeholder="Nhập lại mật khẩu mới"
        secure
        autoCapitalize="none"
        value={confirmPassword}
        error={confirmError}
        onChangeText={(value) => {
          setConfirmPassword(value);
          if (confirmError) setConfirmError(null);
        }}
      />
      <Button
        label="THAY ĐỔI MẬT KHẨU"
        size="lg"
        loading={submitting}
        onPress={submit}
      />
    </AuthShell>
  );
}
