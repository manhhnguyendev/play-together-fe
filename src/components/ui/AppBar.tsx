import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppRouter } from '@/hooks/useAppRouter';
import { colors, control, fonts, radius, spacing } from '@/theme';
import { usePressAnimation } from '@/hooks/usePressAnimation';

interface AppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  showBack?: boolean;
  transparent?: boolean;
}

export function AppBar({
  title,
  subtitle,
  onBack,
  right,
  showBack = true,
  transparent = false,
}: AppBarProps) {
  const router = useAppRouter();
  const back = usePressAnimation();

  return (
    <View
      accessibilityRole="header"
      style={[
        styles.container,
        { backgroundColor: transparent ? 'transparent' : colors.surface },
      ]}
    >
      {showBack ? (
        <Animated.View style={back.style}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack ?? (() => router.back())}
            onPressIn={back.onPressIn}
            onPressOut={back.onPressOut}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </View>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={styles.iconButton} />
      )}

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: control.appBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  pressed: { opacity: 0.6 },
  titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xxs },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    marginTop: 1,
  },
  right: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
