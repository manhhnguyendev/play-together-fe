import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, control, duration, easing, fonts, radius, shadow, spacing } from '@/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

const accents: Record<ToastType, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.primaryMuted,
};

const icons: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(
    null,
  );
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(16));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: duration.exit, easing: easing.accelerate, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 16, duration: duration.exit, easing: easing.accelerate, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ id: Date.now(), message, type });
      opacity.setValue(0);
      translateY.setValue(16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: duration.enter, easing: easing.decelerate, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: duration.enter, easing: easing.decelerate, useNativeDriver: true }),
      ]).start();
      hideTimer.current = setTimeout(hide, 2600);
    },
    [hide, opacity, translateY],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            styles.container,
            {
              bottom: insets.bottom + control.tabBarHeight + spacing.sm,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Ionicons
            name={icons[toast.type]}
            size={20}
            color={accents[toast.type]}
          />
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inverseSurface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadow.floating,
  },
  message: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inverseText,
  },
});
