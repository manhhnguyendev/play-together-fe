import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar } from '@/components/ui';
import { PaymentMethodRow } from '@/components/wallet/PaymentMethodRow';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing } from '@/theme';

export default function WithdrawMethodScreen() {
  const router = useAppRouter();
  const { gutter, contentStyle } = useResponsive();
  const params = useLocalSearchParams<{ money?: string }>();
  const money = typeof params.money === 'string' ? params.money : '0';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Phương thức thanh toán" />
      <ScrollView
        style={contentStyle}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <PaymentMethodRow
            image={require('../../assets/images/momologo.png')}
            title="Thanh toán qua MoMo"
            onPress={() =>
              router.push({ pathname: '/withdraw', params: { money } })
            }
          />
          <PaymentMethodRow
            image={require('../../assets/images/paypallogo.png')}
            title="Thanh toán qua Paypal"
            subtitle="(Sắp ra mắt)"
          />
          <PaymentMethodRow
            image={require('../../assets/images/onlinebankinglogo.png')}
            title="Thanh toán Internet banking"
            subtitle="(Sắp ra mắt)"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
