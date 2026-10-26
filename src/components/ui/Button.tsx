import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const backgrounds: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.primarySoft,
  outline: 'transparent',
  ghost: 'transparent',
  danger: colors.danger,
};

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.primaryDark,
  outline: colors.primaryDark,
  ghost: colors.textMuted,
  danger: colors.white,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: backgrounds[variant],
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
          borderRadius: size === 'lg' ? radius.md : radius.sm,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColors[variant]} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.label,
              { color: labelColors[variant] },
              size === 'sm' && styles.labelSmall,
              size === 'lg' && styles.labelLarge,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  labelSmall: { fontSize: 13 },
  labelLarge: { fontSize: 17 },
});

const sizeStyles = StyleSheet.create({
  sm: { height: 38 },
  md: { height: 48 },
  lg: { height: 54 },
});
