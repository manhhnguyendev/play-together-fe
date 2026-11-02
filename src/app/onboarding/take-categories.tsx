import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { gameService, hobbyService } from '@/api/services/catalog';
import type { GamesModel } from '@/api/types';
import { Button, ErrorView, LoadingView, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import {
  colors,
  control,
  fonts,
  hitSlop,
  radius,
  spacing,
  touchTarget,
} from '@/theme';

const LOGO = require('../../../assets/images/logo_v2_text.png');

export default function TakeCategoriesScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, itemWidth, type } = useResponsive();
  const signOut = useAuthStore((state) => state.signOut);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const gamesQuery = useQuery({
    queryKey: queryKeys.allGames,
    queryFn: () => gameService.getAll(),
  });

  const games = gamesQuery.data?.content ?? [];

  const toggle = (game: GamesModel) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(game.id)) next.delete(game.id);
      else next.add(game.id);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) {
      toast.show('Vui lòng chọn ít nhất 1 tựa game', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await hobbyService.create(
        Array.from(selected).map((gameId) => ({ gameId })),
      );
      toast.show('Đã lưu sở thích của bạn', 'success');
      router.replace('/(tabs)/home');
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Không thể lưu sở thích',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const chip = itemWidth(150, spacing.sm);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: gutter }]}>
        <Image
          source={LOGO}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Play Together"
        />
        <Pressable
          hitSlop={hitSlop.md}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View
        style={[
          styles.intro,
          contentStyle,
          { paddingHorizontal: gutter },
        ]}
      >
        <Text style={[styles.title, type.title1]}>Bạn thích tựa game nào?</Text>
        <Text style={[styles.subtitle, type.body]}>
          Chọn ít nhất 1 tựa game để chúng tôi gợi ý những người chơi phù hợp
          với bạn.
        </Text>
      </View>

      {gamesQuery.isLoading ? (
        <LoadingView label="Đang tải danh sách game..." />
      ) : gamesQuery.isError ? (
        <ErrorView
          message="Không tải được danh sách game."
          onRetry={() => void gamesQuery.refetch()}
        />
      ) : (
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: gutter, paddingBottom: spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {games.map((game) => {
            const active = selected.has(game.id);
            const label = game.displayName || game.name || game.otherName;
            return (
              <Pressable
                key={game.id}
                onPress={() => toggle(game)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label ?? 'Tựa game'}
                style={[styles.chip, { width: chip }, active && styles.chipActive]}
              >
                <View style={[styles.icon, active && styles.iconActive]}>
                  <Ionicons
                    name="game-controller-outline"
                    size={18}
                    color={active ? colors.textOnPrimary : colors.primaryAction}
                  />
                </View>
                <Text
                  style={[styles.chipLabel, active && styles.chipLabelActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primaryAction}
                  />
                ) : null}
              </Pressable>
            );
          })}
          {games.length === 0 ? (
            <Text style={styles.empty}>Chưa có tựa game nào.</Text>
          ) : null}
        </ScrollView>
      )}

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.sm },
        ]}
      >
        <View style={[styles.footerInner, contentStyle]}>
          <Text style={[styles.counter, type.bodySmall]}>
            Đã chọn {selected.size} tựa game
          </Text>
          <Button
            label="HOÀN TẤT"
            size="lg"
            loading={submitting}
            disabled={games.length === 0}
            onPress={submit}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  logo: {
    width: 62,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.plaque,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  logout: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  intro: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textStrong,
  },
  subtitle: {
    marginTop: spacing.xxs,
    color: colors.textMuted,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: control.buttonSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: colors.primaryFill },
  chipLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  chipLabelActive: { color: colors.primaryInk },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    paddingTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: {
    gap: spacing.xs,
  },
  counter: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
