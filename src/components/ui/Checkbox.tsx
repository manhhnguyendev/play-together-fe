import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, touchTarget } from '@/theme';

interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  label?: string;
}

export function Checkbox({ checked, onPress, label }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.hitArea}>
        <View style={[styles.box, checked && styles.checked]}>
          {checked ? (
            <Ionicons name="checkmark" size={15} color={colors.textOnPrimary} />
          ) : null}
        </View>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touchTarget,
    paddingVertical: spacing.xxs,
  },
  hitArea: { width: 28, alignItems: 'center', justifyContent: 'center' },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checked: {
    backgroundColor: colors.primaryFill,
    borderColor: colors.primaryFill,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    flexShrink: 1,
  },
});
