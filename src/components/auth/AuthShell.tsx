import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const LOGO = require('../../../assets/images/play_together_logo_text.png');

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
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#EFECFF', '#F9F8FF', colors.white]}
            style={styles.brand}
          >
            <View style={styles.blobOne} />
            <View style={styles.blobTwo} />
            {showBack ? (
              <Pressable
                hitSlop={10}
                onPress={() => router.back()}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}
              >
                <Ionicons name="chevron-back" size={22} color={colors.primaryDark} />
              </Pressable>
            ) : null}
            <Image source={LOGO} style={styles.logo} contentFit="contain" />
            <Text style={styles.tagline}>Chơi game cùng nhau, kết nối đam mê</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={styles.content}>{children}</View>
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  brand: {
    height: 208,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blobOne: {
    position: 'absolute',
    top: -48,
    right: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(137, 128, 255, 0.12)',
  },
  blobTwo: {
    position: 'absolute',
    bottom: -54,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(137, 128, 255, 0.08)',
  },
  back: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  pressed: { opacity: 0.6 },
  logo: {
    width: 236,
    height: 112,
  },
  tagline: {
    marginTop: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryDark,
    opacity: 0.8,
  },
  card: {
    marginTop: -28,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  content: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
