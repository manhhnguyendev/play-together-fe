import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, TextField, useToast } from '@/components/ui';
import { registerDraft } from '@/features/auth/registerDraft';
import {
  isSixDigitOtp,
  messages,
  OTP_LENGTH,
  validateConfirmPassword,
  validateEmail,
  validateStrongPassword,
} from '@/lib/validators';
import { colors, fonts, spacing } from '@/theme';

interface RegisterErrors {
  email?: string | null;
  otp?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
}

export default function RegisterScreen() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof RegisterErrors) =>
    setErrors((prev) => ({ ...prev, [field]: null }));

  const requestOtp = async () => {
    const emailValidation = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: emailValidation }));
    if (emailValidation) return;

    setSendingOtp(true);
    try {
      const result = await authService.requestOtp(email.trim(), 'REGISTER');
      setOtpSent(true);
      setVerified(false);
      setOtp('');
      if (result.devCode) {
        toast.show(`Môi trường DEV - mã OTP: ${result.devCode}`, 'info');
      } else {
        toast.show('Đã gửi mã OTP tới email của bạn', 'success');
      }
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Không gửi được mã OTP',
        'error',
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpSent) {
      toast.show('Vui lòng lấy mã OTP trước', 'error');
      return;
    }
    if (!isSixDigitOtp(otp)) {
      setErrors((prev) => ({ ...prev, otp: messages.otpNull }));
      return;
    }

    setVerifying(true);
    try {
      await authService.verifyOtp(email.trim(), 'REGISTER', otp);
      setErrors((prev) => ({ ...prev, otp: null }));
      setVerified(true);
      toast.show('Xác thực thành công', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mã OTP không chính xác';
      setErrors((prev) => ({ ...prev, otp: message }));
      toast.show(message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const submit = () => {
    const emailValidation = validateEmail(email);
    const otpValidation = isSixDigitOtp(otp) ? null : messages.otpNull;
    const passwordValidation = validateStrongPassword(password);
    const confirmValidation = validateConfirmPassword(password, confirmPassword);

    setErrors({
      email: emailValidation,
      otp: otpValidation,
      password: passwordValidation,
      confirmPassword: confirmValidation,
    });

    if (!verified) {
      toast.show('Vui lòng xác thực email', 'error');
      return;
    }
    if (
      emailValidation ||
      otpValidation ||
      passwordValidation ||
      confirmValidation
    ) {
      return;
    }

    setSubmitting(true);
    registerDraft.set({
      email: email.trim(),
      password,
      confirmPassword,
      confirmEmail: true,
    });
    router.push('/(auth)/complete-register');
    setSubmitting(false);
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Xác thực email để bắt đầu kết nối với cộng đồng"
      showBack
    >
      <View style={styles.row}>
        <TextField
          containerStyle={styles.rowField}
          label="Email"
          leftIcon="mail-outline"
          placeholder="Nhập vào email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          error={errors.email}
          onChangeText={(value) => {
            setEmail(value);
            setOtpSent(false);
            setVerified(false);
            if (errors.email) clearError('email');
          }}
        />
        <Button
          label="Lấy mã OTP"
          size="sm"
          variant="secondary"
          fullWidth={false}
          loading={sendingOtp}
          onPress={requestOtp}
          style={styles.otpButton}
        />
      </View>

      <View style={styles.row}>
        <TextField
          containerStyle={styles.rowField}
          label="Mã OTP"
          leftIcon="keypad-outline"
          placeholder="Nhập mã OTP"
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          value={otp}
          error={errors.otp}
          onChangeText={(value) => {
            setOtp(value.replace(/[^0-9]/g, ''));
            setVerified(false);
            if (errors.otp) clearError('otp');
          }}
        />
        <Button
          label={verified ? 'Đã xác thực' : 'Xác thực'}
          size="sm"
          variant={verified ? 'primary' : 'secondary'}
          fullWidth={false}
          disabled={verified}
          loading={verifying}
          onPress={verifyOtp}
          style={styles.otpButton}
        />
      </View>

      <TextField
        label="Mật khẩu"
        leftIcon="lock-closed-outline"
        placeholder="Nhập vào mật khẩu"
        secure
        autoCapitalize="none"
        value={password}
        error={errors.password}
        hint="8-30 kí tự, gồm chữ hoa, chữ thường, số và kí tự đặc biệt"
        onChangeText={(value) => {
          setPassword(value);
          if (errors.password) clearError('password');
        }}
      />

      <TextField
        label="Nhập lại mật khẩu"
        leftIcon="lock-closed-outline"
        placeholder="Nhập lại mật khẩu"
        secure
        autoCapitalize="none"
        value={confirmPassword}
        error={errors.confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value);
          if (errors.confirmPassword) clearError('confirmPassword');
        }}
      />

      <Button
        label="TIẾP TỤC"
        size="lg"
        loading={submitting}
        onPress={submit}
      />

      <View style={styles.backRow}>
        <Text style={styles.backText}>Bạn đã có tài khoản? </Text>
        <Text
          style={styles.backLink}
          onPress={() => router.replace('/(auth)/login')}
        >
          Quay lại đăng nhập
        </Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  rowField: { flex: 1 },
  otpButton: { height: 50, minWidth: 96 },
  backRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  backText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  backLink: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
