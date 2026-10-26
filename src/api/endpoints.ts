export const API_ROOT =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://play-together.azurewebsites.net/api/play-together/v1';

export const API_URL = {
  accounts: `${API_ROOT}/accounts`,
  users: `${API_ROOT}/users`,
  orders: `${API_ROOT}/orders`,
  ranks: `${API_ROOT}/rank`,
  ratings: `${API_ROOT}/rating`,
  reports: `${API_ROOT}/reports`,
  images: `${API_ROOT}/images`,
  charities: `${API_ROOT}/charities`,
  searchHistories: `${API_ROOT}/search-histories`,
  games: `${API_ROOT}/games`,
  hobbies: `${API_ROOT}/hobbies`,
  dating: `${API_ROOT}/dating`,
  gameOfUser: `${API_ROOT}/games-of-user`,
  notification: `${API_ROOT}/notification`,
  chat: `${API_ROOT}/chats`,
  recommend: `${API_ROOT}/recommends`,
  email: `${API_ROOT}/email`,
  feedback: `${API_ROOT}/feedbacks`,
  momo: `${API_ROOT}/momo`,
} as const;
