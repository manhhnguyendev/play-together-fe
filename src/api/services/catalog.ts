import { apiDelete, apiGet, apiPost, apiPut, buildQuery } from '../client';
import { API_URL } from '../endpoints';
import type {
  ApiListResponse,
  ApiResponse,
  CreateGameOfUserModel,
  CreateHobbiesModel,
  CreateOnlineHourModel,
  DeleteHobbiesModel,
  GamesModel,
  HobbiesModel,
  OnlineHourModel,
  RankModel,
  UpdateGameOfUserModel,
  UpdateOnlineHourModel,
} from '../types';

export const gameService = {
  getAll: () =>
    apiGet<ApiListResponse<GamesModel>>(
      `${API_URL.games}${buildQuery({ PageSize: 50 })}`,
    ),

  getMostFavorite: () =>
    apiGet<ApiListResponse<GamesModel>>(
      `${API_URL.games}${buildQuery({ IsMostFavorite: true, PageSize: 8 })}`,
    ),

  getAllRanks: (gameId: string) =>
    apiGet<ApiListResponse<RankModel>>(
      `${API_URL.games}/${gameId}/ranks${buildQuery({ PageSize: 100 })}`,
    ),
};

export const rankService = {
  getById: (rankId: string) =>
    apiGet<ApiResponse<RankModel>>(`${API_URL.ranks}/${rankId}`),
};

export const hobbyService = {
  getOfUser: (userId: string) =>
    apiGet<ApiListResponse<HobbiesModel>>(
      `${API_URL.users}/${userId}/hobbies`,
    ),

  create: async (items: CreateHobbiesModel[]) => {
    await apiPost(API_URL.hobbies, items);
  },

  remove: async (items: DeleteHobbiesModel[]) => {
    await apiDelete(API_URL.hobbies, items);
  },
};

export const gameOfUserService = {
  update: async (gameOfUserId: string, body: UpdateGameOfUserModel) => {
    await apiPut(`${API_URL.gameOfUser}/${gameOfUserId}`, body);
  },

  remove: async (gameOfUserId: string) => {
    await apiDelete(`${API_URL.gameOfUser}/${gameOfUserId}`);
  },

  create: async (items: CreateGameOfUserModel[]) => {
    await apiPost(`${API_URL.gameOfUser}/multi-games`, items);
  },
};

export const datingService = {
  getAll: (userId: string) =>
    apiGet<ApiListResponse<OnlineHourModel>>(
      `${API_URL.users}/${userId}/datings${buildQuery({
        PageSize: 100,
        SortByDay: true,
      })}`,
    ),

  create: async (body: CreateOnlineHourModel) => {
    await apiPost(API_URL.dating, body);
  },

  update: async (datingId: string, body: UpdateOnlineHourModel) => {
    await apiPut(`${API_URL.dating}/${datingId}`, body);
  },

  remove: async (id: string) => {
    await apiDelete(`${API_URL.dating}/${id}`);
  },
};
