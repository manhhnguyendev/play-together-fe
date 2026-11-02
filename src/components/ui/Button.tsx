import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, control, duration, easing, fonts, radius, shadow, spacing } from '@/theme';
import { usePressAnimation } from '@/hooks/usePressAnimation';

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
  primary: colors.primaryFill,
  secondary: colors.primarySoft,
  outline: 'transparent',
  ghost: 'transparent',
  danger: colors.dangerFill,
};

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.textOnPrimary,
  secondary: colors.primaryInk,
  outline: colors.primaryAction,
  ghost: colors.textSecondary,
  danger: colors.textOnPrimary,
};

const pressedBackgrounds: Partial<Record<ButtonVariant, string>> = {
  primary: colors.primaryFillPressed,
  secondary: colors.primaryBorder,
  danger: colors.dangerFillPressed,
};

const heights: Record<ButtonSize, number> = {
  sm: control.buttonSm,
  md: control.buttonMd,
  lg: control.buttonLg,
};

const labelType: Record<ButtonSize, number> = {
  sm: 14,
  md: 15,
  lg: 17,
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
  const press = usePressAnimation();
  const [fade] = useState(() => new Animated.Value(1));
  const isDisabled = disabled || loading;

  const dim = (toValue: number) =>
    Animated.timing(fade, {
      toValue,
      duration: duration.state,
      easing: easing.standard,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View
      style={[
        {
          opacity: isDisabled ? 0.45 : 1,
          width: fullWidth ? '100%' : undefined,
          transform: press.style.transform,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPress={onPress}
        onPressIn={isDisabled ? undefined : press.onPressIn}
        onPressOut={isDisabled ? undefined : () => { press.onPressOut(); dim(1); }}
        onHoverIn={isDisabled ? undefined : () => dim(0.9)}
        onHoverOut={isDisabled ? undefined : () => dim(1)}
        style={({ pressed }) => [
          styles.base,
          {
            height: heights[size],
            backgroundColor:
              pressed && pressedBackgrounds[variant]
                ? pressedBackgrounds[variant]
                : backgrounds[variant],
            borderColor: variant === 'outline' ? colors.primaryMuted : 'transparent',
            borderWidth: variant === 'outline' ? 1.5 : 0,
            ...(variant === 'primary' || variant === 'danger' ? shadow.raised : null),
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={labelColors[variant]} size="small" />
        ) : (
          <Animated.View style={[styles.content, { opacity: fade }]}>
            {icon}
            <Text
              style={[
                styles.label,
                { color: labelColors[variant], fontSize: labelType[size] },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.semibold,
    letterSpacing: 0.2,
  },
});
