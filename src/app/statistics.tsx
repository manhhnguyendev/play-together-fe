import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
} from '@/components/ui';
import { formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StatisticsScreen() {
  const router = useRouter();
  const storedUser = useAuthStore((state) => state.user);

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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.completion}>
            <Text style={styles.cardTitle}>Tỷ lệ hoàn thành</Text>
            <View style={styles.completionRow}>
              <CompletionStat value={statistic.item3} label="Theo ngày" />
              <CompletionStat value={statistic.item4} label="Theo tháng" />
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <Pressable
            onPress={() => router.push(`/ratings/${user.id}?canReport=1`)}
            style={({ pressed }) => [styles.rating, pressed && styles.pressed]}
          >
            <Text style={styles.cardTitle}>Đánh giá</Text>
            <Ionicons name="star" size={32} color={colors.gold} />
            <Text style={styles.ratingValue}>{user.rate.toFixed(1)}</Text>
            <Text style={styles.ratingLink}>Xem chi tiết</Text>
          </Pressable>
        </View>

        <View style={styles.cardColumn}>
          <Text style={styles.cardTitle}>Thống kê đơn thuê</Text>
          <InfoLine label="Tổng thời gian thuê:" value={String(user.totalTimeOrder)} />
          <InfoLine label="Số đơn thuê đã nhận:" value={String(user.numOfOrder)} />
          <InfoLine
            label="Số đơn thuê hoàn thành đúng giờ:"
            value={String(user.numOfFinishOnTime)}
          />
        </View>

        <View style={styles.cardColumn}>
          <Text style={styles.cardTitle}>Doanh thu</Text>
          <View style={styles.revenueRow}>
            <RevenueStat value={statistic.item1} label="Theo ngày" />
            <RevenueStat value={statistic.item2} label="Theo tháng" />
          </View>
        </View>

        <View style={styles.cardColumn}>
          <Text style={styles.cardTitle}>Độ uy tín</Text>
          <InfoLine label="Điểm hành vi:" value={String(user.behaviorPoint.point)} />
          <InfoLine
            label="Điểm hài lòng:"
            value={String(user.behaviorPoint.satisfiedPoint)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CompletionStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.completionItem}>
      <Ionicons name="pie-chart-outline" size={30} color={colors.text} />
      <Text style={styles.completionValue}>{value.toFixed(0)} %</Text>
      <Text style={styles.completionLabel}>{label}</Text>
    </View>
  );
}

function RevenueStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.revenueItem}>
      <Text style={styles.revenueValue}>{formatVnd(value)}</Text>
      <Text style={styles.completionLabel}>{label}</Text>
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
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  completion: {
    flex: 2,
    padding: spacing.md,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  completionItem: { alignItems: 'center', gap: 5 },
  completionValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.success,
  },
  completionLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  rating: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  ratingValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  ratingLink: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.text,
    textDecorationLine: 'underline',
  },
  cardColumn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
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
    color: colors.text,
  },
  infoValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
  },
  revenueItem: { alignItems: 'center', gap: 4 },
  revenueValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.success,
  },
});
