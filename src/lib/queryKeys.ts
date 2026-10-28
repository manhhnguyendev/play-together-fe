export const queryKeys = {
  home: {
    newAccounts: ['home', 'new-accounts'] as const,
    sameHobbies: ['home', 'same-hobbies'] as const,
    topRating: ['home', 'top-rating'] as const,
    recentOrders: ['home', 'recent-orders'] as const,
    recommend: (userId: string, playerIds: string[]) =>
      ['home', 'recommend', userId, ...playerIds] as const,
  },
  search: (keyword: string, filters: unknown, pageSize: number) =>
    ['search', keyword, filters, pageSize] as const,
  searchHistory: ['search-history'] as const,
  hotSearch: ['search-history', 'hot'] as const,
  favoriteGames: ['games', 'favorite'] as const,
  mostFavoritedGames: ['games', 'most-favorited'] as const,
  allGames: ['games', 'all'] as const,
  player: (id: string) => ['player', id] as const,
  gamesOfUser: (id: string) => ['users', id, 'games'] as const,
  datings: (id: string) => ['users', id, 'datings'] as const,
  ratings: (userId: string, vote: number, pageSize: number) =>
    ['users', userId, 'ratings', vote, pageSize] as const,
  order: (id: string) => ['order', id] as const,
  orderDetail: (id: string) => ['order', id, 'detail'] as const,
  history: {
    created: (pageSize: number) => ['orders', 'created', pageSize] as const,
    received: (pageSize: number) => ['orders', 'received', pageSize] as const,
  },
  chat: (userId: string) => ['chat', userId] as const,
  gameRanks: (gameId: string) => ['games', gameId, 'ranks'] as const,
  userService: (userId: string) => ['users', userId, 'service'] as const,
  userBalance: (userId: string) => ['users', userId, 'balance'] as const,
  profile: ['users', 'personal'] as const,
  userImages: (userId: string) => ['users', userId, 'images'] as const,
  hobbies: (userId: string) => ['users', userId, 'hobbies'] as const,
  statistic: ['users', 'statistic'] as const,
  unActiveBalances: ['users', 'un-active-balances'] as const,
  transactions: (type: string, operation: string, pageSize: number) =>
    ['users', 'transactions', type, operation, pageSize] as const,
  charities: (search: string, pageSize: number) =>
    ['charities', search, pageSize] as const,
  charity: (id: string) => ['charities', id] as const,
  notifications: (pageSize: number) => ['notifications', pageSize] as const,
  feedbacks: ['feedbacks'] as const,
  feedbackDetail: (id: string) => ['feedbacks', id] as const,
};
