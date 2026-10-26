import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import { AppBar, Button, Chip, useToast } from '@/components/ui';
import { TimeRangeFields } from '@/components/hours/TimeRangeFields';
import {
  isValidTimeRange,
  toMinuteOfDay,
  WEEK_DAYS,
} from '@/features/hours/time';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

export default function AddHourScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const [dayInWeek, setDayInWeek] = useState(1);
  const [fromHour, setFromHour] = useState('');
  const [fromMinute, setFromMinute] = useState('');
  const [toHour, setToHour] = useState('');
  const [toMinute, setToMinute] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (dayInWeek === 1) {
      toast.show('Vui lòng chọn ngày', 'error');
      return;
    }
    if (!fromHour || !toHour) {
      toast.show('Vui lòng nhập giờ', 'error');
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
      await datingService.create({
        fromHour: toMinuteOfDay(fromHourNumber, fromMinuteNumber),
        toHour: toMinuteOfDay(toHourNumber, toMinuteNumber),
        dayInWeek,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.datings(userId),
      });
      toast.show('Thêm thành công', 'success');
      router.back();
    } catch {
      toast.show('Giờ nhập bị trùng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Thêm giờ" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Chọn ngày trong tuần:</Text>
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
          label="Thêm mới"
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
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
