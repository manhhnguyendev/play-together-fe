import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import { AppBar, Button, useToast } from '@/components/ui';
import { TimeRangeFields } from '@/components/hours/TimeRangeFields';
import {
  isValidTimeRange,
  toMinuteOfDay,
  WEEK_DAYS,
} from '@/features/hours/time';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

const pad = (value: number) => value.toString().padStart(2, '0');

export default function UpdateHourScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.dayLabel}>{dayLabel}:</Text>
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
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Cập nhật"
          onPress={() => void submit()}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  dayLabel: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.text,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
