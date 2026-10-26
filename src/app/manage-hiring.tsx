import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
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
  LoadingView,
  TextField,
  useToast,
} from '@/components/ui';
import { formatMinuteOfDay, groupByDay, WEEK_DAYS } from '@/features/hours/time';
import { formatNumber, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

const MAX_HOUR_OPTIONS = [1, 2, 3, 4, 5];

export default function ManageHiringScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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
      await refreshUser();
      toast.show('Cập nhật trạng thái thành công', 'success');
    } catch {
      updateDraft({ isPlayer: previous });
      toast.show('Cập nhật trạng thái thất bại', 'error');
    }
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
    } catch {
      toast.show('Cập nhật thất bại', 'error');
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.status, isPlayer ? styles.online : styles.offline]}>
          {isPlayer
            ? 'Sẵn sàng nhận yêu cầu thuê'
            : 'Ngừng nhận yêu cầu thuê'}
        </Text>

        <View style={styles.row}>
          <Text style={styles.rowTitle}>Nhận yêu cầu thuê</Text>
          <Switch
            value={isPlayer}
            onValueChange={(value) => void togglePlayer(value)}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.row}>
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

        <View style={styles.priceRow}>
          <Text style={styles.rowTitle}>Chi phí mỗi giờ</Text>
          <View style={styles.priceInput}>
            <TextField
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

        <Button
          label="Cập nhật"
          onPress={() => void onUpdatePress()}
          loading={updatingService}
          fullWidth={false}
          style={styles.updateButton}
        />

        <View style={styles.divider} />

        <Pressable
          onPress={() => router.push('/update-skills')}
          style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}
        >
          <Text style={styles.rowTitle}>Kỹ năng</Text>
          <View style={styles.linkRow}>
            <Text style={styles.link}>Chỉnh sửa kỹ năng</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.grey} />
          </View>
        </Pressable>

        {games.length === 0 ? (
          <Text style={styles.empty}>Không có dữ liệu</Text>
        ) : (
          games.map((item) => (
            <Text key={item.id} style={styles.gameLine}>
              {item.game?.name}
              {item.rankId !== 'None' && item.rank ? ` : ${item.rank.name}` : ''}
            </Text>
          ))
        )}

        <View style={styles.divider} />

        <Pressable
          onPress={() => router.push('/update-hours')}
          style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}
        >
          <Text style={styles.rowTitle}>Giờ online</Text>
          <View style={styles.linkRow}>
            <Text style={styles.link}>Chỉnh sửa giờ</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.grey} />
          </View>
        </Pressable>

        {WEEK_DAYS.map((day) => {
          const items = datingsByDay[day.day] ?? [];
          return (
            <View key={day.day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day.label}:</Text>
              {items.length === 0 ? (
                <Text style={styles.dayEmpty}>Không có dữ liệu</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hourChips}
                >
                  {items.map((item) => (
                    <Text key={item.id} style={styles.hourText}>
                      {formatMinuteOfDay(item.fromHour)} -{' '}
                      {formatMinuteOfDay(item.toHour)}
                    </Text>
                  ))}
                </ScrollView>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  status: {
    fontFamily: fonts.bold,
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  online: { color: colors.success },
  offline: { color: colors.grey },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    flexShrink: 1,
  },
  hourOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priceInput: { flex: 1 },
  unit: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  updateButton: {
    alignSelf: 'center',
    width: 180,
    borderRadius: radius.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  pressed: { opacity: 0.7 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  link: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  gameLine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingLeft: spacing.md,
    paddingVertical: 2,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  dayLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    width: 62,
  },
  dayEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  hourChips: { gap: spacing.sm, paddingRight: spacing.md },
  hourText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
});
