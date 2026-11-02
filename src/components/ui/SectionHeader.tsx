import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, hitSlop, spacing, touchTarget } from '@/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function SectionHeader({ title, actionLabel, onAction, icon }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.primaryAction} />
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={hitSlop.sm}
          onPress={onAction}
          style={({ pressed }) => [styles.actionWrap, pressed && styles.pressed]}
        >
          <Text style={styles.action}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primaryAction} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: touchTarget - 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xxs,
  },
  pressed: { opacity: 0.6 },
  action: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.primaryAction,
  },
});
