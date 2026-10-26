import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';

interface StatTileProps {
  label: string;
  value: string;
  tone?: 'primary' | 'success' | 'warning' | 'neutral';
}

const tones = {
  primary: { background: colors.primaryFaint, color: colors.primaryDark },
  success: { background: '#EAF8F1', color: colors.success },
  warning: { background: '#FFF6E5', color: colors.warning },
  neutral: { background: colors.background, color: colors.text },
};

export function StatTile({ label, value, tone = 'primary' }: StatTileProps) {
  const palette = tones[tone];
  return (
    <View style={[styles.tile, { backgroundColor: palette.background }]}>
      <Text style={[styles.value, { color: palette.color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
