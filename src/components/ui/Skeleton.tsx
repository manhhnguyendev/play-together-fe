import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 14,
  radius: r = radius.sm,
  style,
}: SkeletonProps) {
  const [sweep] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height, borderRadius: r }, style]}
    >
      <Animated.View
        style={[
          styles.sweep,
          {
            transform: [
              {
                translateX: sweep.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-120%', '320%'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', colors.shimmer, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  sweep: { position: 'absolute', top: 0, bottom: 0, width: '45%' },
});
