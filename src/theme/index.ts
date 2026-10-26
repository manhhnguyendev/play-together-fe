import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#8980FF',
  primaryDark: '#6E64F0',
  primarySoft: '#EFECFF',
  primaryFaint: '#F6F4FF',
  white: '#FFFFFF',
  black: '#111111',
  text: '#1C1C1E',
  textMuted: '#7C7C86',
  textFaint: '#A0A0AA',
  border: '#E7E7EF',
  background: '#F7F7FB',
  surface: '#FFFFFF',
  success: '#23B26D',
  danger: '#E5484D',
  warning: '#F5A524',
  gold: '#F4B740',
  grey: '#9CA3AF',
  overlay: 'rgba(17, 17, 17, 0.45)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
} as const;

export const textStyles: Record<string, TextStyle> = {
  h1: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    lineHeight: 32,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
    lineHeight: 28,
  },
  h3: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
    lineHeight: 24,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  tiny: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textFaint,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.white,
  },
};

export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1B1B2F',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1B1B2F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
};

export const theme = { colors, spacing, radius, fonts, textStyles, shadow };
