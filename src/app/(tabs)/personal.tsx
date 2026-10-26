import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { Avatar, useToast } from '@/components/ui';
import { useOngoingOrderGuard } from '@/features/orders/useOngoingOrderGuard';
import { formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

const MENU_ITEMS = [
  { label: 'Lịch sử Giao dịch', href: '/transactions', icon: 'swap-horizontal-outline' },
  { label: 'Quản lý nhận thuê', href: '/manage-hiring', icon: 'briefcase-outline' },
  { label: 'Cài đặt sở thích', href: '/update-hobbies', icon: 'game-controller-outline' },
  { label: 'Thay đổi mật khẩu', href: '/personal-change-password', icon: 'lock-closed-outline' },
  { label: 'Thống kê', href: '/statistics', icon: 'stats-chart-outline' },
  { label: 'Chính sách', href: '/policies', icon: 'document-text-outline' },
  { label: 'Trung tâm phản hồi', href: '/feedback', icon: 'chatbox-ellipses-outline' },
] as const;

export default function PersonalScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const signOut = useAuthStore((state) => state.signOut);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useOngoingOrderGuard();

  const userId = user?.id ?? '';

  const balanceQuery = useQuery({
    queryKey: queryKeys.userBalance(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getUserBalance(userId)).content,
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Avatar uri={user.avatar} name={user.name} size={110} />
          <View style={styles.heroInfo}>
            <Text style={styles.name} numberOfLines={2}>
              {user.name}
            </Text>
            <Pressable
              onPress={() => router.push('/user-profile')}
              style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}
            >
              <Text style={styles.editText}>Chỉnh sửa tài khoản</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.grey} />
            </Pressable>
          </View>
        </View>

        <View style={styles.wallet}>
          <View style={styles.walletMain}>
            <Text style={styles.walletLabel}>Số dư trong ví:</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balance}>{formatVnd(balance)}</Text>
              <Pressable
                hitSlop={8}
                onPress={() => void refreshBalance()}
                disabled={refreshingBalance}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color={refreshingBalance ? colors.textFaint : colors.text}
                />
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push('/unactive-balance')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.activeBalance}>
                Số dư khả dụng:{' '}
                <Text style={styles.activeBalanceValue}>
                  {formatVnd(activeBalance)}
                </Text>
              </Text>
            </Pressable>
          </View>

          <View style={styles.walletDivider} />

          <View style={styles.walletActions}>
            <Pressable
              onPress={() => router.push('/deposit-method')}
              style={({ pressed }) => [styles.walletAction, pressed && styles.pressed]}
            >
              <Ionicons name="wallet-outline" size={26} color={colors.text} />
              <Text style={styles.walletActionLabel}>Nạp tiền</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/withdraw-amount')}
              style={({ pressed }) => [styles.walletAction, pressed && styles.pressed]}
            >
              <Ionicons name="cash-outline" size={26} color={colors.text} />
              <Text style={styles.walletActionLabel}>Rút tiền</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.href}>
              <Pressable
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
              >
                <View style={styles.menuLabelWrap}>
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={colors.textMuted}
                  />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.grey}
                />
              </Pressable>
              {index < MENU_ITEMS.length - 1 ? (
                <View style={styles.menuDivider} />
              ) : null}
            </View>
          ))}

          <View style={styles.menuDivider} />

          <Pressable
            onPress={() => void handleSignOut()}
            style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
          >
            <View style={styles.menuLabelWrap}>
              <Ionicons name="log-out-outline" size={19} color={colors.danger} />
              <Text style={[styles.menuLabel, styles.signOutLabel]}>Đăng xuất</Text>
            </View>
            <Ionicons name="log-out-outline" size={16} color={colors.grey} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  pressed: { opacity: 0.65 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  heroInfo: { flex: 1, gap: spacing.xs },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.text,
  },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  walletMain: { flex: 1, gap: 4 },
  walletLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balance: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#320444',
  },
  activeBalance: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    textDecorationLine: 'underline',
  },
  activeBalanceValue: {
    fontFamily: fonts.medium,
    textDecorationLine: 'none',
  },
  walletDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  walletActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  walletAction: { alignItems: 'center', gap: 4 },
  walletActionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#320444',
  },
  menu: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  signOutLabel: { color: colors.danger },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
