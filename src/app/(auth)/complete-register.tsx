import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '@/api/services/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import {
  Button,
  DatePickerField,
  FLOAT_BOX_HEIGHT,
  SelectField,
  TextField,
  useToast,
} from '@/components/ui';
import { registerDraft } from '@/features/auth/registerDraft';
import { useAppRouter } from '@/hooks/useAppRouter';
import { PROVINCE_OPTIONS } from '@/lib/provinces';
import { messages } from '@/lib/validators';
import { colors, fonts, hitSlop, radius, spacing } from '@/theme';

export default function CompleteRegisterScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const draft = registerDraft.get();

  const [name, setName] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [gender, setGender] = useState(true);
  const [errors, setErrors] = useState<{
    name?: string | null;
    city?: string | null;
    birthday?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!draft) {
    return (
      <AuthShell
        title="Phiên đăng ký đã hết hạn"
        subtitle="Vui lòng xác thực email và tạo lại tài khoản."
        showBack
      >
        <Button
          label="QUAY LẠI ĐĂNG KÝ"
          size="lg"
          onPress={() => router.replace('/(auth)/register')}
        />
      </AuthShell>
    );
  }

  const submit = async () => {
    const nameValidation = name.trim() ? null : messages.nameNull;
    const cityValidation = city ? null : messages.cityNull;
    const birthdayValidation = birthday ? null : messages.birthdayNull;
    setErrors({
      name: nameValidation,
      city: cityValidation,
      birthday: birthdayValidation,
    });
    if (nameValidation || cityValidation || birthdayValidation) return;

    setSubmitting(true);
    try {
      await authService.register({
        email: draft.email,
        password: draft.password,
        confirmPassword: draft.confirmPassword,
        name: name.trim(),
        city: city!,
        dateOfBirth: birthday!.toISOString(),
        gender,
        confirmEmail: draft.confirmEmail,
      });
      registerDraft.clear();
      toast.show('Đăng kí tài khoản thành công', 'success');
      router.replace('/(auth)/login');
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Kiểm tra lại thông tin',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Hoàn tất thông tin"
      subtitle="Giúp mọi người hiểu thêm về bạn"
      showBack
    >
      <TextField
        variant="floating"
        label="Tên"
        leftIcon="person-outline"
        maxLength={30}
        returnKeyType="done"
        onSubmitEditing={submit}
        value={name}
        error={errors.name}
        onChangeText={(value) => {
          setName(value);
          if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
        }}
      />

      <SelectField
        variant="floating"
        label="Thành phố"
        placeholder="Chọn thành phố"
        value={city}
        options={PROVINCE_OPTIONS}
        error={errors.city}
        onChange={(value) => {
          setCity(value);
          if (errors.city) setErrors((prev) => ({ ...prev, city: null }));
        }}
      />

      <DatePickerField
        variant="floating"
        label="Ngày sinh"
        placeholder="Chọn ngày"
        value={birthday}
        error={errors.birthday}
        onChange={(date) => {
          setBirthday(date);
          if (errors.birthday) setErrors((prev) => ({ ...prev, birthday: null }));
        }}
      />

      <View>
        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderRow}>
          {[
            { label: 'Nam', value: true },
            { label: 'Nữ', value: false },
          ].map((option) => {
            const active = gender === option.value;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: active }}
                onPress={() => setGender(option.value)}
                style={[styles.genderOption, active && styles.genderOptionActive]}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
                <Text
                  style={[styles.genderLabel, active && styles.genderLabelActive]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label="HOÀN TẤT"
        size="lg"
        loading={submitting}
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
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: spacing.xxs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderOption: {
    flex: 1,
    // Same height as the floating fields above it, so the block reads as one rhythm.
    height: FLOAT_BOX_HEIGHT,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
  },
  genderOptionActive: {
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primaryAction },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primaryAction,
  },
  genderLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  genderLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryInk,
  },
  loginLink: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryAction,
    marginTop: spacing.xs,
  },
});
