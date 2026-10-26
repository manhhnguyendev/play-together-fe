import { apiGet, apiPost, apiPut, buildQuery } from '../client';
import { API_URL } from '../endpoints';
import type {
  ApiListResponse,
  ApiResponse,
  DepositModel,
  GameOfUserModel,
  GetAllUserModel,
  ImageModel,
  IsPlayerModel,
  MakeDonateModel,
  MomoCreateModel,
  MomoModel,
  PlayerModel,
  ServiceUserModel,
  StatisticModel,
  UnActiveBalanceModel,
  UserBalanceModel,
  UserModel,
  UserServiceModel,
  UserUpdateModel,
  WithdrawModel,
} from '../types';

export const userService = {
  getProfile: () =>
    apiGet<ApiResponse<UserModel>>(`${API_URL.users}/personal`),

  updateProfile: async (body: UserUpdateModel) => {
    await apiPut(`${API_URL.users}/personal`, body);
  },

  getNewAccounts: () =>
    apiGet<ApiListResponse<GetAllUserModel>>(
      `${API_URL.users}${buildQuery({
        IsNewAccount: true,
        IsPlayer: true,
        PageSize: 5,
      })}`,
    ),

  getSameHobbies: () =>
    apiGet<ApiListResponse<GetAllUserModel>>(
      `${API_URL.users}${buildQuery({
        IsSkillSameHobbies: true,
        IsPlayer: true,
        PageSize: 5,
      })}`,
    ),

  getTopRating: () =>
    apiGet<ApiListResponse<GetAllUserModel>>(
      `${API_URL.users}${buildQuery({ IsOrderByRating: true, PageSize: 5 })}`,
    ),

  getRecentOrders: () =>
    apiGet<ApiListResponse<GetAllUserModel>>(
      `${API_URL.users}${buildQuery({
        IsRecentOrder: true,
        IsPlayer: true,
        PageSize: 5,
      })}`,
    ),

  getUserById: (userId: string) =>
    apiGet<ApiResponse<UserModel>>(`${API_URL.users}/${userId}`),

  getPlayerById: (userId: string) =>
    apiGet<ApiResponse<PlayerModel>>(`${API_URL.users}/${userId}`),

  getPlayerPreviewById: (userId: string) =>
    apiGet<ApiResponse<GetAllUserModel>>(`${API_URL.users}/${userId}`),

  getUserService: (userId: string) =>
    apiGet<ApiResponse<UserServiceModel>>(`${API_URL.users}/service/${userId}`),

  getUserBalance: (userId: string) =>
    apiGet<ApiResponse<UserBalanceModel>>(
      `${API_URL.users}/${userId}/balance`,
    ),

  getStatistic: () =>
    apiGet<ApiResponse<StatisticModel>>(`${API_URL.users}/statistic`),

  getGameOfUser: (userId: string) =>
    apiGet<ApiListResponse<GameOfUserModel>>(
      `${API_URL.users}/${userId}/games${buildQuery({ PageSize: 50 })}`,
    ),

  getImagesOfUser: (userId: string) =>
    apiGet<ApiListResponse<ImageModel>>(`${API_URL.users}/${userId}/images`),

  donate: async (charityId: string, body: MakeDonateModel) => {
    await apiPost(`${API_URL.users}/donates/${charityId}`, body);
  },

  updateIsPlayer: async (body: IsPlayerModel) => {
    await apiPut(`${API_URL.users}/player`, body);
  },

  updateServiceInfo: async (body: ServiceUserModel) => {
    await apiPut(`${API_URL.users}/service`, body);
  },

  releaseUnActiveBalance: async () => {
    await apiPut(`${API_URL.users}/un-active-balance`);
  },

  deposit: async (body: DepositModel) => {
    await apiPost(`${API_URL.users}/deposit`, body);
  },

  withdraw: async (body: WithdrawModel) => {
    await apiPut(`${API_URL.users}/withdraw`, body);
  },

  getMomoLink: (body: MomoCreateModel) =>
    apiPost<ApiResponse<MomoModel>>(API_URL.momo, body),

  getUnActiveBalances: () =>
    apiGet<ApiListResponse<UnActiveBalanceModel>>(
      `${API_URL.users}/un-active-balance${buildQuery({
        IsNew: true,
        isRelease: false,
      })}`,
    ),
};
