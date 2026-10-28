import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, TextField, useToast } from '@/components/ui';
import { passwordResetDraft } from '@/features/auth/passwordResetDraft';
import {
  isSixDigitOtp,
  messages,
  OTP_LENGTH,
  validateEmail,
} from '@/lib/validators';
import { colors, fonts, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const requestOtp = async () => {
    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);
    if (emailValidation) return;

    setSendingOtp(true);
    try {
      const result = await authService.requestOtp(
        email.trim(),
        'PASSWORD_RESET',
      );
      setOtpSent(true);
      setVerified(false);
      setResetToken(null);
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
      setOtpError(messages.otpNull);
      return;
    }

    setVerifying(true);
    try {
      const result = await authService.verifyOtp(
        email.trim(),
        'PASSWORD_RESET',
        otp,
      );
      setOtpError(null);
      setResetToken(result.resetToken ?? null);
      setVerified(true);
      toast.show('Xác thực thành công', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mã OTP không chính xác';
      setOtpError(message);
      toast.show(message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const submit = () => {
    const emailValidation = validateEmail(email);
    const otpValidation = isSixDigitOtp(otp) ? null : messages.otpNull;
    setEmailError(emailValidation);
    setOtpError(otpValidation);

    if (!verified || !resetToken) {
      toast.show('Vui lòng xác thực email', 'error');
      return;
    }
    if (emailValidation || otpValidation) return;

    passwordResetDraft.set({ email: email.trim(), token: resetToken });
    router.push('/(auth)/change-password');
  };

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Xác thực email để tạo mật khẩu mới"
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
          error={emailError}
          onChangeText={(value) => {
            setEmail(value);
            setOtpSent(false);
            setVerified(false);
            setResetToken(null);
            if (emailError) setEmailError(null);
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
          placeholder="Nhập vào mã OTP"
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          value={otp}
          error={otpError}
          onChangeText={(value) => {
            setOtp(value.replace(/[^0-9]/g, ''));
            setVerified(false);
            setResetToken(null);
            if (otpError) setOtpError(null);
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

      <Button
        label="TIẾP TỤC"
        size="lg"
        onPress={submit}
      />

      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.loginLink}>
          Bạn đã có tài khoản? Quay lại đăng nhập
        </Text>
      </Pressable>
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
  loginLink: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
    marginTop: spacing.xs,
  },
});
