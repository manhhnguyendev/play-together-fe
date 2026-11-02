import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOngoingOrderGuard } from '@/features/orders/useOngoingOrderGuard';
import { useUnreadNotificationCount } from '@/features/notifications/useUnreadNotificationCount';
import { colors, control, fonts, radius, spacing, type } from '@/theme';

type TabName = 'home' | 'history' | 'charity' | 'notifications' | 'personal';

const icons: Record<TabName, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  home: { active: 'home', idle: 'home-outline' },
  history: { active: 'document-text', idle: 'document-text-outline' },
  charity: { active: 'gift', idle: 'gift-outline' },
  notifications: { active: 'notifications', idle: 'notifications-outline' },
  personal: { active: 'person', idle: 'person-outline' },
};

function TabIcon({ name, focused, color }: { name: TabName; focused: boolean; color: string }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons name={focused ? icons[name].active : icons[name].idle} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const unread = useUnreadNotificationCount().data ?? 0;
  // One guard for the whole group, instead of one per tab.
  useOngoingOrderGuard();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryAction,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: {
          height: control.tabBarHeight + insets.bottom,
          paddingTop: spacing.xxs,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          elevation: 0,
          ...styles.barShadow,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="history" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="charity"
        options={{
          title: 'Quyên góp',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="charity" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="notifications" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="personal"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="personal" focused={focused} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barShadow: {
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    shadowColor: colors.black,
  },
  iconPill: {
    minWidth: 44,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: { backgroundColor: colors.primaryFaint },
  label: {
    fontFamily: fonts.medium,
    fontSize: type.caption.fontSize,
    letterSpacing: 0.1,
  },
  badge: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
    minHeight: 16,
    minWidth: 16,
    backgroundColor: colors.dangerFill,
    color: colors.textOnPrimary,
  },
});
