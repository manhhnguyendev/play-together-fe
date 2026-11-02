import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthStepBar } from '@/components/auth/AuthStepBar';
import { FieldAction } from '@/components/auth/FieldAction';
import { PasswordRules } from '@/components/auth/PasswordRules';
import { Button, TextField, type TextFieldHandle, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useOtpCooldown } from '@/hooks/useOtpCooldown';
import { registerDraft } from '@/features/auth/registerDraft';
import {
  isSixDigitOtp,
  messages,
  OTP_LENGTH,
  validateConfirmPassword,
  validateEmail,
  validateStrongPassword,
} from '@/lib/validators';
import { colors, fonts, hitSlop, spacing } from '@/theme';

const STEPS = ['Xác thực', 'Đặt mật khẩu'] as const;

interface RegisterErrors {
  email?: string | null;
  otp?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
}

export default function RegisterScreen() {
  const router = useAppRouter();
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

  const otpRef = useRef<TextFieldHandle>(null);
  const cooldown = useOtpCooldown();

  const clearError = (field: keyof RegisterErrors) =>
    setErrors((prev) => ({ ...prev, [field]: null }));

  const requestOtp = async () => {
    const emailValidation = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: emailValidation }));
    if (emailValidation || cooldown.waiting || sendingOtp) return;

    setSendingOtp(true);
    try {
      const result = await authService.requestOtp(email.trim(), 'REGISTER');
      setOtpSent(true);
      setVerified(false);
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
      setErrors((prev) => ({ ...prev, otp: messages.otpNull }));
      return;
    }

    setVerifying(true);
    try {
      await authService.verifyOtp(email.trim(), 'REGISTER', code);
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

  // Six digits is the whole code, so the last keystroke is the signal to check it.
  const onOtpChange = (raw: string) => {
    const next = raw.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(next);
    setVerified(false);
    clearError('otp');
    if (next.length === OTP_LENGTH && otpSent) void verify(next);
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
      <AuthStepBar steps={STEPS} current={verified ? 1 : 0} />

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
        error={errors.email}
        onChangeText={(value) => {
          setEmail(value);
          setOtpSent(false);
          setVerified(false);
          if (errors.email) clearError('email');
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
          error={errors.otp}
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
              <Text style={styles.link}>Chưa nhận được? Gửi lại mã</Text>
            </Pressable>
          )
        ) : null}
      </View>

      {verified ? (
        <>
          <View style={styles.passwordGroup}>
            <TextField
              variant="floating"
              label="Mật khẩu"
              leftIcon="lock-closed-outline"
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              value={password}
              error={errors.password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) clearError('password');
              }}
            />
            <PasswordRules value={password} />
          </View>

          <TextField
            variant="floating"
            label="Nhập lại mật khẩu"
            leftIcon="lock-closed-outline"
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={submit}
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
        </>
      ) : null}

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
  otpBlock: { gap: spacing.xxs + 2 },
  cooldown: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    paddingVertical: 2,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.primaryAction,
    paddingVertical: 2,
  },
  passwordGroup: { gap: spacing.xs },
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
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryAction,
  },
});
