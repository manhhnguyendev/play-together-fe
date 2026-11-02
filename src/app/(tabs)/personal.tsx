import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userService } from '@/api/services/users';
import { Avatar, ScreenHeader, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import {
  colors,
  fonts,
  gold,
  hitSlop,
  radius,
  shadow,
  spacing,
  touchTarget,
  violet,
} from '@/theme';

const MENU_ITEMS = [
  { label: 'Lịch sử Giao dịch', href: '/transactions', icon: 'swap-horizontal-outline' },
  { label: 'Quản lý nhận thuê', href: '/manage-hiring', icon: 'briefcase-outline' },
  { label: 'Cài đặt sở thích', href: '/update-hobbies', icon: 'game-controller-outline' },
  { label: 'Game yêu thích', href: '/favorite-games', icon: 'heart-outline' },
  { label: 'Điểm hành vi', href: '/behavior-history', icon: 'analytics-outline' },
  { label: 'Người dùng đã chặn', href: '/blocked-users', icon: 'ban-outline' },
  { label: 'Thay đổi mật khẩu', href: '/personal-change-password', icon: 'lock-closed-outline' },
  { label: 'Thống kê', href: '/statistics', icon: 'stats-chart-outline' },
  { label: 'Chính sách', href: '/policies', icon: 'document-text-outline' },
  { label: 'Trung tâm phản hồi', href: '/feedback', icon: 'chatbox-ellipses-outline' },
] as const;

export default function PersonalScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { gutter, contentStyle } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const signOut = useAuthStore((state) => state.signOut);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [signingOut, setSigningOut] = useState(false);


  const userId = user?.id ?? '';

  const balanceQuery = useQuery({
    queryKey: queryKeys.userBalance(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getUserBalance(userId)).content,
    // Money the user can act on must not be served from a 30-second cache: the
    // gateway's confirmation lands while the app is in the background, and
    // returning to it is exactly when the new balance has to show.
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.userBalance(userId),
      });
    }, [queryClient, userId]),
  );

  const wallet = balanceQuery.data ?? user?.userBalance;
  const balance = wallet?.balance ?? 0;
  const activeBalance = wallet?.activeBalance ?? 0;

  const refreshBalance = async () => {
    if (refreshingBalance) return;
    setRefreshingBalance(true);
    try {
      await userService.releaseUnActiveBalance();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(userId),
        }),
        refreshUser(),
      ]);
      toast.show('Cập nhật số dư thành công', 'success');
    } catch {
      toast.show('Cập nhật số dư thất bại', 'error');
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      toast.show('ĐĂNG XUẤT THÀNH CÔNG', 'success');
    } finally {
      setSigningOut(false);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Cá nhân" subtitle="Tài khoản và ví của bạn" showLogo={false} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, contentStyle]}>
          <View style={styles.hero}>
            <Avatar uri={user.avatar} name={user.name} size={76} />
            <View style={styles.heroInfo}>
              <Text style={styles.name} numberOfLines={2}>
                {user.name}
              </Text>
              <Pressable
                onPress={() => router.push('/user-profile')}
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa tài khoản"
                hitSlop={hitSlop.sm}
                style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}
              >
                <Text style={styles.editText}>Chỉnh sửa tài khoản</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.textFaint} />
              </Pressable>
            </View>
          </View>

          <View style={styles.wallet}>
            <View style={styles.walletMain}>
              <Text style={styles.walletLabel}>Số dư trong ví</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balance} numberOfLines={1}>
                  {formatVnd(balance)}
                </Text>
                <Pressable
                  hitSlop={hitSlop.md}
                  accessibilityRole="button"
                  accessibilityLabel="Cập nhật số dư"
                  onPress={() => void refreshBalance()}
                  disabled={refreshingBalance}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.pressed,
                    refreshingBalance && styles.iconButtonBusy,
                  ]}
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color={colors.textOnPrimary}
                  />
                </Pressable>
              </View>
              <Pressable
                onPress={() => router.push('/unactive-balance')}
                accessibilityRole="button"
                hitSlop={hitSlop.sm}
                style={({ pressed }) => [
                  styles.activeBalanceRow,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.activeBalance}>
                  Khả dụng:{' '}
                  <Text style={styles.activeBalanceValue}>
                    {formatVnd(activeBalance)}
                  </Text>
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={violet[300]}
                />
              </Pressable>
              {balanceQuery.isError ? (
                <Pressable
                  onPress={() => void balanceQuery.refetch()}
                  accessibilityRole="button"
                  accessibilityLabel="Thử tải lại số dư"
                  hitSlop={hitSlop.sm}
                  style={({ pressed }) => [
                    styles.balanceNotice,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color={gold[300]}
                  />
                  <Text style={styles.balanceNoticeText}>
                    {balanceQuery.isFetching
                      ? 'Đang thử tải lại số dư…'
                      : 'Không tải được số dư mới nhất, con số có thể đã cũ. Nhấn để thử lại.'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.walletActions}>
              <Pressable
                onPress={() => router.push('/deposit-method')}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.walletAction,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.walletActionIcon}>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.primaryAction}
                  />
                </View>
                <Text style={styles.walletActionLabel}>Nạp tiền</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/withdraw-amount')}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.walletAction,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.walletActionIcon}>
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={20}
                    color={colors.goldText}
                  />
                </View>
                <Text style={styles.walletActionLabel}>Rút tiền</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.menu}>
            {MENU_ITEMS.map((item, index) => (
              <View key={item.href}>
                {index > 0 ? <View style={styles.menuDivider} /> : null}
                <Pressable
                  onPress={() => router.push(item.href)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && styles.menuRowPressed,
                  ]}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={colors.primaryAction}
                    />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textFaint}
                  />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => void handleSignOut()}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất"
            style={({ pressed }) => [
              styles.signOut,
              pressed && styles.menuRowPressed,
              signingOut && styles.pressed,
            ]}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            </View>
            <Text style={styles.signOutLabel}>Đăng xuất</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  section: { gap: spacing.md },
  pressed: { opacity: 0.7 },
  menuRowPressed: { backgroundColor: colors.surfaceMuted },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  heroInfo: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 25,
    color: colors.text,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
  },
  editText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryAction,
  },
  wallet: {
    backgroundColor: violet[700],
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow.raised,
  },
  walletMain: { gap: 2 },
  walletLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: violet[200],
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balance: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 33,
    color: colors.textOnPrimary,
    letterSpacing: -0.4,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: violet[600],
  },
  iconButtonBusy: { opacity: 0.6 },
  activeBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    marginTop: 4,
  },
  activeBalance: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: violet[200],
  },
  activeBalanceValue: {
    fontFamily: fonts.semibold,
    color: gold[300],
  },
  balanceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: spacing.xs,
  },
  balanceNoticeText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: gold[300],
  },
  walletActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  walletAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  walletActionIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFaint,
  },
  walletActionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget + 4,
    paddingHorizontal: spacing.md,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFaint,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 32 + spacing.sm,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget + 4,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  signOutLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.danger,
  },
});
