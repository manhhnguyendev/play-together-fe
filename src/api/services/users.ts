import { apiGet, apiPatch, apiPost, buildQuery } from '../client';
import { API_URL } from '../endpoints';
import type {
  DepositModel,
  IsPlayerModel,
  MakeDonateModel,
  MomoCreateModel,
  ServiceUserModel,
  WithdrawModel,
} from '../types';
import {
  legacyArray,
  legacyList,
  legacyResponse,
  toLegacyGameOfUser,
  toLegacyMomo,
  toLegacyPlayer,
  toLegacyUnActiveBalance,
  toLegacyUserBalance,
  toLegacyUserProfile,
  toLegacyUserService,
  toLegacyUserSummary,
} from '../v2/mappers';
import type {
  EarningsSummary,
  OrderView,
  Paginated,
  RecommendationView,
  ReleasePendingCreditsResult,
  UserProfile,
  UserSummary,
  WalletSummary,
} from '../v2/types';

const toDateOnly = (value: string): string => value.slice(0, 10);

const fetchPlayers = async (
  query: Record<string, string | number | boolean | undefined>,
) =>
  legacyList(
    await apiGet<Paginated<UserSummary>>(
      `${API_URL.users}${buildQuery(query)}`,
    ),
    toLegacyUserSummary,
  );

export const userService = {
  getProfile: async () => {
    const [profile, wallet] = await Promise.all([
      apiGet<UserProfile>(`${API_URL.users}/me`),
      apiGet<WalletSummary>(API_URL.wallet),
    ]);
    return legacyResponse(toLegacyUserProfile(profile, wallet));
  },

  updateProfile: async (body: {
    name: string;
    dateOfBirth: string;
    city: string;
    gender: boolean;
    avatar: string;
    description: string;
  }) => {
    await apiPatch<UserSummary>(`${API_URL.users}/me`, {
      name: body.name,
      ...(body.dateOfBirth ? { dateOfBirth: toDateOnly(body.dateOfBirth) } : {}),
      city: body.city,
      gender: body.gender ? 'MALE' : 'FEMALE',
      ...(body.avatar ? { avatarUrl: body.avatar } : {}),
      bio: body.description,
    });
  },

  getNewAccounts: () => fetchPlayers({ sort: 'newest', pageSize: 5 }),

  getSameHobbies: async () => {
    const recommendations = await apiGet<RecommendationView[]>(
      `${API_URL.recommendations}/players${buildQuery({ limit: 5 })}`,
    );
    return legacyArray(recommendations, (item) =>
      toLegacyUserSummary(item.user),
    );
  },

  getTopRating: () => fetchPlayers({ sort: 'rating', pageSize: 5 }),

  getRecentOrders: async () => {
    const page = await apiGet<Paginated<OrderView>>(
      `${API_URL.orders}${buildQuery({ pageSize: 20 })}`,
    );
    const seen = new Set<string>();
    const players = page.items
      .map((order) => order.player)
      .filter((player) => {
        if (seen.has(player.id)) return false;
        seen.add(player.id);
        return true;
      })
      .slice(0, 5);

    return legacyArray(players, toLegacyUserSummary);
  },

  getUserById: async (userId: string) =>
    legacyResponse(
      toLegacyUserProfile(await apiGet<UserProfile>(`${API_URL.users}/${userId}`)),
    ),

  getPlayerById: async (userId: string) =>
    legacyResponse(
      toLegacyPlayer(await apiGet<UserProfile>(`${API_URL.users}/${userId}`)),
    ),

  getUserService: async (userId: string) =>
    legacyResponse(
      toLegacyUserService(await apiGet<UserProfile>(`${API_URL.users}/${userId}`)),
    ),

  getUserBalance: async (userId: string) => {
    void userId;
    const wallet = await apiGet<WalletSummary>(API_URL.wallet);
    return legacyResponse(toLegacyUserBalance(wallet));
  },

  getStatistic: async () => {
    const [profile, earnings] = await Promise.all([
      apiGet<UserProfile>(`${API_URL.users}/me`),
      apiGet<EarningsSummary>(`${API_URL.wallet}/earnings/summary`),
    ]);

    const completion = profile.ordersCount
      ? Math.round((profile.completedOrdersCount / profile.ordersCount) * 100)
      : 0;

    return legacyResponse({
      item1: earnings.today,
      item2: earnings.thisMonth,
      item3: completion,
      item4: completion,
    });
  },

  getGameOfUser: async (userId: string) => {
    const profile = await apiGet<UserProfile>(`${API_URL.users}/${userId}`);
    return legacyArray(profile.skills, toLegacyGameOfUser);
  },

  getImagesOfUser: async (userId: string) => {
    const profile = await apiGet<UserProfile>(`${API_URL.users}/${userId}`);
    return legacyArray(profile.images, (image) => ({
      id: image.id,
      imageLink: image.url,
    }));
  },

  donate: async (charityId: string, body: MakeDonateModel) => {
    await apiPost(`${API_URL.charities}/${charityId}/donations`, {
      amount: body.money,
      message: body.message,
    });
  },

  updateIsPlayer: async (body: IsPlayerModel) => {
    await apiPatch(`${API_URL.users}/me/player-mode`, {
      enabled: body.isPlayer,
    });
  },

  updateServiceInfo: async (body: ServiceUserModel) => {
    const profile = await apiGet<UserProfile>(`${API_URL.users}/me`);
    await apiPatch(`${API_URL.users}/me/player-mode`, {
      enabled: profile.isPlayer,
      pricePerHour: body.pricePerHour,
      maxHoursPerHire: body.maxHourHire,
    });
  },

  releaseUnActiveBalance: async () => {
    const result = await apiPost<ReleasePendingCreditsResult>(
      `${API_URL.wallet}/pending-credits/release`,
    );
    return result.released;
  },

  deposit: async (body: DepositModel) => {
    await apiPost(`${API_URL.wallet}/deposits`, { amount: body.money });
  },

  withdraw: async (body: WithdrawModel) => {
    await apiPost(`${API_URL.wallet}/withdrawals`, {
      amount: body.moneyWithdraw,
      note: body.phoneNumberMomo,
    });
  },

  getMomoLink: async (body: MomoCreateModel) => {
    const deposit = await apiPost<{
      id: string;
      amount: number;
      paymentUrl: string;
    }>(`${API_URL.wallet}/deposits`, { amount: body.amount });
    return legacyResponse(toLegacyMomo(deposit));
  },

  getUnActiveBalances: async () => {
    const wallet = await apiGet<WalletSummary>(API_URL.wallet);
    return legacyArray(wallet.pendingCredits, toLegacyUnActiveBalance);
  },
};
