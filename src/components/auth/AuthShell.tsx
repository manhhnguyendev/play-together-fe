import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, isDark, radius, shadow, spacing } from '@/theme';

const LOGO = require('../../../assets/images/logo_v2_text.png');

/** How far the form card rides up over the hero; the hero must keep this much dead space. */
const CARD_OVERLAP = 20;

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showBack = false,
}: AuthShellProps) {
  const router = useAppRouter();
  const insets = useSafeAreaInsets();
  const { height, isSmall, gutter, type } = useResponsive();

  // The hero sizes itself to its content, so nothing can be clipped by the card
  // that overlaps it. The tagline is the only part worth dropping on tight screens.
  const showTagline = !isSmall && height >= 720;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            <View
              style={[
                styles.brand,
                {
                  paddingTop: insets.top + (isSmall ? spacing.md : spacing.xl),
                  paddingBottom: CARD_OVERLAP + (isSmall ? spacing.sm : spacing.md),
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primarySoft, colors.primaryFaint]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.blobOne} />
              <View style={styles.blobTwo} />
              {showBack ? (
                <Pressable
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Quay lại"
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.back,
                    { top: insets.top + spacing.xs },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.primaryAction} />
                </Pressable>
              ) : null}
              <View style={[styles.logoPill, isSmall && styles.logoPillSmall]}>
                <Image
                  source={LOGO}
                  style={[styles.logo, isSmall && styles.logoSmall]}
                  contentFit="contain"
                  accessibilityLabel="Play Together"
                />
              </View>
              {showTagline ? (
                <Text style={styles.tagline}>Chơi game cùng nhau, kết nối đam mê</Text>
              ) : null}
            </View>

            <View style={[styles.card, { marginHorizontal: gutter }]}>
              <Text style={[styles.title, type.title2]}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
              <View style={styles.content}>{children}</View>
            </View>

            {footer ? (
              <View style={[styles.footer, { marginHorizontal: gutter }]}>{footer}</View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  // Pinned to the top so the hero is flush with the status bar; the auto margin
  // absorbs the slack underneath instead of splitting it above the header.
  column: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    marginBottom: 'auto',
  },
  brand: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.primaryFaint,
  },
  blobOne: {
    position: 'absolute',
    top: -48,
    right: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: isDark ? 'rgba(137, 128, 255, 0.3)' : 'rgba(137, 128, 255, 0.16)',
  },
  blobTwo: {
    position: 'absolute',
    bottom: -54,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: isDark ? 'rgba(244, 183, 64, 0.26)' : 'rgba(244, 183, 64, 0.18)',
  },
  back: {
    position: 'absolute',
    left: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  pressed: { opacity: 0.6 },
  logoPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.plaque,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  logoPillSmall: {
    paddingHorizontal: spacing.lg,
  },
  logo: {
    width: 108,
    height: 132,
  },
  logoSmall: {
    width: 84,
    height: 102,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    color: colors.primaryInk,
  },
  card: {
    marginTop: -CARD_OVERLAP,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  title: {
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  content: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
});
