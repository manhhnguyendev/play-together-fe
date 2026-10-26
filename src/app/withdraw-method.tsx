import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar } from '@/components/ui';
import { PaymentMethodRow } from '@/components/wallet/PaymentMethodRow';
import { colors } from '@/theme';

export default function WithdrawMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ money?: string }>();
  const money = typeof params.money === 'string' ? params.money : '0';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Phương thức thanh toán" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <PaymentMethodRow
          image={require('../../assets/images/momologo.png')}
          title="Thanh toán qua MOMO"
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
});
