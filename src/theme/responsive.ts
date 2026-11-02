import { PixelRatio } from 'react-native';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Lower edge of each breakpoint, in dp. */
export const breakpoints = { sm: 360, md: 411, lg: 481, xl: 761 } as const;

export function getBreakpoint(width: number): Breakpoint {
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  return 'xl';
}

const clamp = (min: number, value: number, max: number) =>
  Math.min(max, Math.max(min, value));

const gutterByBreakpoint: Record<Breakpoint, number> = {
  xs: 12,
  sm: 16,
  md: 16,
  lg: 24,
  xl: 24,
};

/** Wide devices centre the column instead of stretching every row edge to edge. */
const contentMaxWidthByBreakpoint: Record<Breakpoint, number | undefined> = {
  xs: undefined,
  sm: undefined,
  md: undefined,
  lg: 640,
  xl: 720,
};

/** Cards visible in one horizontal rail — deliberately fractional. */
const railDensityByBreakpoint: Record<Breakpoint, number> = {
  xs: 2.2,
  sm: 2.3,
  md: 2.6,
  lg: 3.6,
  xl: 4.6,
};

export const gutterFor = (bp: Breakpoint) => gutterByBreakpoint[bp];

export const contentMaxWidthFor = (bp: Breakpoint) =>
  contentMaxWidthByBreakpoint[bp];

export function fontScale(width: number) {
  return clamp(0.94, 1 + (width - 393) / 1900, 1.08);
}

/** Fluid width for a card in a horizontal rail; replaces the old hardcoded 150. */
export function railCardWidth(width: number, gap = 10) {
  const bp = getBreakpoint(width);
  const usable = width - gutterFor(bp) * 2 - gap * (railDensityByBreakpoint[bp] - 1);
  return PixelRatio.roundToNearestPixel(clamp(118, usable / railDensityByBreakpoint[bp], 208));
}

/** Column count for a wrapping grid of at least `minCard` wide. */
export function gridColumns(width: number, minCard = 160, gap = 10) {
  const usable = width - gutterFor(getBreakpoint(width)) * 2 + gap;
  return Math.max(1, Math.floor(usable / (minCard + gap)));
}

export function gridItemWidth(width: number, minCard = 160, gap = 10) {
  const cols = gridColumns(width, minCard, gap);
  const usable = width - gutterFor(getBreakpoint(width)) * 2 - gap * (cols - 1);
  // Floor, never round: at 375 dp with two columns the exact share is 167.5,
  // and rounding it up to 167.67 makes the row 343.33 wide inside a 343
  // container — the row then wraps to one item per line and the grid collapses.
  return Math.floor(usable / cols);
}
