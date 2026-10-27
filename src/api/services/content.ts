import {
  ApiError,
  apiDelete,
  apiGet,
  apiPost,
  buildQuery,
} from '../client';
import { API_URL } from '../endpoints';
import type {
  AddImageModel,
  CreateFeedBacksModel,
  RatingCreateModel,
  ReportCommentModel,
  ReportCreateModel,
  ResultRecommendModel,
  SendMessageModel,
} from '../types';
import {
  legacyArray,
  legacyList,
  legacyResponse,
  toLegacyCharity,
  toLegacyChat,
  toLegacyFeedback,
  toLegacyFeedbackDetail,
  toLegacyNotification,
  toLegacyRating,
  toLegacyRecommendation,
  toLegacySearchHistory,
  toLegacyTransaction,
  toLegacyUserSummary,
  toWireFeedbackType,
} from '../v2/mappers';
import type {
  CharityView,
  ChatMessageView,
  Gender,
  HotSearchItem,
  LedgerEntry,
  LedgerType,
  MyFeedbackView,
  NotificationView,
  Paginated,
  PlayerSearchQuery,
  RatingView,
  RecommendationView,
  SearchHistoryItem,
  UserSummary,
} from '../v2/types';

const recordSearch = (query: string) => {
  if (!query) return;
  void apiPost<void>(`${API_URL.searchHistory}`, { query }).catch(
    () => undefined,
  );
};

const TRANSACTION_FILTERS: Record<string, LedgerType> = {
  'Order|Add': 'ORDER_EARNING',
  'Order|Sub': 'ESCROW_HOLD',
  'Deposit|': 'DEPOSIT',
  'Withdraw|': 'WITHDRAWAL',
  'Donate|': 'DONATION',
};

const SEARCH_STATUS: Record<string, 'ONLINE' | 'OFFLINE' | undefined> = {
  Online: 'ONLINE',
  Offline: 'OFFLINE',
};

const searchPlayers = async (query: PlayerSearchQuery) =>
  legacyList(
    await apiGet<Paginated<UserSummary>>(
      `${API_URL.users}${buildQuery({
        ...query,
        genders: query.genders?.join(','),
      })}`,
    ),
    toLegacyUserSummary,
  );

export const charityService = {
  getAll: async (pageSize: number) =>
    legacyList(
      await apiGet<Paginated<CharityView>>(
        `${API_URL.charities}${buildQuery({ pageSize })}`,
      ),
      toLegacyCharity,
    ),

  getById: async (id: string) =>
    legacyResponse(
      toLegacyCharity(await apiGet<CharityView>(`${API_URL.charities}/${id}`)),
    ),

  search: async (name: string) =>
    legacyList(
      await apiGet<Paginated<CharityView>>(
        `${API_URL.charities}${buildQuery({ q: name, pageSize: 20 })}`,
      ),
      toLegacyCharity,
    ),
};

export const notificationService = {
  getAll: async (pageSize: number) =>
    legacyList(
      await apiGet<Paginated<NotificationView>>(
        `${API_URL.notifications}${buildQuery({ pageSize })}`,
      ),
      toLegacyNotification,
    ),

  getById: async (id: string) => {
    const page = await apiGet<Paginated<NotificationView>>(
      `${API_URL.notifications}${buildQuery({ pageSize: 100 })}`,
    );
    const notification = page.items.find((item) => item.id === id);
    if (!notification) {
      throw new ApiError('Không tìm thấy thông báo', 404);
    }
    return legacyResponse(toLegacyNotification(notification));
  },
};

export const chatService = {
  getAll: async (receiveId: string) => {
    const page = await apiGet<Paginated<ChatMessageView>>(
      `${API_URL.chats}/${receiveId}${buildQuery({ pageSize: 100 })}`,
    );
    return legacyArray([...page.items].reverse(), toLegacyChat);
  },

  send: async (receiveId: string, body: SendMessageModel) => {
    await apiPost<ChatMessageView>(
      `${API_URL.chats}/${receiveId}/messages`,
      body,
    );
  },
};

export const ratingService = {
  create: async (orderId: string, body: RatingCreateModel) => {
    await apiPost(`${API_URL.orders}/${orderId}/ratings`, body);
  },

  reportComment: async (rateId: string, body: ReportCommentModel) => {
    await apiPost(`${API_URL.ratings}/${rateId}/flag`, body);
  },

  getAll: async (userId: string, vote: number, pageSize: number) =>
    legacyList(
      await apiGet<Paginated<RatingView>>(
        `${API_URL.users}/${userId}/ratings${buildQuery({
          rate: vote || undefined,
          sort: 'newest',
          pageSize,
        })}`,
      ),
      toLegacyRating,
    ),
};

