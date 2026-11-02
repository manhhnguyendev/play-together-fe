import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { passwordRules } from '@/lib/validators';
import { colors, fonts, radius, spacing } from '@/theme';

/** Live checklist for PASSWORD_REGEX, shown while the user types a new password. */
export function PasswordRules({ value }: { value: string }) {
  const rules = passwordRules(value);

  return (
    <View style={styles.row}>
      {rules.map((rule) => (
        <View
          key={rule.label}
          style={[styles.chip, rule.satisfied && styles.chipDone]}
        >
          {rule.satisfied ? (
            <Ionicons name="checkmark" size={12} color={colors.success} />
          ) : null}
          <Text style={[styles.label, rule.satisfied && styles.labelDone]}>
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipDone: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  labelDone: {
    color: colors.success,
    fontFamily: fonts.semibold,
  },
});
