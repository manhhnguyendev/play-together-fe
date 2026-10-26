import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { charityService } from '@/api/services/content';
import {
  AppBar,
  Button,
  ErrorView,
  LoadingView,
} from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

export default function CharityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ charityId?: string }>();
  const charityId =
    typeof params.charityId === 'string' ? params.charityId : '';

  const charityQuery = useQuery({
    queryKey: queryKeys.charity(charityId),
    enabled: Boolean(charityId),
    queryFn: async () => (await charityService.getById(charityId)).content,
  });

  const charity = charityQuery.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar title="Tổ chức từ thiện" transparent />
      {charityQuery.isLoading ? (
        <LoadingView />
      ) : charityQuery.isError || !charity ? (
        <ErrorView onRetry={() => charityQuery.refetch()} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Image
                source={{ uri: charity.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text style={styles.name}>{charity.organizationName}</Text>
            </View>

            <Text style={styles.sectionTitle}>Giới thiệu</Text>
            <Text style={styles.description}>{charity.information}</Text>

            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            <ContactBlock label="Địa chỉ:" value={charity.address} />
            <ContactLine label="Điện thoại: " value={charity.phone} />
            <ContactLine label="Email: " value={charity.email} />
          </ScrollView>
          <View style={styles.footer}>
            <Button
              label="Gửi tiền từ thiện"
              size="lg"
              icon={<Ionicons name="heart" size={18} color={colors.white} />}
              onPress={() => router.push(`/charity-donate/${charity.id}`)}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function ContactBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.contactBlock}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
  );
}

function ContactLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.contactLine}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primarySoft,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  contactBlock: { gap: 2, marginTop: spacing.xs },
  contactLine: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xs,
  },
  contactLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  contactValue: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
