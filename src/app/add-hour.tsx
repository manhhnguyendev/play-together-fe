import { useQueryClient } from '@tanstack/react-query';
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
import { AppBar, Button, Chip, useToast } from '@/components/ui';
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

export default function AddHourScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
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
              label="Thêm mới"
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
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
