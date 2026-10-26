import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/theme';

interface InfoRowProps {
  label: string;
  value?: string | number | null;
  children?: ReactNode;
  emphasis?: boolean;
}

export function InfoRow({ label, value, children, emphasis }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children ?? (
        <Text style={[styles.value, emphasis && styles.emphasis]} numberOfLines={2}>
          {value ?? '—'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 7,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    flexShrink: 0,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  emphasis: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
});
