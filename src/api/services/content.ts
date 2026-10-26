import { apiDelete, apiGet, apiPost, apiPut, buildQuery } from '../client';
import { API_URL } from '../endpoints';
import type {
  AddImageModel,
  ApiListResponse,
  ApiResponse,
  CharityModel,
  ChatModel,
  CreateFeedBacksModel,
  GetAllUserModel,
  ImageModel,
  NotificationModel,
  RatingCreateModel,
  RatingModel,
  ReportCommentModel,
  ReportCreateModel,
  ResultRecommendModel,
  RecommendModel,
  SearchHistoryModel,
  SendMessageModel,
  SystemFeedbackDetailModel,
  SystemFeedbackModel,
  TransactionModel,
} from '../types';

export const charityService = {
  getAll: (pageSize: number) =>
    apiGet<ApiListResponse<CharityModel>>(
      `${API_URL.charities}${buildQuery({ IsActive: true, PageSize: pageSize })}`,
    ),

  getById: (id: string) =>
    apiGet<ApiResponse<CharityModel>>(`${API_URL.charities}/${id}`),

  search: (name: string) =>
    apiGet<ApiListResponse<CharityModel>>(
      `${API_URL.charities}${buildQuery({ Name: name, IsActive: true })}`,
    ),
};

export const notificationService = {
  getAll: (pageSize: number) =>
    apiGet<ApiListResponse<NotificationModel>>(
      `${API_URL.notification}/${buildQuery({ IsNew: true, PageSize: pageSize })}`,
    ),

  getById: (id: string) =>
    apiGet<ApiResponse<NotificationModel>>(`${API_URL.notification}/${id}`),
};

export const chatService = {
  getAll: (receiveId: string) =>
    apiGet<ApiListResponse<ChatModel>>(`${API_URL.chat}/${receiveId}`),

  send: async (receiveId: string, body: SendMessageModel) => {
    await apiPost(`${API_URL.chat}/${receiveId}`, body);
  },
};

export const ratingService = {
  create: async (orderId: string, body: RatingCreateModel) => {
    await apiPost(`${API_URL.ratings}/${orderId}`, body);
  },

  reportComment: async (rateId: string, body: ReportCommentModel) => {
    await apiPut(`${API_URL.ratings}/violate/${rateId}`, body);
  },

  getAll: (userId: string, vote: number, pageSize: number) =>
    apiGet<ApiListResponse<RatingModel>>(
      `${API_URL.users}/${userId}/ratings${buildQuery({
        Vote: vote,
        IsNew: true,
        PageSize: pageSize,
      })}`,
    ),
};

export const reportService = {
  create: async (orderId: string, body: ReportCreateModel) => {
    await apiPost(`${API_URL.reports}/${orderId}`, body);
  },
};

export const searchService = {
  searchUser: (search: string, pageSize: number) =>
    apiGet<ApiListResponse<GetAllUserModel>>(
      `${API_URL.users}${buildQuery({
        Search: search,
        IsPlayer: true,
        PageSize: pageSize,
      })}`,
    ),

  searchUserByFilter: (
    search: string,
    filter: {
      isMale: boolean;
      isFemale: boolean;
      gameId: string;
      status: string;
      sortByAlphabet: boolean;
      sortByRating: boolean;
      sortByHobby: boolean;
      sortByPrice: boolean;
      startPrice: number;
      endPrice: number;
    },
  ) => {
    const gender =
      filter.isMale && !filter.isFemale
        ? 'true'
        : !filter.isMale && filter.isFemale
          ? 'false'
          : '';
    return apiGet<ApiListResponse<GetAllUserModel>>(
      `${API_URL.users}${buildQuery({
        Search: search,
        Gender: gender,
        GameId: filter.gameId,
        Status: filter.status,
        IsOrderByName: filter.sortByAlphabet,
        IsOrderByRating: filter.sortByRating,
        IsOrderByPricing: filter.sortByPrice,
        IsSkillSameHobbies: filter.sortByHobby,
        IsPlayer: true,
        FromPrice: filter.startPrice,
        ToPrice: filter.endPrice,
      })}`,
    );
  },
};

export const searchHistoryService = {
  getAll: () =>
    apiGet<ApiListResponse<SearchHistoryModel>>(
      `${API_URL.searchHistories}${buildQuery({ IsNew: true, PageSize: 5 })}`,
    ),

  getHot: () =>
    apiGet<ApiListResponse<SearchHistoryModel>>(
      `${API_URL.searchHistories}${buildQuery({
        IsHotSearch: true,
        PageSize: 5,
      })}`,
    ),
};

export const transactionService = {
  getAll: (type: string, operation: string, pageSize: number) =>
    apiGet<ApiListResponse<TransactionModel>>(
      `${API_URL.users}/transactions${buildQuery({
        IsNew: true,
        Type: type,
        Operation: operation,
        PageSize: pageSize,
      })}`,
    ),
};

export const feedbackService = {
  getAll: () =>
    apiGet<ApiListResponse<SystemFeedbackModel>>(
      `${API_URL.feedback}${buildQuery({ IsNew: true, GetAll: true })}`,
    ),

  getDetail: (feedbackId: string) =>
    apiGet<ApiResponse<SystemFeedbackDetailModel>>(
      `${API_URL.feedback}/${feedbackId}`,
    ),

  create: async (body: CreateFeedBacksModel) => {
    await apiPost(API_URL.feedback, body);
  },
};

export const recommendService = {
  predict: (body: RecommendModel[]) =>
    apiPost<ResultRecommendModel[]>(API_URL.recommend, body),
};

export const imageService = {
  addMulti: async (images: AddImageModel[]) => {
    await apiPost(`${API_URL.images}/multi-images`, images);
  },

  add: (body: AddImageModel) =>
    apiPost<ApiResponse<ImageModel>>(API_URL.images, body),

  remove: async (imageId: string) => {
    await apiDelete(`${API_URL.images}/${imageId}`);
  },
};
