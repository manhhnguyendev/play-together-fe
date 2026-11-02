import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userService } from '@/api/services/users';
import {
  AppBar,
  ErrorView,
  LoadingView,
  SectionHeader,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StatisticsScreen() {
  const router = useAppRouter();
  const storedUser = useAuthStore((state) => state.user);
  const { gutter, contentStyle, type } = useResponsive();

  const statisticQuery = useQuery({
    queryKey: queryKeys.statistic,
    queryFn: async () => (await userService.getStatistic()).content,
  });

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => (await userService.getProfile()).content,
  });

  const statistic = statisticQuery.data;
  const user = profileQuery.data ?? storedUser;

  if (statisticQuery.isLoading || profileQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Thống kê" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (statisticQuery.isError || profileQuery.isError || !statistic || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Thống kê" />
        <ErrorView
          onRetry={() => {
            void statisticQuery.refetch();
            void profileQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Thống kê" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, contentStyle]}>
          <View style={styles.card}>
            <SectionHeader title="Tỷ lệ hoàn thành" icon="pie-chart-outline" />
            <View style={styles.tileRow}>
              <CompletionStat value={statistic.item3} label="Theo ngày" />
              <CompletionStat value={statistic.item4} label="Theo tháng" />
            </View>
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Xem chi tiết đánh giá"
            onPress={() => router.push(`/ratings/${user.id}?canReport=1`)}
            style={({ pressed }) => [
              styles.card,
              styles.ratingCard,
              pressed && styles.pressed,
            ]}
          >
            <SectionHeader title="Đánh giá" icon="star" />
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={26} color={colors.gold} />
              <Text style={[styles.ratingValue, type.title2]}>
                {user.rate.toFixed(1)}
              </Text>
              <View style={styles.ratingLinkWrap}>
                <Text style={[styles.ratingLink, type.bodySmallMedium]}>
                  Xem chi tiết
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.primaryAction}
                />
              </View>
            </View>
          </Pressable>

          <View style={styles.card}>
            <SectionHeader title="Thống kê đơn thuê" icon="receipt-outline" />
            <InfoLine
              label="Tổng thời gian thuê:"
              value={String(user.totalTimeOrder)}
            />
            <InfoLine
              label="Số đơn thuê đã nhận:"
              value={String(user.numOfOrder)}
            />
            <InfoLine
              label="Số đơn thuê hoàn thành đúng giờ:"
              value={String(user.numOfFinishOnTime)}
            />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Doanh thu" icon="cash-outline" />
            <View style={styles.tileRow}>
              <RevenueStat value={statistic.item1} label="Theo ngày" />
              <RevenueStat value={statistic.item2} label="Theo tháng" />
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Độ uy tín" icon="shield-checkmark-outline" />
            <InfoLine
              label="Điểm hành vi:"
              value={String(user.behaviorPoint.point)}
            />
            <InfoLine
              label="Điểm hài lòng:"
              value={String(user.behaviorPoint.satisfiedPoint)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CompletionStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const { type } = useResponsive();
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, type.title2]}>
        {value.toFixed(0)} %
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function RevenueStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const { type } = useResponsive();
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, type.title3]} numberOfLines={1}>
        {formatVnd(value)}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.sm },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  ratingCard: { gap: spacing.xxs },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ratingValue: {
    color: colors.textStrong,
    flexShrink: 0,
  },
  ratingLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    minWidth: 0,
  },
  ratingLink: {
    color: colors.primaryAction,
    flexShrink: 1,
  },
  pressed: { opacity: 0.7 },
  tileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  tileValue: {
    color: colors.textStrong,
    textAlign: 'center',
  },
  tileLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 4,
  },
  infoLabel: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
});
