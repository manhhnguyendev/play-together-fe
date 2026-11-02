import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import type { OnlineHourModel } from '@/api/types';
import {
  AppBar,
  Button,
  Chip,
  EmptyState,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { TimeRangeFields } from '@/components/hours/TimeRangeFields';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import {
  isValidTimeRange,
  toMinuteOfDay,
  WEEK_DAYS,
} from '@/features/hours/time';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, radius, spacing } from '@/theme';

const pad = (value: number) => value.toString().padStart(2, '0');

/** `?id=` opens the saved slot for editing; without it the screen adds a new one. */
export default function HourFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const id = typeof params.id === 'string' ? params.id : '';

  const hoursQuery = useQuery({
    queryKey: queryKeys.datings(userId),
    enabled: Boolean(userId) && Boolean(id),
    queryFn: async () => (await datingService.getAll(userId)).content,
  });

  if (!id) return <CreateHourForm />;

  if (hoursQuery.isLoading) return <LoadingView />;
  if (hoursQuery.isError) {
    return <ErrorView onRetry={() => void hoursQuery.refetch()} />;
  }

  const record = (hoursQuery.data ?? []).find((hour) => hour.id === id);
  if (!record) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Chỉnh sửa giờ online" />
        <EmptyState
          icon="alarm-outline"
          title="Không tìm thấy giờ này"
          description="Có thể giờ hẹn đã bị xoá. Hãy thử lại trong danh sách giờ."
        />
      </SafeAreaView>
    );
  }

  return <EditHourForm key={record.id} record={record} />;
}

function useHourFormState(initial?: OnlineHourModel) {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const [fromHour, setFromHour] = useState(() =>
    pad(Math.floor((initial?.fromHour ?? 0) / 60)),
  );
  const [fromMinute, setFromMinute] = useState(() =>
    pad((initial?.fromHour ?? 0) % 60),
  );
  const [toHour, setToHour] = useState(() =>
    pad(Math.floor((initial?.toHour ?? 0) / 60)),
  );
  const [toMinute, setToMinute] = useState(() => pad((initial?.toHour ?? 0) % 60));
  const [submitting, setSubmitting] = useState(false);

  /** Reads the four fields as one range, or returns null after showing the reason. */
  const readRange = (): { from: number; to: number } | null => {
    if (!fromHour || !toHour) {
      toast.show('Vui lòng nhập giờ', 'error');
      return null;
    }
    const range = {
      from: toMinuteOfDay(Number(fromHour), Number(fromMinute || 0)),
      to: toMinuteOfDay(Number(toHour), Number(toMinute || 0)),
    };
    if (
      !isValidTimeRange(
        Number(fromHour),
        Number(fromMinute || 0),
        Number(toHour),
        Number(toMinute || 0),
      )
    ) {
      toast.show('Giờ nhập không chính xác', 'error');
      return null;
    }
    return range;
  };

  const finish = async (action: Promise<unknown>, successLabel: string) => {
    setSubmitting(true);
    try {
      await action;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.datings(userId),
      });
      toast.show(successLabel, 'success');
      // The form is now reachable as /hour-form?id=…, so popping is not always
      // possible; dismiss back to the list it was opened from instead.
      router.dismissTo('/update-hours');
    } catch {
      toast.show('Giờ nhập bị trùng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    fromHour,
    fromMinute,
    toHour,
    toMinute,
    submitting,
    readRange,
    finish,
    onChange: (part: 'fromHour' | 'fromMinute' | 'toHour' | 'toMinute', value: string) => {
      if (part === 'fromHour') setFromHour(value);
      if (part === 'fromMinute') setFromMinute(value);
      if (part === 'toHour') setToHour(value);
      if (part === 'toMinute') setToMinute(value);
    },
  };
}

function CreateHourForm() {
  const toast = useToast();
  const { type } = useResponsive();
  const form = useHourFormState();
  // 1 is the "no day picked yet" value; real week days start at 2.
  const [dayInWeek, setDayInWeek] = useState(1);

  const submit = () => {
    if (dayInWeek === 1) {
      toast.show('Vui lòng chọn ngày', 'error');
      return;
    }
    const range = form.readRange();
    if (!range) return;
    void form.finish(
      datingService.create({
        fromHour: range.from,
        toHour: range.to,
        dayInWeek,
      }),
      'Thêm thành công',
    );
  };

  return (
    <HourFormScaffold
      title="Thêm giờ"
      submitLabel="Thêm mới"
      submitting={form.submitting}
      onSubmit={submit}
    >
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, type.title3]}>
          Chọn ngày trong tuần:
        </Text>
        <View style={styles.days}>
          {WEEK_DAYS.map((day) => (
            <Chip
              key={day.day}
              label={day.label}
              selected={dayInWeek === day.day}
              onPress={() => setDayInWeek(day.day)}
            />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <TimeRangeFields
          fromHour={form.fromHour}
          fromMinute={form.fromMinute}
          toHour={form.toHour}
          toMinute={form.toMinute}
          onChange={form.onChange}
        />
      </View>
    </HourFormScaffold>
  );
}

function EditHourForm({ record }: { record: OnlineHourModel }) {
  const { type } = useResponsive();
  const form = useHourFormState(record);

  const dayLabel =
    WEEK_DAYS.find((day) => day.day === record.dayInWeek)?.label ?? '';

  const submit = () => {
    const range = form.readRange();
    if (!range) return;
    void form.finish(
      datingService.update(record.id, {
        fromHour: range.from,
        toHour: range.to,
      }),
      'Cập nhật thành công',
    );
  };

  return (
    <HourFormScaffold
      title="Chỉnh sửa giờ online"
      submitLabel="Cập nhật"
      submitting={form.submitting}
      onSubmit={submit}
    >
      <View style={styles.statusCard}>
        <Text style={[styles.dayLabel, type.title3]}>{dayLabel}:</Text>
      </View>

      <View style={styles.card}>
        <TimeRangeFields
          fromHour={form.fromHour}
          fromMinute={form.fromMinute}
          toHour={form.toHour}
          toMinute={form.toMinute}
          onChange={form.onChange}
        />
      </View>
    </HourFormScaffold>
  );
}

function HourFormScaffold({
  title,
  submitLabel,
  submitting,
  onSubmit,
  children,
}: {
  title: string;
  submitLabel: string;
  submitting: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle } = useResponsive();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title={title} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
        >
          <View style={styles.footerInner}>
            <Button
              label={submitLabel}
              size="lg"
              onPress={onSubmit}
              loading={submitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.text },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusCard: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
    paddingHorizontal: spacing.md,
  },
  dayLabel: { color: colors.primaryInk, textAlign: 'center' },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
