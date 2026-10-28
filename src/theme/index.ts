import { Platform, ViewStyle } from 'react-native';

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

