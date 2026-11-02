export const violet = {
  50: '#F4F3FF',
  100: '#EFECFF',
  200: '#DED9FF',
  300: '#BCB3FF',
  400: '#9C90FF',
  500: '#8980FF',
  600: '#6E64F0',
  700: '#5B51D8',
  800: '#473EB0',
  900: '#2F2A72',
} as const;

export const gold = {
  100: '#FDF4E1',
  300: '#F8D894',
  500: '#F4B740',
  600: '#D89A24',
  700: '#9A6C0E',
  900: '#4A3405',
} as const;

export const neutral = {
  white: '#FFFFFF',
  ink: '#14161F',
  inkSoft: '#3C414F',
  muted: '#5A5F6E',
  faint: '#8A90A6',
  line: '#E4E6EF',
  lineSoft: '#F0F1F6',
  canvas: '#F6F7FB',
  black: '#111111',
} as const;

export const status = {
  success: '#188A54',
  successSoft: '#E7F6EE',
  danger: '#C0333A',
  dangerSoft: '#FDECEC',
  warning: '#B4740F',
  warningSoft: '#FDF3E0',
} as const;

/** Dark grounds. `card` is the raised surface, `canvas` the screen behind it. */
export const darkNeutral = {
  white: '#FFFFFF',
  canvas: '#101219',
  card: '#181B24',
  lineSoft: '#20242F',
  line: '#2A2E3B',
  borderStrong: '#454C60',
  ink: '#F1F2F8',
  inkSoft: '#D3D7E3',
  muted: '#9BA2B4',
  faint: '#6F7688',
  black: '#000000',
} as const;

/** Deep tinted grounds with light foregrounds, for the dark scheme only. */
export const darkStatus = {
  success: '#5CD6A0',
  successSoft: '#16382B',
  danger: '#FF8A8A',
  dangerSoft: '#3C1F22',
  warning: '#F2C065',
  warningSoft: '#3A2B12',
} as const;

export const darkBrand = {
  faint: '#20223A',
  soft: '#2C2E52',
  border: '#3E3F6B',
  goldSoft: '#3A2E16',
} as const;
