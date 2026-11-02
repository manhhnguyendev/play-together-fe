import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, control, fonts, radius, spacing } from '@/theme';
import { useResponsive } from '@/hooks/useResponsive';

const LOGO = require('../../../assets/images/logo_v2_mark.png');

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Set to false when the header sits directly under the home bar. */
  showLogo?: boolean;
}

export function ScreenHeader({ title, subtitle, right, showLogo = true }: ScreenHeaderProps) {
  const { gutter, contentStyle, type: scaled } = useResponsive();

  return (
    <View
      style={[styles.container, { paddingHorizontal: gutter }, contentStyle]}
      accessibilityRole="header"
    >
      {showLogo ? (
        <View style={styles.logoWrap}>
          <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel="Play Together" />
        </View>
      ) : null}

      <View style={styles.titleBlock}>
        <Text style={[styles.title, scaled.title3]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, scaled.caption]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? (showLogo ? <View style={styles.logoSpacer} /> : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: control.appBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logoWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.plaque,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  logoSpacer: { width: 34, height: 34 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: 1,
  },
});

