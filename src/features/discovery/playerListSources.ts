import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { recommendService } from '@/api/services/content';
import { userService } from '@/api/services/users';
import type { GetAllUserModel } from '@/api/types';
import { queryKeys } from '@/lib/queryKeys';

/**
 * The discovery rails of the home screen, named by what a URL can carry. Each
 * one is also a complete "see all" list screen, so `/player-list?source=…` can
 * rebuild it from the API instead of inheriting whatever the previous screen
 * happened to leave in memory.
 */
export type PlayerListSource =
  | 'new-accounts'
  | 'same-hobbies'
  | 'top-rating'
  | 'recent-orders'
  | 'recommend';

const MIN_RECOMMEND_SCORE = 0;

export interface DiscoveryContext {
  /** Recommendations are personal, so they belong to one cache entry per user. */
  userId: string;
  /** Seeds for `recommend` only — the same five ids the home rail is seeded with. */
  topPlayerIds: string[];
}

interface SourceConfig {
  title: string;
  key: (context: DiscoveryContext) => readonly unknown[];
  fetch: (context: DiscoveryContext) => Promise<GetAllUserModel[]>;
  staleTime?: number;
}

const fromUsersPage = (
  load: () => Promise<{ content: GetAllUserModel[] }>,
) => async () => (await load()).content;

/**
 * One definition per rail, shared by the rail and its list screen: same key,
 * same fetcher. Opening "Xem tất cả" then reads the cache the rail already
 * filled instead of asking the API a second time for a different answer.
 */
export const PLAYER_LIST_SOURCES: Record<PlayerListSource, SourceConfig> = {
  'new-accounts': {
    title: 'Các người chơi mới',
    key: () => queryKeys.home.newAccounts,
    fetch: fromUsersPage(() => userService.getNewAccounts()),
  },
  'same-hobbies': {
    title: 'Có thể bạn sẽ thích',
    key: () => queryKeys.home.sameHobbies,
    fetch: fromUsersPage(() => userService.getSameHobbies()),
  },
  'top-rating': {
    title: 'Top người chơi ưa thích',
    key: () => queryKeys.home.topRating,
    fetch: fromUsersPage(() => userService.getTopRating()),
  },
  'recent-orders': {
    title: 'Thuê lại',
    key: () => queryKeys.home.recentOrders,
    fetch: fromUsersPage(() => userService.getRecentOrders()),
  },
  recommend: {
    title: 'Đề xuất cho bạn',
    key: ({ userId, topPlayerIds }) =>
      queryKeys.home.recommend(userId, topPlayerIds),
    fetch: async ({ topPlayerIds }) => {
      const results = await recommendService.predict(topPlayerIds.length);
      return results
        .filter((item) => Number(item.score) > MIN_RECOMMEND_SCORE)
        .map((item) => item.player);
    },
    staleTime: 5 * 60_000,
  },
};

const SOURCES = Object.keys(PLAYER_LIST_SOURCES) as PlayerListSource[];

/** Expo Router hands query values back as strings, so anything else is no source. */
export const resolvePlayerListSource = (
  value: string | string[] | undefined,
): PlayerListSource | null =>
  typeof value === 'string' && (SOURCES as string[]).includes(value)
    ? (value as PlayerListSource)
    : null;

export function usePlayerListSource(
  source: PlayerListSource | null,
  context: DiscoveryContext,
  options?: { enabled?: boolean },
): UseQueryResult<GetAllUserModel[]> {
  const config = source ? PLAYER_LIST_SOURCES[source] : null;
  return useQuery({
    queryKey: config ? config.key(context) : queryKeys.home.noSource,
    enabled: Boolean(config) && (options?.enabled ?? true),
    staleTime: config?.staleTime,
    queryFn: async () => (config ? config.fetch(context) : []),
  });
}
