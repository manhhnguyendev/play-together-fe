import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';

interface AuthStepBarProps {
  steps: readonly string[];
  /** Zero-based index of the step the user is on. */
  current: number;
}

export function AuthStepBar({ steps, current }: AuthStepBarProps) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <Fragment key={step}>
            {index > 0 ? (
              <View style={[styles.connector, done && styles.connectorDone]} />
            ) : null}
            <View style={styles.step}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              >
                {done ? (
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={colors.textOnPrimary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.dotText,
                      active && styles.dotTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                  done && styles.labelDone,
                ]}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
  },
  connector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  connectorDone: { backgroundColor: colors.primaryBorder },
  dot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primaryFaint,
    borderColor: colors.primaryBorder,
  },
  dotDone: {
    backgroundColor: colors.primaryFill,
    borderColor: colors.primaryFill,
  },
  dotText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    color: colors.textFaint,
  },
  dotTextActive: { color: colors.primaryAction },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textFaint,
  },
  labelActive: { color: colors.text, fontFamily: fonts.semibold },
  labelDone: { color: colors.textSecondary },
});
