import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { userService } from '@/api/services/users';
import { StatusText } from '@/components/players/StatusText';
import {
  AppBar,
  Avatar,
  Button,
  Checkbox,
  Chip,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { formatNumber, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function SendHiringRequestScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ playerId?: string }>();
  const playerId = typeof params.playerId === 'string' ? params.playerId : '';
  const currentUser = useAuthStore((state) => state.user);

  const [durationChoice, setDurationChoice] = useState(1);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const playerQuery = useQuery({
    queryKey: queryKeys.player(playerId),
    enabled: Boolean(playerId),
    queryFn: async () => (await userService.getPlayerById(playerId)).content,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.gamesOfUser(playerId),
    enabled: Boolean(playerId),
    queryFn: async () => (await userService.getGameOfUser(playerId)).content,
  });

  const balanceQuery = useQuery({
    queryKey: queryKeys.userBalance(currentUser?.id ?? ''),
    enabled: Boolean(currentUser?.id),
    queryFn: async () =>
      (await userService.getUserBalance(currentUser!.id)).content,
  });

  const player = playerQuery.data;
  const maxHour = Math.max(1, player?.maxHourHire ?? 1);
  const duration = Math.min(durationChoice, maxHour);
  const activeBalance =
    balanceQuery.data?.activeBalance ??
    currentUser?.userBalance?.activeBalance ??
    0;

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await orderService.create(player!.id, {
        totalTimes: duration,
        message: message.trim(),
        games: selectedGames.map((gameId) => ({ gameId })),
      });
      return result.content;
    },
    onSuccess: (order) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.home.recentOrders,
      });
      router.replace({
        pathname: '/hiring-negotiating/[orderId]',
        params: { orderId: order.id },
      });
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Không thể gửi yêu cầu thuê.',
        'error',
      ),
  });

  if (!playerId || playerQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Thuê người chơi" />
        <ErrorView onRetry={() => playerQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (playerQuery.isLoading || !player) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Thuê người chơi" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const games = gamesQuery.data ?? [];
  const total = player.pricePerHour * duration;

  const toggleGame = (gameId: string) => {
    setSelectedGames((current) =>
      current.includes(gameId)
        ? current.filter((id) => id !== gameId)
        : [...current, gameId],
    );
  };

  const submit = () => {
    if (total > activeBalance) {
      toast.show('Số dư khả dụng không đủ', 'error');
      return;
    }
    if (selectedGames.length === 0) {
      toast.show('Vui lòng chọn tựa game', 'error');
      return;
    }
    if (!message.trim()) {
      toast.show('Vui lòng nhập lời nhắn', 'error');
      return;
    }
    createMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Thuê người chơi" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar uri={player.avatar} name={player.name} size={150} />
          <Text style={styles.name}>{player.name}</Text>
          <StatusText status={player.status} size={15} />
        </View>

        <View style={styles.rows}>
          <InfoLine label="Chi phí mỗi giờ">
            <Text style={styles.value}>
              {formatNumber(player.pricePerHour)}đ
            </Text>
          </InfoLine>
          <InfoLine label="Thời lượng thuê">
            <View style={styles.durationRow}>
              {Array.from({ length: maxHour }, (_, index) => index + 1).map(
                (hour) => (
                  <Chip
                    key={hour}
                    label={`${hour} giờ`}
                    selected={duration === hour}
                    onPress={() => setDurationChoice(hour)}
                  />
                ),
              )}
            </View>
          </InfoLine>
          <InfoLine label="Chi phí tổng">
            <Text style={styles.total}>{formatVnd(total)}</Text>
          </InfoLine>
          <InfoLine label="Số dư khả dụng">
            <View style={styles.balanceRow}>
              <Pressable
                hitSlop={8}
                onPress={() => router.push('/deposit-method')}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={colors.primaryDark}
                />
              </Pressable>
              <Text style={styles.balance}>{formatVnd(activeBalance)}</Text>
            </View>
          </InfoLine>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tựa game bạn chọn</Text>
          {gamesQuery.isLoading ? (
            <Text style={styles.muted}>Đang tải...</Text>
          ) : games.length === 0 ? (
            <Text style={styles.muted}>Người chơi chưa cập nhật tựa game.</Text>
          ) : (
            <View style={styles.gameList}>
              {games.map((item) => (
                <Checkbox
                  key={item.id}
                  checked={selectedGames.includes(item.gameId)}
                  onPress={() => toggleGame(item.gameId)}
                  label={item.game?.name ?? ''}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lời nhắn</Text>
          <View style={styles.messageBox}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Nhập vào lời nhắn của bạn"
              placeholderTextColor={colors.textFaint}
              style={styles.messageInput}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Tổng cộng</Text>
          <Text style={styles.footerTotal}>{formatVnd(total)}</Text>
        </View>
        <View style={styles.footerButton}>
          <Button
            label="Gửi yêu cầu"
            onPress={submit}
            loading={createMutation.isPending}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValue}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl },
  header: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
  },
  name: {
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: 21,
    color: colors.text,
  },
  rows: { paddingHorizontal: spacing.md },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
  },
  infoValue: { flex: 1, alignItems: 'flex-end' },
  value: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  total: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primaryDark,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balance: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  gameList: { gap: 2, paddingVertical: spacing.xxs },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  messageBox: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xxs,
  },
  messageInput: {
    minHeight: 128,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  footerTotal: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  footerButton: { width: 170 },
});
