import { PLAYER_LIST_SOURCES, resolvePlayerListSource } from '@/features/discovery/playerListSources';
import { queryKeys } from '@/lib/queryKeys';

const SOURCES = Object.keys(PLAYER_LIST_SOURCES) as (keyof typeof PLAYER_LIST_SOURCES)[];
const context = { userId: 'user-1', topPlayerIds: ['a', 'b', 'c', 'd', 'e'] };

describe('resolvePlayerListSource', () => {
  it('accepts every source the home rails navigate with', () => {
    SOURCES.forEach((source) => {
      expect(resolvePlayerListSource(source)).toBe(source);
    });
  });

  it('refuses anything a hand-edited URL can carry', () => {
    expect(resolvePlayerListSource(undefined)).toBeNull();
    expect(resolvePlayerListSource('')).toBeNull();
    expect(resolvePlayerListSource('all')).toBeNull();
    expect(resolvePlayerListSource('NEW-ACCOUNTS')).toBeNull();
    // Router repeats a parameter as an array; guessing one of them would be a
    // list nobody asked for.
    expect(resolvePlayerListSource(['new-accounts', 'top-rating'])).toBeNull();
  });
});

describe('PLAYER_LIST_SOURCES', () => {
  it('reads each rail from the key the home screen already filled', () => {
    // The list screen shares the home rail's cache entry on purpose. If a key
    // here stops matching queryKeys.home.*, opening "Xem tất cả" quietly becomes
    // a second request for a list that may come back different.
    expect(PLAYER_LIST_SOURCES['new-accounts'].key(context)).toEqual(
      queryKeys.home.newAccounts,
    );
    expect(PLAYER_LIST_SOURCES['same-hobbies'].key(context)).toEqual(
      queryKeys.home.sameHobbies,
    );
    expect(PLAYER_LIST_SOURCES['top-rating'].key(context)).toEqual(
      queryKeys.home.topRating,
    );
    expect(PLAYER_LIST_SOURCES['recent-orders'].key(context)).toEqual(
      queryKeys.home.recentOrders,
    );
    expect(PLAYER_LIST_SOURCES.recommend.key(context)).toEqual(
      queryKeys.home.recommend(context.userId, context.topPlayerIds),
    );
  });

  it('keeps the no-source placeholder out of every real list', () => {
    SOURCES.forEach((source) => {
      expect(PLAYER_LIST_SOURCES[source].key(context)).not.toEqual(queryKeys.home.noSource);
    });
  });

  it('gives each source its own Vietnamese title', () => {
    const titles = SOURCES.map((source) => PLAYER_LIST_SOURCES[source].title);
    expect(new Set(titles).size).toBe(SOURCES.length);
    titles.forEach((title) => {
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title).toBe(title.trim());
    });
  });
});
