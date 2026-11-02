import { useMemo } from 'react';
import { TextStyle, useWindowDimensions, ViewStyle } from 'react-native';
import {
  Breakpoint,
  contentMaxWidthFor,
  fontScale,
  getBreakpoint,
  gridColumns,
  gridItemWidth,
  gutterFor,
  railCardWidth,
} from '@/theme/responsive';
import { makeType, TypeName } from '@/theme/typography';

export interface Responsive {
  width: number;
  height: number;
  bp: Breakpoint;
  isSmall: boolean;
  isWide: boolean;
  isTablet: boolean;
  /** Horizontal page padding for the current size class. */
  gutter: number;
  /** Centers content on foldables and tablets instead of stretching it. */
  contentStyle: ViewStyle;
  /** Scaled type scale; use `type.title2` instead of ad-hoc fontSize. */
  type: Record<TypeName, TextStyle>;
  scale: number;
  cardWidth: (gap?: number) => number;
  columns: (minCard?: number, gap?: number) => number;
  itemWidth: (minCard?: number, gap?: number) => number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const bp = getBreakpoint(width);
    const gutter = gutterFor(bp);
    const maxWidth = contentMaxWidthFor(bp);
    const scale = fontScale(width);

    return {
      width,
      height,
      bp,
      isSmall: bp === 'xs',
      isWide: bp === 'lg' || bp === 'xl',
      isTablet: bp === 'xl',
      gutter,
      contentStyle: {
        width: '100%',
        maxWidth,
        alignSelf: maxWidth ? 'center' : undefined,
      },
      type: makeType(scale),
      scale,
      cardWidth: (gap?: number) => railCardWidth(width, gap),
      columns: (minCard?: number, gap?: number) => gridColumns(width, minCard, gap),
      itemWidth: (minCard?: number, gap?: number) => gridItemWidth(width, minCard, gap),
    };
  }, [width, height]);
}
