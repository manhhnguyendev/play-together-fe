import { Appearance } from 'react-native';
import {
  darkBrand,
  darkNeutral,
  darkStatus,
  gold,
  neutral,
  status,
  violet,
} from './palette';

/**
 * Flat semantic palette. The legacy keys (primary, text, border, ...) are kept so
 * existing screens keep compiling while they migrate to the new semantic names.
 *
 * `colors` is resolved once, when this module is first imported. Every
 * StyleSheet.create in the app runs after that, so each bundle bakes in exactly
 * one scheme — changing the device appearance takes effect on the next launch.
 */
export const lightColors = {
  // Brand — violet 500 stays the identity colour, 700 is the accessible action colour.
  primary: violet[500],
  primaryDark: violet[600],
  primaryAction: violet[700],
  primaryStrong: violet[800],
  primaryInk: violet[900],
  primarySoft: violet[100],
  primaryFaint: violet[50],
  primaryBorder: violet[200],
  primaryMuted: violet[300],

  // Fills carry white labels; in the dark scheme they stay saturated while the
  // action *tint* above goes light.
  primaryFill: violet[700],
  primaryFillPressed: violet[800],
  dangerFill: status.danger,
  dangerFillPressed: '#A22A30',

  // Accent — gold is highlight only, never a background for white text.
  gold: gold[500],
  goldSoft: gold[100],
  goldText: gold[700],

  // Surfaces
  white: neutral.white,
  surface: neutral.white,
  surfaceMuted: neutral.lineSoft,
  background: neutral.canvas,
  border: neutral.line,
  borderStrong: neutral.faint,

  // Text
  text: neutral.ink,
  textStrong: neutral.black,
  textSecondary: neutral.inkSoft,
  textMuted: neutral.muted,
  textFaint: neutral.faint,
  textOnPrimary: neutral.white,

  // Status
  success: status.success,
  successSoft: status.successSoft,
  danger: status.danger,
  dangerSoft: status.dangerSoft,
  warning: status.warning,
  warningSoft: status.warningSoft,
  info: violet[600],

  grey: neutral.faint,
  black: neutral.black,
  // Transient surfaces (toasts) invert against the scheme rather than follow it.
  inverseSurface: neutral.ink,
  inverseText: neutral.white,
  overlay: 'rgba(20, 22, 31, 0.48)',
  scrim: 'rgba(20, 22, 31, 0.72)',
  shimmer: 'rgba(255, 255, 255, 0.7)',
  // Logo artwork carries its own white ground, so its tile never follows the scheme.
  plaque: neutral.white,
} as const;

export type ColorName = keyof typeof lightColors;
type Palette = { [K in ColorName]: string };

export const darkColors: Palette = {
  primary: violet[400],
  primaryDark: violet[300],
  primaryAction: violet[300],
  primaryStrong: violet[500],
  primaryInk: violet[100],
  primarySoft: darkBrand.soft,
  primaryFaint: darkBrand.faint,
  primaryBorder: darkBrand.border,
  primaryMuted: violet[400],

  primaryFill: violet[700],
  primaryFillPressed: violet[600],
  dangerFill: '#8E2A2F',
  dangerFillPressed: '#A63238',

  gold: gold[500],
  goldSoft: darkBrand.goldSoft,
  goldText: gold[300],

  white: darkNeutral.white,
  surface: darkNeutral.card,
  surfaceMuted: darkNeutral.lineSoft,
  background: darkNeutral.canvas,
  border: darkNeutral.line,
  borderStrong: darkNeutral.borderStrong,

  text: darkNeutral.ink,
  textStrong: darkNeutral.white,
  textSecondary: darkNeutral.inkSoft,
  textMuted: darkNeutral.muted,
  textFaint: darkNeutral.faint,
  textOnPrimary: darkNeutral.white,

  success: darkStatus.success,
  successSoft: darkStatus.successSoft,
  danger: darkStatus.danger,
  dangerSoft: darkStatus.dangerSoft,
  warning: darkStatus.warning,
  warningSoft: darkStatus.warningSoft,
  info: violet[300],

  grey: darkNeutral.faint,
  black: darkNeutral.black,
  inverseSurface: darkNeutral.line,
  inverseText: darkNeutral.ink,
  overlay: 'rgba(0, 0, 0, 0.62)',
  scrim: 'rgba(0, 0, 0, 0.84)',
  shimmer: 'rgba(255, 255, 255, 0.12)',
  plaque: darkNeutral.white,
};

function resolveScheme(): 'light' | 'dark' {
  // The web target renders on the server too, where there is no appearance to read.
  if (typeof window === 'undefined') return 'light';
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export const scheme = resolveScheme();
export const isDark = scheme === 'dark';

export const colors: Palette = isDark ? darkColors : lightColors;
