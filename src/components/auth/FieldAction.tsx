import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, hitSlop, spacing } from '@/theme';

interface FieldActionProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'action' | 'success';
}

/** Compact text action that lives inside a floating field instead of next to it. */
export function FieldAction({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = 'action',
}: FieldActionProps) {
  const busy = disabled || loading;
  const color = tone === 'success' ? colors.success : colors.primaryAction;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy: loading }}
      disabled={busy}
      hitSlop={hitSlop.sm}
      onPress={onPress}
      style={({ pressed }) => [
        styles.hit,
        pressed && styles.pressed,
        busy && styles.dim,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  pressed: { opacity: 0.55 },
  dim: { opacity: 0.45 },
});
