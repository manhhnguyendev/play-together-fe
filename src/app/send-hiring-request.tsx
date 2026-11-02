import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
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
  SectionHeader,
  SelectField,
  useToast,
} from '@/components/ui';
import { buildBookableDays } from '@/features/hire/slots';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime, formatNumber, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, hitSlop, radius, spacing } from '@/theme';

export default function SendHiringRequestScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
  const params = useLocalSearchParams<{ playerId?: string }>();
  const playerId = typeof params.playerId === 'string' ? params.playerId : '';
  const currentUser = useAuthStore((state) => state.user);

  const [durationChoice, setDurationChoice] = useState(1);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);

  const playerQuery = useQuery({
    queryKey: queryKeys.player(playerId),
    enabled: Boolean(playerId),
    queryFn: async () => (await userService.getPlayerById(playerId)).content,
  });

  const hoursQuery = useQuery({
    queryKey: queryKeys.datings(playerId),
    enabled: Boolean(playerId),
    queryFn: async () => (await datingService.getAll(playerId)).content,
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

  const bookableDays = useMemo(
    () => buildBookableDays(hoursQuery.data ?? [], duration),
    [hoursQuery.data, duration],
  );
  const canSchedule = bookableDays.length > 0;
  const activeDay =
    bookableDays.find((day) => day.key === dayKey) ?? bookableDays[0];
  // Lengthening the session can make the chosen start no longer fit, and a slot
  // that has slipped out of the list must never be sent.
  const selectedStart =
    bookedSlot &&
    bookableDays.some((day) => day.slots.some((slot) => slot.startsAt === bookedSlot))
      ? bookedSlot
      : null;

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await orderService.create(player!.id, {
        totalTimes: duration,
        message: message.trim(),
        games: selectedGames.map((gameId) => ({ gameId })),
        startsAt: selectedStart,
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
  const notEnoughBalance = total > activeBalance;

  const toggleGame = (gameId: string) => {
    setSelectedGames((current) =>
      current.includes(gameId)
        ? current.filter((id) => id !== gameId)
        : [...current, gameId],
    );
  };

  const submit = () => {
    if (notEnoughBalance) {
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.column, contentStyle]}>
            <View style={styles.playerCard}>
              <Avatar uri={player.avatar} name={player.name} size={64} />
              <View style={styles.playerInfo}>
                <Text style={[styles.name, type.title3]} numberOfLines={1}>
                  {player.name}
                </Text>
                <StatusText status={player.status} size={14} />
              </View>
            </View>

            <View style={styles.card}>
              <InfoLine label="Chi phí mỗi giờ">
                <Text style={styles.value}>
                  {formatNumber(player.pricePerHour)}đ
                </Text>
              </InfoLine>
              <View style={styles.divider} />
              <View style={styles.durationBlock}>
                <Text style={styles.infoLabel}>Thời lượng thuê</Text>
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
              </View>
              <View style={styles.divider} />
              <View style={styles.durationBlock}>
                <Text style={styles.infoLabel}>Thời gian bắt đầu</Text>
                {!canSchedule ? (
                  <Text style={styles.hint}>
                    {hoursQuery.isLoading
                      ? 'Đang tải giờ online của người chơi...'
                      : 'Người chơi chưa công bố giờ online nên chỉ thuê được ngay.'}
                  </Text>
                ) : (
                  <>
                    <View style={styles.durationRow}>
                      <Chip
                        label="Ngay bây giờ"
                        selected={selectedStart === null}
                        onPress={() => setBookedSlot(null)}
                      />
                      <Chip
                        label="Chọn giờ hẹn"
                        selected={selectedStart !== null}
                        onPress={() => {
                          setDayKey(activeDay?.key ?? null);
                          setBookedSlot(activeDay?.slots[0]?.startsAt ?? null);
                        }}
                      />
                    </View>
                    {selectedStart ? (
                      <>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.dayRow}
                          contentContainerStyle={styles.dayRowContent}
                        >
                          {bookableDays.map((day) => (
                            <View key={day.key} style={styles.dayChip}>
                              <Chip
                                label={day.label}
                                selected={day.key === activeDay?.key}
                                onPress={() => setDayKey(day.key)}
                              />
                            </View>
                          ))}
                        </ScrollView>
                        <SelectField
                          label="Giờ bắt đầu"
                          placeholder="Chọn giờ"
                          value={selectedStart}
                          options={(activeDay?.slots ?? []).map((slot) => ({
                            label: slot.label,
                            value: slot.startsAt,
                          }))}
                          onChange={(value) => setBookedSlot(value)}
                        />
                        <Text style={styles.hint}>
                          Tiền sẽ được giữ khi người chơi chấp nhận và hoàn lại
                          đầy đủ nếu bạn hủy trước giờ bắt đầu.
                        </Text>
                      </>
                    ) : null}
                  </>
                )}
              </View>
              <View style={styles.divider} />
              {selectedStart ? (
                <>
                  <InfoLine label="Bắt đầu lúc">
                    <Text style={styles.value}>
                      {formatDateTime(selectedStart)}
                    </Text>
                  </InfoLine>
                  <View style={styles.divider} />
                </>
              ) : null}
              <InfoLine label="Chi phí tổng">
                <Text style={styles.total}>{formatVnd(total)}</Text>
              </InfoLine>
              <View style={styles.divider} />
              <InfoLine label="Số dư khả dụng">
                <View style={styles.balanceRow}>
                  <Text
                    style={[
                      styles.balance,
                      notEnoughBalance && { color: colors.danger },
                    ]}
                  >
                    {formatVnd(activeBalance)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nạp tiền"
                    hitSlop={hitSlop.sm}
                    onPress={() => router.push('/deposit-method')}
                    style={({ pressed }) => [
                      styles.depositButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={colors.primaryAction}
                    />
                  </Pressable>
                </View>
              </InfoLine>
            </View>

            <View style={styles.card}>
              <SectionHeader title="Tựa game bạn chọn" icon="game-controller-outline" />
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

            <View style={styles.card}>
              <SectionHeader title="Lời nhắn" icon="chatbubble-ellipses-outline" />
              <View
                style={[
                  styles.messageBox,
                  notEnoughBalance ? styles.messageBoxError : null,
                ]}
              >
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Nhập vào lời nhắn của bạn"
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel="Lời nhắn cho người chơi"
                  style={styles.messageInput}
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: gutter,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          <View style={[styles.footerRow, contentStyle]}>
            <View style={styles.footerLabels}>
              <Text style={styles.footerLabel}>Tổng cộng</Text>
              <Text style={styles.footerTotal}>{formatVnd(total)}</Text>
            </View>
            <View style={styles.footerButton}>
              <Button
                label="Gửi yêu cầu"
                size="md"
                onPress={submit}
                loading={createMutation.isPending}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.sm, gap: spacing.sm },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  playerInfo: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 36,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: { flex: 1, alignItems: 'flex-end', minWidth: 0 },
  value: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  durationBlock: { gap: spacing.xs, paddingVertical: spacing.xxs },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayRow: { flexGrow: 0 },
  dayRowContent: { gap: 6, paddingRight: 4 },
  dayChip: { flexShrink: 0 },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  total: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primaryInk,
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
  depositButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFaint,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  gameList: { gap: 2, paddingTop: spacing.xxs },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  messageBox: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    marginTop: spacing.xxs,
  },
  messageBoxError: { borderColor: colors.dangerSoft },
  messageInput: {
    minHeight: 108,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    padding: 0,
  },
  pressed: { opacity: 0.7 },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerLabels: { minWidth: 0 },
  footerLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  footerTotal: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.primaryInk,
  },
  footerButton: { width: 170, maxWidth: '52%', flexShrink: 0 },
});
