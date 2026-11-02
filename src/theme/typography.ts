import { PixelRatio, TextStyle } from 'react-native';

export const fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<keyof typeof fonts, TextStyle['fontWeight']>;

type Scale = {
  size: number;
  line: number;
  family: keyof typeof fonts;
  tracking?: number;
};

const base: Record<string, Scale> = {
  display: { size: 32, line: 40, family: 'bold', tracking: -0.6 },
  title1: { size: 26, line: 32, family: 'bold', tracking: -0.4 },
  title2: { size: 21, line: 27, family: 'semibold', tracking: -0.2 },
  title3: { size: 17, line: 23, family: 'semibold' },
  body: { size: 15, line: 22, family: 'regular' },
  bodyMedium: { size: 15, line: 22, family: 'medium' },
  bodySmall: { size: 13, line: 19, family: 'regular' },
  bodySmallMedium: { size: 13, line: 19, family: 'medium' },
  caption: { size: 11, line: 15, family: 'medium' },
  overline: { size: 11, line: 15, family: 'semibold', tracking: 0.7 },
};

export type TypeName = keyof typeof base;

/** Builds the text styles, optionally scaled for a given device width. */
export function makeType(scale = 1): Record<TypeName, TextStyle> {
  return Object.fromEntries(
    Object.entries(base).map(([name, token]) => {
      const size = PixelRatio.roundToNearestPixel(token.size * scale);
      return [
        name,
        {
          fontFamily: fonts[token.family],
          fontWeight: fontWeights[token.family],
          fontSize: size,
          lineHeight: PixelRatio.roundToNearestPixel(token.line * scale),
          letterSpacing: token.tracking ?? 0,
        } satisfies TextStyle,
      ];
    }),
  ) as Record<TypeName, TextStyle>;
}

export const type = makeType();

export const rawType = base;
