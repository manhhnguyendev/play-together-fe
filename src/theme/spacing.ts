export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  vast: 64,
} as const;

export type SpaceName = keyof typeof spacing;

/** Minimum touch target per platform guidance (Apple HIG / Material). */
export const touchTarget = 44;

export const control = {
  inputHeight: 50,
  buttonSm: 44,
  buttonMd: 50,
  buttonLg: 56,
  appBarHeight: 56,
  tabBarHeight: 56,
} as const;

export const hitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;
