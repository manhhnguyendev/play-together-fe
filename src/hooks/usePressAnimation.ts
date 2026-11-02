import { useState } from 'react';
import { Animated } from 'react-native';
import { duration, easing, press } from '@/theme';

/** Shared press feedback: a short scale-down that reverses on release. */
export function usePressAnimation(scaleValue: number = press.scale) {
  const [scale] = useState(() => new Animated.Value(1));

  const animateTo = (toValue: number) =>
    Animated.timing(scale, {
      toValue,
      duration: toValue === 1 ? duration.state : duration.press,
      easing: easing.standard,
      useNativeDriver: true,
    }).start();

  return {
    onPressIn: () => animateTo(scaleValue),
    onPressOut: () => animateTo(1),
    style: { transform: [{ scale }] },
  };
}
