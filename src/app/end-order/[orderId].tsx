import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { OrderParties } from '@/components/orders/OrderParties';
import { AppBar, Button, ErrorView, LoadingView } from '@/components/ui';
import {
  endOrderStatusLabel,
  orderGameNames,
  orderHirerFinalPrice,
  orderStatusColor,
} from '@/features/orders/status';
import {
  formatDateTimeAmPm,
  formatVnd,
  isEmptyDate,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function EndOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
  });

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Chi tiết thuê" />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !orderQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Chi tiết thuê" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;
  const isHirer = order.userId === currentUser?.id;
  const isPlayer = order.toUserId === currentUser?.id;
  const left = isHirer ? order.user : order.toUser;
  const right = isHirer ? order.toUser : order.user;
  const games = orderGameNames(order);
  const hasStarted = !isEmptyDate(order.timeStart);

  const finish = () => {
    if (isHirer) {
      router.replace({
        pathname: '/rating/[orderId]',
        params: { orderId: order.id },
      });
    } else if (isPlayer) {
      router.replace('/(tabs)/history');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title="Chi tiết thuê"
        right={
          <Pressable
            hitSlop={10}
            onPress={() =>
              router.push({
                pathname: '/report/[orderId]',
                params: { orderId: order.id },
              })
            }
            style={({ pressed }) => [styles.reportButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="warning-outline" size={22} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.status, { color: orderStatusColor(order.status) }]}
        >
          {endOrderStatusLabel(order.status)}
        </Text>

        <OrderParties left={left} right={right} />

        <View style={styles.rows}>
          <Row label="Thời lượng thuê:" value={`${order.totalTimes} giờ`} />
          {isHirer ? (
            <>
              <Row
                label="Chi phí dự kiến:"
                value={formatVnd(order.totalPrices)}
              />
              <Row
                label="Chi phí cuối cùng:"
                value={formatVnd(orderHirerFinalPrice(order))}
                emphasis
              />
            </>
          ) : null}
          {isPlayer ? (
            <>
              <Row
                label="Số tiền dự kiến:"
                value={formatVnd(order.totalPrices)}
              />
              <Row
                label="Số tiền nhận được:"
                value={formatVnd(order.finalPrices)}
                emphasis
              />
            </>
          ) : null}
          {hasStarted ? (
            <>
              <Row
                label="Thời gian bắt đầu:"
                value={formatDateTimeAmPm(order.timeStart)}
              />
              <Row
                label="Thời gian kết thúc:"
                value={formatDateTimeAmPm(order.timeFinish)}
              />
            </>
          ) : (
            <Row
              label="Thời gian:"
              value={formatDateTimeAmPm(order.processExpired)}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tựa game đã chọn:</Text>
          {games.map((name, index) => (
            <Text key={`${name}-${index}`} style={styles.bullet}>
              • {name}
            </Text>
          ))}
        </View>

        {order.reason && order.reason.trim().length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lý do kết thúc sớm:</Text>
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>{order.reason}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {isHirer || isPlayer ? (
        <View style={styles.footer}>
          <Button label="Kết thúc" onPress={finish} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, emphasis && styles.rowEmphasis]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl },
  reportButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 16,
    paddingTop: spacing.md,
  },
  rows: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 8,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  rowValue: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  rowEmphasis: {
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    fontSize: 15,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  bullet: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingLeft: spacing.xs,
  },
  reasonBox: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xxs,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
