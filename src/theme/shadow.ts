import { Platform, ViewStyle } from 'react-native';

const ios = (
  shadowColor: string,
  height: number,
  opacity: number,
  radius: number,
  width = 0,
): ViewStyle => ({
  shadowColor,
  shadowOffset: { width, height },
  shadowOpacity: opacity,
  shadowRadius: radius,
});

export const shadow = {
  /** Hairline lift for cards sitting on the app canvas. */
  card: Platform.select<ViewStyle>({
    ios: ios('#1B1B2F', 6, 0.06, 16),
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,

  /** Stronger lift for elements that float above content. */
  raised: Platform.select<ViewStyle>({
    ios: ios('#1B1B2F', 10, 0.1, 20),
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,

  floating: Platform.select<ViewStyle>({
    ios: ios('#1B1B2F', 8, 0.14, 20),
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,

  sheet: Platform.select<ViewStyle>({
    ios: ios('#0B0C12', -8, 0.12, 28),
    android: { elevation: 12 },
    default: {},
  }) as ViewStyle,

  none: {},
} as const;
