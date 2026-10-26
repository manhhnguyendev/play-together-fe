import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { queryKeys } from '@/api/queryKeys';
import { gameService, hobbyService } from '@/api/services/catalog';
import type { GamesModel } from '@/api/types';
import { Button, ErrorView, LoadingView, useToast } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const LOGO = require('../../../assets/images/play_together_logo_text.png');

export default function TakeCategoriesScreen() {
  const router = useRouter();
  const toast = useToast();
  const signOut = useAuthStore((state) => state.signOut);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const gamesQuery = useQuery({
    queryKey: queryKeys.games,
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
        <Pressable
          hitSlop={10}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>Bạn thích tựa game nào?</Text>
        <Text style={styles.subtitle}>
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
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {games.map((game) => {
            const active = selected.has(game.id);
            return (
              <Pressable
                key={game.id}
                onPress={() => toggle(game)}
                style={({ pressed }) => [
                  styles.item,
                  active && styles.itemActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.icon, active && styles.iconActive]}>
                  <Ionicons
                    name="game-controller-outline"
                    size={18}
                    color={active ? colors.white : colors.primaryDark}
                  />
                </View>
                <Text
                  style={[styles.itemLabel, active && styles.itemLabelActive]}
                  numberOfLines={1}
                >
                  {game.displayName || game.name || game.otherName}
                </Text>
                <View style={[styles.check, active && styles.checkActive]}>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.white}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.counter}>
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
    paddingHorizontal: spacing.md,
  },
  logo: { width: 148, height: 58 },
  logout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  intro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: colors.primary },
  itemLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  itemLabelActive: { color: colors.primaryDark },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  counter: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
