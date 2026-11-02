import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import type { OnlineHourModel } from '@/api/types';
import {
  AppBar,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatMinuteOfDay, groupByDay, WEEK_DAYS } from '@/features/hours/time';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import {
  colors,
  control,
  hitSlop,
  radius,
  spacing,
  touchTarget,
} from '@/theme';

export default function UpdateHoursScreen() {
  const router = useAppRouter();
  const { gutter, contentStyle, itemWidth, type } = useResponsive();
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
          <Pressable
            hitSlop={hitSlop.md}
            onPress={() => router.push('/hour-form')}
            accessibilityRole="button"
            accessibilityLabel="Thêm giờ"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={24} color={colors.primaryAction} />
          </Pressable>
        }
      />

      {datingsQuery.isLoading ? (
        <LoadingView />
      ) : datingsQuery.isError ? (
        <ErrorView onRetry={() => datingsQuery.refetch()} />
      ) : (
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {WEEK_DAYS.map((day) => (
              <View
                key={day.day}
                style={[styles.card, { width: itemWidth(320, spacing.sm) }]}
              >
                <Text style={[styles.dayLabel, type.title3]}>{day.label}:</Text>
                {(grouped[day.day] ?? []).length === 0 ? (
                  <Text style={[styles.empty, type.bodySmall]}>
                    Không có dữ liệu
                  </Text>
                ) : (
                  <View style={styles.daySlots}>
                    {(grouped[day.day] ?? []).map((item) => (
                      <HourRow key={item.id} item={item} userId={userId} />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
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
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { type } = useResponsive();
  const [busy, setBusy] = useState(false);

  const range = `${formatMinuteOfDay(item.fromHour)} - ${formatMinuteOfDay(item.toHour)}`;


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
            pathname: '/hour-form',
            params: { id: item.id },
          })
        }
        accessibilityRole="link"
        accessibilityLabel={`Chỉnh sửa giờ ${range}`}
        style={({ pressed }) => [styles.hourLink, pressed && styles.pressed]}
      >
        <Text style={[styles.hourText, type.bodyMedium]} numberOfLines={1}>
          • {range}
        </Text>
      </Pressable>
      <Pressable
        hitSlop={hitSlop.sm}
        disabled={busy}
        onPress={() => void remove()}
        accessibilityRole="button"
        accessibilityLabel={`Xóa giờ ${range}`}
        accessibilityState={{ disabled: busy }}
        style={({ pressed }) => [
          styles.deleteButton,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="trash-outline" size={19} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  dayLabel: { color: colors.text },
  daySlots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hourLink: {
    minHeight: control.buttonSm,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  hourText: { color: colors.primaryInk },
  addButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  deleteButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  empty: { color: colors.textFaint },
});
