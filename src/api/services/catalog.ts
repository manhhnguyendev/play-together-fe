import { apiDelete, apiGet, apiPatch, apiPost } from '../client';
import { API_URL } from '../endpoints';
import type {
  CreateGameOfUserModel,
  CreateHobbiesModel,
  CreateOnlineHourModel,
  DeleteHobbiesModel,
  UpdateGameOfUserModel,
  UpdateOnlineHourModel,
} from '../types';
import {
  legacyArray,
  legacyList,
  toLegacyGame,
  toLegacyHobby,
  toLegacyOnlineHour,
  toLegacyRank,
} from '../v2/mappers';
import type {
  AvailabilityWindow,
  FavoriteGameItem,
  GameView,
  MostFavoritedGame,
  Paginated,
  RankView,
  UserProfile,
} from '../v2/types';

const toWireDay = (dayInWeek: number): number =>
  dayInWeek === 8 ? 7 : dayInWeek - 1;

export const gameService = {
  getAll: async () =>
    legacyList(
      await apiGet<Paginated<GameView>>(
        `${API_URL.games}?pageSize=100`,
      ),
      toLegacyGame,
    ),

  getMostFavorite: async () =>
    legacyArray(
      await apiGet<MostFavoritedGame[]>(
        `${API_URL.games}/most-favorited?limit=8`,
      ),
      (game) =>
        toLegacyGame({
          id: game.id,
          name: game.name,
          displayName: game.displayName,
          otherNames: null,
        }),
    ),

  getFavorites: async () =>
    legacyArray(
      await apiGet<FavoriteGameItem[]>(`${API_URL.users}/me/favorites`),
      (game) =>
        toLegacyGame({
          id: game.id,
          name: game.name,
          displayName: game.displayName,
          otherNames: null,
        }),
    ),

  addFavorite: async (gameId: string) => {
    await apiPost<void>(`${API_URL.users}/me/favorites`, { gameId });
  },

  removeFavorite: async (gameId: string) => {
    await apiDelete<void>(`${API_URL.users}/me/favorites/${gameId}`);
  },

  getAllRanks: async (gameId: string) =>
    legacyArray(
      await apiGet<RankView[]>(`${API_URL.games}/${gameId}/ranks`),
      toLegacyRank,
    ),
};

export const hobbyService = {
  getOfUser: async (userId: string) => {
    const profile = await apiGet<UserProfile>(`${API_URL.users}/${userId}`);
    return legacyArray(profile.hobbies, (hobby) =>
      toLegacyHobby(hobby, profile),
    );
  },

  create: async (items: CreateHobbiesModel[]) => {
    await Promise.all(
      items.map((item) =>
        apiPost<void>(`${API_URL.users}/me/hobbies`, { gameId: item.gameId }),
      ),
    );
  },

  remove: async (items: DeleteHobbiesModel[]) => {
    await Promise.all(
      items.map((item) =>
        apiDelete<void>(`${API_URL.users}/me/hobbies/${item.hobbyId}`),
      ),
    );
  },
};

export const gameOfUserService = {
  update: async (gameOfUserId: string, body: UpdateGameOfUserModel) => {
    await apiPatch<void>(`${API_URL.users}/me/skills/${gameOfUserId}`, {
      ...(body.rankId && body.rankId !== 'None'
        ? { rankId: body.rankId }
        : {}),
    });
  },

  remove: async (gameOfUserId: string) => {
    await apiDelete<void>(`${API_URL.users}/me/skills/${gameOfUserId}`);
  },

  create: async (items: CreateGameOfUserModel[]) => {
    await Promise.all(
      items.map((item) =>
        apiPost<void>(`${API_URL.users}/me/skills`, {
          gameId: item.gameId,
          ...(item.rankId && item.rankId !== 'None'
            ? { rankId: item.rankId }
            : {}),
        }),
      ),
    );
  },
};

export const datingService = {
  getAll: async (userId: string) => {
    const profile = await apiGet<UserProfile>(`${API_URL.users}/${userId}`);
    return legacyArray(profile.availability, toLegacyOnlineHour);
  },

  create: async (body: CreateOnlineHourModel) => {
    await apiPost<void>(`${API_URL.users}/me/availability`, {
      dayOfWeek: toWireDay(body.dayInWeek),
      startMinute: body.fromHour,
      endMinute: body.toHour,
    });
  },

  update: async (datingId: string, body: UpdateOnlineHourModel) => {
    await apiPatch<AvailabilityWindow>(
      `${API_URL.users}/me/availability/${datingId}`,
      {
        startMinute: body.fromHour,
        endMinute: body.toHour,
      },
    );
  },

  remove: async (id: string) => {
    await apiDelete<void>(`${API_URL.users}/me/availability/${id}`);
  },
};
