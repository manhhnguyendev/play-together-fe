import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import type { OnlineHourModel } from '@/api/types';
import {
  AppBar,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { formatMinuteOfDay, groupByDay, WEEK_DAYS } from '@/features/hours/time';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

export default function UpdateHoursScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';

  const datingsQuery = useQuery({
    queryKey: queryKeys.datings(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await datingService.getAll(userId)).content,
  });

  const grouped = useMemo(
    () => groupByDay(datingsQuery.data ?? []),
    [datingsQuery.data],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title="Chỉnh sửa giờ"
        right={
          <Pressable hitSlop={10} onPress={() => router.push('/add-hour')}>
            <Ionicons name="add" size={26} color={colors.text} />
          </Pressable>
        }
      />

      {datingsQuery.isLoading ? (
        <LoadingView />
      ) : datingsQuery.isError ? (
        <ErrorView onRetry={() => datingsQuery.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {WEEK_DAYS.map((day) => (
            <View key={day.day}>
              <Text style={styles.dayLabel}>{day.label}:</Text>
              {(grouped[day.day] ?? []).length === 0 ? (
                <Text style={styles.empty}>Không có dữ liệu</Text>
              ) : (
                (grouped[day.day] ?? []).map((item) => (
                  <HourRow key={item.id} item={item} userId={userId} />
                ))
              )}
              <View style={styles.divider} />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function HourRow({
  item,
  userId,
}: {
  item: OnlineHourModel;
  userId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await datingService.remove(item.id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.datings(userId),
      });
      toast.show('Xóa thành công', 'success');
    } catch {
      toast.show('Xóa thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.hourRow}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/update-hour',
            params: {
              id: item.id,
              dayInWeek: String(item.dayInWeek),
              fromHour: String(item.fromHour),
              toHour: String(item.toHour),
            },
          })
        }
        style={({ pressed }) => [styles.hourLink, pressed && styles.pressed]}
      >
        <Text style={styles.hourText}>
          • {formatMinuteOfDay(item.fromHour)} -{' '}
          {formatMinuteOfDay(item.toHour)}
        </Text>
      </Pressable>
      <Pressable
        hitSlop={8}
        disabled={busy}
        onPress={() => void remove()}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={19} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  dayLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.xs,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.6 },
  hourLink: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  hourText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
