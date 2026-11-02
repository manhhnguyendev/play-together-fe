import { useQueryClient } from '@tanstack/react-query';
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
import { AppBar, Button, useToast } from '@/components/ui';
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

export default function UpdateHourScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const params = useLocalSearchParams<{
    id?: string;
    dayInWeek?: string;
    fromHour?: string;
    toHour?: string;
  }>();

  const dayInWeek = Number(params.dayInWeek ?? 0);
  const dayLabel =
    WEEK_DAYS.find((day) => day.day === dayInWeek)?.label ?? '';

  const [fromHour, setFromHour] = useState(() =>
    pad(Math.floor(Number(params.fromHour ?? 0) / 60)),
  );
  const [fromMinute, setFromMinute] = useState(() =>
    pad(Number(params.fromHour ?? 0) % 60),
  );
  const [toHour, setToHour] = useState(() =>
    pad(Math.floor(Number(params.toHour ?? 0) / 60)),
  );
  const [toMinute, setToMinute] = useState(() =>
    pad(Number(params.toHour ?? 0) % 60),
  );
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!params.id || !fromHour || !toHour) {
      toast.show('Giờ nhập không chính xác', 'error');
      return;
    }

    const fromHourNumber = Number(fromHour);
    const toHourNumber = Number(toHour);
    const fromMinuteNumber = Number(fromMinute || 0);
    const toMinuteNumber = Number(toMinute || 0);

    if (
      !isValidTimeRange(
        fromHourNumber,
        fromMinuteNumber,
        toHourNumber,
        toMinuteNumber,
      )
    ) {
      toast.show('Giờ nhập không chính xác', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await datingService.update(params.id, {
        fromHour: toMinuteOfDay(fromHourNumber, fromMinuteNumber),
        toHour: toMinuteOfDay(toHourNumber, toMinuteNumber),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.datings(userId),
      });
      toast.show('Cập nhật thành công', 'success');
      router.back();
    } catch {
      toast.show('Giờ nhập bị trùng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chỉnh sửa giờ online" />
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
          <View style={styles.statusCard}>
            <Text style={[styles.dayLabel, type.title3]}>{dayLabel}:</Text>
          </View>

          <View style={styles.card}>
            <TimeRangeFields
              fromHour={fromHour}
              fromMinute={fromMinute}
              toHour={toHour}
              toMinute={toMinute}
              onChange={(part, value) => {
                if (part === 'fromHour') setFromHour(value);
                if (part === 'fromMinute') setFromMinute(value);
                if (part === 'toHour') setToHour(value);
                if (part === 'toMinute') setToMinute(value);
              }}
            />
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
        >
          <View style={styles.footerInner}>
            <Button
              label="Cập nhật"
              size="lg"
              onPress={() => void submit()}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
