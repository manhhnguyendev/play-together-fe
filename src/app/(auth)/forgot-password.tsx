import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { FieldAction } from '@/components/auth/FieldAction';
import { Button, TextField, type TextFieldHandle, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useOtpCooldown } from '@/hooks/useOtpCooldown';
import { passwordResetDraft } from '@/features/auth/passwordResetDraft';
import {
  isSixDigitOtp,
  messages,
  OTP_LENGTH,
  validateEmail,
} from '@/lib/validators';
import { colors, fonts, hitSlop, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useAppRouter();
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

  const otpRef = useRef<TextFieldHandle>(null);
  const cooldown = useOtpCooldown();

  const requestOtp = async () => {
    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);
    if (emailValidation || cooldown.waiting || sendingOtp) return;

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
      cooldown.start();
      otpRef.current?.focus();
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

  const verify = async (code: string) => {
    if (!otpSent) {
      toast.show('Vui lòng lấy mã OTP trước', 'error');
      return;
    }
    if (!isSixDigitOtp(code)) {
      setOtpError(messages.otpNull);
      return;
    }

    setVerifying(true);
    try {
      const result = await authService.verifyOtp(
        email.trim(),
        'PASSWORD_RESET',
        code,
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

  const onOtpChange = (raw: string) => {
    const next = raw.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(next);
    setVerified(false);
    setResetToken(null);
    setOtpError(null);
    if (next.length === OTP_LENGTH && otpSent) void verify(next);
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
      <TextField
        variant="floating"
        label="Email"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => otpRef.current?.focus()}
        value={email}
        error={emailError}
        onChangeText={(value) => {
          setEmail(value);
          setOtpSent(false);
          setVerified(false);
          setResetToken(null);
          if (emailError) setEmailError(null);
        }}
        trailing={
          <FieldAction
            label={otpSent ? 'Gửi lại' : 'Gửi mã'}
            onPress={requestOtp}
            loading={sendingOtp}
            disabled={cooldown.waiting}
          />
        }
      />

      <View style={styles.otpBlock}>
        <TextField
          variant="floating"
          label="Mã OTP"
          leftIcon="keypad-outline"
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          returnKeyType="done"
          inputRef={otpRef}
          editable={otpSent}
          value={otp}
          error={otpError}
          onChangeText={onOtpChange}
          trailing={
            <FieldAction
              label={verified ? 'Đã xác thực' : 'Xác thực'}
              tone={verified ? 'success' : 'action'}
              onPress={() => verify(otp)}
              loading={verifying}
              disabled={!otpSent || verified || otp.length < OTP_LENGTH}
            />
          }
        />

        {otpSent ? (
          cooldown.waiting ? (
            <Text style={styles.cooldown}>
              Gửi lại mã sau {cooldown.remaining}s
            </Text>
          ) : (
            <Pressable
              hitSlop={hitSlop.sm}
              accessibilityRole="link"
              accessibilityLabel="Gửi lại mã OTP"
              onPress={requestOtp}
            >
              <Text style={styles.resendLink}>Chưa nhận được? Gửi lại mã</Text>
            </Pressable>
          )
        ) : null}
      </View>

      <Button
        label="TIẾP TỤC"
        size="lg"
        disabled={!verified || !resetToken}
        onPress={submit}
      />

      <Pressable
        hitSlop={hitSlop.sm}
        accessibilityRole="link"
        accessibilityLabel="Quay lại đăng nhập"
        onPress={() => router.replace('/(auth)/login')}
      >
        <Text style={styles.loginLink}>
          Bạn đã có tài khoản? Quay lại đăng nhập
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  otpBlock: { gap: spacing.xxs + 2 },
  cooldown: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    paddingVertical: 2,
  },
  resendLink: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.primaryAction,
    paddingVertical: 2,
  },
  loginLink: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryAction,
    marginTop: spacing.xs,
  },
});