export const reportService = {
  create: async (orderId: string, body: ReportCreateModel) => {
    await apiPost(`${API_URL.orders}/${orderId}/reports`, {
      message: body.reportMessage,
    });
  },
};

export const searchService = {
  searchUser: (search: string, pageSize: number) => {
    recordSearch(search.trim());
    return searchPlayers({ q: search, sort: 'ranking', pageSize });
  },

  searchUserByFilter: (
    search: string,
    filter: {
      isMale: boolean;
      isFemale: boolean;
      gameId: string;
      initial: string;
      status: string;
      sortByAlphabet: boolean;
      sortByRating: boolean;
      sortByHobby: boolean;
      sortByPrice: boolean;
      startPrice: number;
      endPrice: number;
    },
  ) => {
    recordSearch(search.trim());
    const gameId = filter.gameId.split(' ')[0];
    const genders: Gender[] | undefined =
      filter.isMale === filter.isFemale
        ? undefined
        : [filter.isMale ? 'MALE' : 'FEMALE'];

    return searchPlayers({
      q: search,
      gameId: gameId && !filter.sortByHobby ? gameId : undefined,
      hobbyId: gameId && filter.sortByHobby ? gameId : undefined,
      genders,
      initial: filter.initial || undefined,
      status: SEARCH_STATUS[filter.status],
      minPrice: filter.startPrice,
      maxPrice: filter.endPrice,
      sort: filter.sortByAlphabet
        ? 'name'
        : filter.sortByRating
          ? 'rating'
          : filter.sortByPrice
            ? 'price_asc'
            : 'ranking',
      pageSize: 20,
    });
  },
};

export const searchHistoryService = {
  getAll: async () =>
    legacyArray(
      await apiGet<SearchHistoryItem[]>(
        `${API_URL.searchHistory}${buildQuery({ limit: 5 })}`,
      ),
      toLegacySearchHistory,
    ),

  getHot: async () => {
    const items = await apiGet<HotSearchItem[]>(
      `${API_URL.searchHistory}/hot${buildQuery({ limit: 10 })}`,
    );
    return legacyArray(items, (item) => ({
      id: item.query,
      searchString: item.query,
    }));
  },
};

export const transactionService = {
  getAll: async (type: string, operation: string, pageSize: number) =>
    legacyList(
      await apiGet<Paginated<LedgerEntry>>(
        `${API_URL.wallet}/transactions${buildQuery({
          type: TRANSACTION_FILTERS[`${type}|${operation}`],
          pageSize,
        })}`,
      ),
      toLegacyTransaction,
    ),
};

export const feedbackService = {
  getAll: async () =>
    legacyList(
      await apiGet<Paginated<MyFeedbackView>>(
        `${API_URL.feedback}/mine${buildQuery({ pageSize: 100 })}`,
      ),
      toLegacyFeedback,
    ),

  getDetail: async (feedbackId: string) =>
    legacyResponse(
      toLegacyFeedbackDetail(
        await apiGet<MyFeedbackView>(`${API_URL.feedback}/${feedbackId}`),
      ),
    ),

  create: async (body: CreateFeedBacksModel) => {
    await apiPost(`${API_URL.feedback}`, {
      title: body.title,
      message: body.message,
      type: toWireFeedbackType(body.typeOfFeedback),
    });
  },
};

export const recommendService = {
  predict: async (body: { userId: string; playerId: string }[]) => {
    const recommendations = await apiGet<RecommendationView[]>(
      `${API_URL.recommendations}/players${buildQuery({
        limit: Math.min(Math.max(body.length, 1), 50),
      })}`,
    );
    return recommendations.map<ResultRecommendModel>(toLegacyRecommendation);
  },
};

export const imageService = {
  addMulti: async (images: AddImageModel[]) => {
    await Promise.all(
      images.map((image) =>
        apiPost(`${API_URL.users}/me/images`, { url: image.imageLink }),
      ),
    );
  },

  add: async (body: AddImageModel) => {
    const image = await apiPost<{ id: string; url: string }>(
      `${API_URL.users}/me/images`,
      { url: body.imageLink },
    );
    return legacyResponse({ id: image.id, imageLink: image.url });
  },

  remove: async (imageId: string) => {
    await apiDelete(`${API_URL.users}/me/images/${imageId}`);
  },
};
