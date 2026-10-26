import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, TextField, useToast } from '@/components/ui';
import { passwordResetDraft } from '@/features/auth/passwordResetDraft';
import { deliverOtp, generateOtp, OTP_LENGTH } from '@/lib/otp';
import { isSixDigitOtp, messages, validateEmail } from '@/lib/validators';
import { colors, fonts, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const expectedOtp = useRef('');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestOtp = async () => {
    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);
    if (emailValidation) return;

    setSendingOtp(true);
    try {
      const exists = await authService.checkEmail(email.trim());
      if (String(exists) !== 'true') {
        toast.show('Tên đăng nhập không tồn tại', 'error');
        return;
      }

      const code = generateOtp();
      expectedOtp.current = code;
      setOtpSent(true);
      setVerified(false);
      setOtp('');

      const delivered = await deliverOtp(email.trim(), code);
      if (delivered) {
        toast.show('Lấy mã OTP thành công', 'success');
      } else {
        toast.show(`Môi trường DEV - mã OTP: ${code}`, 'info');
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

  const verifyOtp = () => {
    if (!otpSent) {
      toast.show('Vui lòng lấy mã OTP trước', 'error');
      return;
    }
    if (!isSixDigitOtp(otp)) {
      setOtpError(messages.otpNull);
      return;
    }
    if (otp !== expectedOtp.current) {
      setOtpError('Mã OTP không chính xác');
      toast.show('Mã OTP không chính xác', 'error');
      return;
    }
    setOtpError(null);
    setVerified(true);
    toast.show('Xác thực thành công', 'success');
  };

  const submit = async () => {
    const emailValidation = validateEmail(email);
    const otpValidation = isSixDigitOtp(otp) ? null : messages.otpNull;
    setEmailError(emailValidation);
    setOtpError(otpValidation);

    if (!verified) {
      toast.show('Vui lòng xác thực email', 'error');
      return;
    }
    if (emailValidation || otpValidation) return;

    setSubmitting(true);
    try {
      const token = await authService.resetPasswordToken({ email: email.trim() });
      passwordResetDraft.set({ email: email.trim(), token: token.message });
      router.push('/(auth)/change-password');
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
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
            setVerified(false);
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
            if (otpError) setOtpError(null);
          }}
        />
        <Button
          label={verified ? 'Đã xác thực' : 'Xác thực'}
          size="sm"
          variant={verified ? 'primary' : 'secondary'}
          fullWidth={false}
          disabled={verified}
          onPress={verifyOtp}
          style={styles.otpButton}
        />
      </View>

      <Button
        label="TIẾP TỤC"
        size="lg"
        loading={submitting}
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
