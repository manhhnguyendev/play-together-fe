import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import { userService } from '@/api/services/users';
import {
  AppBar,
  Button,
  Chip,
  ErrorView,
  FLOAT_BAND_STYLE,
  LoadingView,
  SectionHeader,
  TextField,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatMinuteOfDay, groupByDay, WEEK_DAYS } from '@/features/hours/time';
import { formatNumber, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing, touchTarget } from '@/theme';

const MAX_HOUR_OPTIONS = [1, 2, 3, 4, 5];

export default function ManageHiringScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { gutter, contentStyle } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const userId = user?.id ?? '';

  const [draft, setDraft] = useState<{
    isPlayer: boolean;
    maxHourHire: number;
    priceText: string;
  } | null>(null);

  const serviceQuery = useQuery({
    queryKey: queryKeys.userService(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getUserService(userId)).content,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.gamesOfUser(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getGameOfUser(userId)).content,
  });

  const datingsQuery = useQuery({
    queryKey: queryKeys.datings(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await datingService.getAll(userId)).content,
  });

  const service = serviceQuery.data;
  const isPlayer = draft?.isPlayer ?? service?.isPlayer ?? false;
  const maxHourHire = draft?.maxHourHire ?? (service?.maxHourHire || 1);
  const priceText =
    draft?.priceText ?? formatNumber(service?.pricePerHour || 10000);

  const updateDraft = (patch: Partial<NonNullable<typeof draft>>) =>
    setDraft({ isPlayer, maxHourHire, priceText, ...patch });

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gamesOfUser(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.datings(userId),
      });
    }, [queryClient, userId]),
  );

  const games = gamesQuery.data ?? [];
  const datingsByDay = useMemo(
    () => groupByDay(datingsQuery.data ?? []),
    [datingsQuery.data],
  );

  const togglePlayer = async (value: boolean) => {
    if (games.length === 0) {
      toast.show('Thêm kỹ năng để cập nhật trạng thái', 'error');
      return;
    }
    const previous = isPlayer;
    updateDraft({ isPlayer: value });
    try {
      await userService.updateIsPlayer({ isPlayer: value });
    } catch (error) {
      updateDraft({ isPlayer: previous });
      toast.show(
        error instanceof Error ? error.message : 'Cập nhật trạng thái thất bại',
        'error',
      );
      return;
    }

    // Only the PATCH decides success: a failed profile refresh must not roll the
    // switch back and make a saved change look like it was never made.
    await Promise.all([
      refreshUser().catch(() => undefined),
      queryClient.invalidateQueries({
        queryKey: queryKeys.userService(userId),
      }),
    ]);
    toast.show(value ? 'Đang nhận yêu cầu thuê' : 'Đã ngừng nhận yêu cầu thuê', 'success');
  };

  const submitService = async () => {
    const amount = parseAmount(priceText);
    if (!priceText.trim()) {
      toast.show('Vui lòng nhập chi phí mỗi giờ!', 'error');
      return;
    }
    if (amount < 10000) {
      toast.show('Chi phí mỗi giờ tối thiểu là 10.000đ', 'error');
      return;
    }
    if (amount >= 5000000) {
      toast.show('Chi phí mỗi giờ tối đa là 5.000.000đ', 'error');
      return;
    }

    try {
      await userService.updateServiceInfo({
        pricePerHour: amount,
        maxHourHire,
      });
      toast.show('Cập nhật thành công', 'success');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userService(userId),
      });
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Cập nhật thất bại',
        'error',
      );
    }
  };

  const [updatingService, setUpdatingService] = useState(false);

  const onUpdatePress = async () => {
    setUpdatingService(true);
    try {
      await submitService();
    } finally {
      setUpdatingService(false);
    }
  };

  if (serviceQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Quản lý nhận thuê" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (serviceQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Quản lý nhận thuê" />
        <ErrorView onRetry={() => serviceQuery.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Quản lý nhận thuê" />
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
            <View
              style={[
                styles.statusCard,
                isPlayer ? styles.statusCardOn : styles.statusCardOff,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isPlayer ? colors.success : colors.textFaint },
                ]}
              />
              <Text
                style={[
                  styles.status,
                  { color: isPlayer ? colors.success : colors.textSecondary },
                ]}
              >
                {isPlayer ? 'Sẵn sàng nhận yêu cầu thuê' : 'Ngừng nhận yêu cầu thuê'}
              </Text>
            </View>

            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="switch"
                accessibilityLabel={isPlayer ? 'Tắt nhận yêu cầu thuê' : 'Bật nhận yêu cầu thuê'}
                accessibilityState={{ checked: isPlayer }}
                onPress={() => void togglePlayer(!isPlayer)}
              >
                <Text style={styles.rowTitle}>Nhận yêu cầu thuê</Text>
                <Switch
                  value={isPlayer}
                  accessibilityRole="switch"
                  accessibilityLabel="Nhận yêu cầu thuê"
                  accessibilityState={{ checked: isPlayer }}
                  onValueChange={(value) => void togglePlayer(value)}
                  trackColor={{ true: colors.primaryFill, false: colors.borderStrong }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.borderStrong}
                />
              </Pressable>
              <View style={styles.divider} />

              <View style={styles.choiceRow}>
                <Text style={styles.rowTitle}>Số giờ tối đa</Text>
                <View style={styles.hourOptions}>
                  {MAX_HOUR_OPTIONS.map((hour) => (
                    <Chip
                      key={hour}
                      label={String(hour)}
                      selected={maxHourHire === hour}
                      onPress={() => updateDraft({ maxHourHire: hour })}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <View style={styles.priceInput}>
                  <TextField
                    variant="floating"
                    label="Chi phí mỗi giờ"
                    value={priceText}
                    onChangeText={(value) =>
                      updateDraft({
                        priceText: parseAmount(value)
                          ? formatNumber(parseAmount(value))
                          : '',
                      })
                    }
                    keyboardType="number-pad"
                    placeholder="10.000"
                    maxLength={11}
                  />
                </View>
                <Text style={styles.unit}>đ</Text>
              </View>

              <View style={styles.updateBlock}>
                <Button
                  label="Cập nhật"
                  size="md"
                  onPress={() => void onUpdatePress()}
                  loading={updatingService}
                />
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                title="Kỹ năng"
                icon="game-controller-outline"
                actionLabel="Chỉnh sửa"
                onAction={() => router.push('/update-skills')}
              />
              {gamesQuery.isLoading ? (
                <Text style={styles.empty}>Đang tải...</Text>
              ) : games.length === 0 ? (
                <Text style={styles.empty}>Chưa cập nhật kỹ năng</Text>
              ) : (
                games.map((item) => (
                  <View key={item.id} style={styles.lineRow}>
                    <View style={styles.lineDot} />
                    <Text style={styles.gameLine}>
                      {item.game?.name}
                      {item.rankId !== 'None' && item.rank
                        ? ` : ${item.rank.name}`
                        : ''}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <SectionHeader
                title="Giờ online"
                icon="time-outline"
                actionLabel="Chỉnh sửa"
                onAction={() => router.push('/update-hours')}
              />
              {WEEK_DAYS.map((day) => {
                const items = datingsByDay[day.day] ?? [];
                return (
                  <View key={day.day} style={styles.dayRow}>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                    {items.length === 0 ? (
                      <Text style={styles.dayEmpty}>—</Text>
                    ) : (
                      <View style={styles.hourChips}>
                        {items.map((item) => (
                          <View key={item.id} style={styles.hourChip}>
                            <Text style={styles.hourText}>
                              {formatMinuteOfDay(item.fromHour)} -{' '}
                              {formatMinuteOfDay(item.toHour)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    gap: spacing.xxs,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touchTarget,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  statusCardOn: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  statusCardOff: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  statusDot: { width: 9, height: 9, borderRadius: radius.pill },
  status: {
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: -0.2,
    textAlign: 'center',
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: touchTarget,
  },
  rowPressed: { opacity: 0.7 },
  choiceRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  hourOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priceInput: { flex: 1, minWidth: 0 },
  unit: {
    ...FLOAT_BAND_STYLE,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  updateBlock: { marginTop: spacing.sm, maxWidth: 320, alignSelf: 'center' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 3,
  },
  lineDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  gameLine: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  dayLabel: {
    width: 62,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  dayEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textFaint,
  },
  hourChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  hourChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  hourText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryInk,
  },
});
