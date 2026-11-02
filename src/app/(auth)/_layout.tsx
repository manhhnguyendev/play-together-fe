import { Stack } from 'expo-router';
import { colors, stackTransition } from '@/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: stackTransition.push,
        gestureEnabled: true,
      }}
    />
  );
}
