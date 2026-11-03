import {
  fontScale,
  getBreakpoint,
  gridColumns,
  gridItemWidth,
  gutterFor,
} from '@/theme/responsive';

/**
 * (minCard, gap) pairs the app actually asks for: the game-chip grid on the
 * search suggestions and skill screens, the player grid on search results, and
 * the default 160 used by the remaining card grids.
 */
const GRID_CALLS: [number, number][] = [
  [140, 12],
  [160, 10],
  [320, 12],
];

const PHONE_WIDTHS = [320, 360, 375, 390, 393, 411, 414, 428];

describe('breakpoints', () => {
  it('picks a size class at each lower edge', () => {
    expect(getBreakpoint(359)).toBe('xs');
    expect(getBreakpoint(360)).toBe('sm');
    expect(getBreakpoint(411)).toBe('md');
    expect(getBreakpoint(481)).toBe('lg');
    expect(getBreakpoint(761)).toBe('xl');
  });

  it('keeps phones on a 16 dp gutter and tablets on 24', () => {
    expect(gutterFor('xs')).toBe(12);
    expect(gutterFor('sm')).toBe(16);
    expect(gutterFor('xl')).toBe(24);
  });

  it('clamps the type scale so a tablet is not 1.4x the text', () => {
    expect(fontScale(393)).toBeCloseTo(1, 5);
    expect(fontScale(200)).toBeCloseTo(0.94, 5);
    expect(fontScale(1400)).toBeCloseTo(1.08, 5);
  });
});

describe('gridItemWidth', () => {
  it.each(GRID_CALLS)(
    'a min %i dp card with a %i dp gap fits every phone width',
    (minCard: number, gap: number) => {
      PHONE_WIDTHS.forEach((width) => {
        const cols = gridColumns(width, minCard, gap);
        const item = gridItemWidth(width, minCard, gap);
        const inner = width - gutterFor(getBreakpoint(width)) * 2;
        expect(cols).toBeGreaterThanOrEqual(1);
        expect(cols * item + (cols - 1) * gap).toBeLessThanOrEqual(inner);
      });
    },
  );

  it('floors the share instead of rounding it up', () => {
    // The 375 dp defect: two columns of 167.5 dp became 167.67 through
    // PixelRatio.roundToNearestPixel, the row measured 343.33 in a 343 box and
    // Yoga wrapped the grid to one item per line.
    expect(gridColumns(375, 160, 10)).toBe(2);
    expect(gridItemWidth(375, 160, 10)).toBe(166);
    const exact = (375 - 32 - 10) / 2;
    expect(gridItemWidth(375, 160, 10)).toBeLessThanOrEqual(exact);
  });

  it('never drops below one column on a narrow phone', () => {
    expect(gridColumns(320, 320, 12)).toBe(1);
    expect(gridItemWidth(320, 320, 12)).toBe(320 - 24);
  });
});
