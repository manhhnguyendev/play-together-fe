import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { charityService } from '@/api/services/content';
import {
  AppBar,
  Button,
  ErrorView,
  LoadingView,
  SectionHeader,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

export default function CharityDetailScreen() {
  const router = useAppRouter();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type, isSmall } = useResponsive();
  const params = useLocalSearchParams<{ charityId?: string }>();
  const charityId =
    typeof params.charityId === 'string' ? params.charityId : '';

  const charityQuery = useQuery({
    queryKey: queryKeys.charity(charityId),
    enabled: Boolean(charityId),
    queryFn: async () => (await charityService.getById(charityId)).content,
  });

  const charity = charityQuery.data;
  const logoSize = isSmall ? 104 : 128;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Tổ chức từ thiện" />
      {charityQuery.isLoading ? (
        <LoadingView />
      ) : charityQuery.isError || !charity ? (
        <ErrorView onRetry={() => charityQuery.refetch()} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.column, contentStyle]}>
              <View style={styles.hero}>
                <Image
                  source={{ uri: charity.avatar }}
                  style={[styles.avatar, { width: logoSize, height: logoSize }]}
                  contentFit="cover"
                  transition={140}
                />
                <Text style={[styles.name, type.title2]} numberOfLines={2}>
                  {charity.organizationName}
                </Text>
              </View>

              <View style={styles.card}>
                <SectionHeader title="Giới thiệu" icon="information-circle-outline" />
                <Text style={[styles.description, type.body]}>{charity.information}</Text>
              </View>

              <View style={styles.card}>
                <SectionHeader title="Thông tin liên hệ" icon="call-outline" />
                <ContactBlock label="Địa chỉ:" value={charity.address} />
                <ContactLine label="Điện thoại: " value={charity.phone} />
                <ContactLine label="Email: " value={charity.email} />
              </View>
            </View>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
            <View style={styles.footerInner}>
              <Button
                label="Gửi tiền từ thiện"
                size="lg"
                icon={<Ionicons name="heart" size={18} color={colors.textOnPrimary} />}
                onPress={() => router.push(`/charity-donate/${charity.id}`)}
              />
            </View>
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
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.sm },
  column: { gap: spacing.sm },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  avatar: {
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.textStrong,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
  },
  contactBlock: { gap: 2, marginTop: spacing.xxs },
  contactLine: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xxs,
  },
  contactLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    flexShrink: 0,
  },
  contactValue: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
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
