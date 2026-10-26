const ROOT =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://play-together.azurewebsites.net/api/play-together/v1';

export const API_URL = {
  accounts: `${ROOT}/accounts`,
  users: `${ROOT}/users`,
  orders: `${ROOT}/orders`,
  ranks: `${ROOT}/rank`,
  ratings: `${ROOT}/rating`,
  reports: `${ROOT}/reports`,
  images: `${ROOT}/images`,
  charities: `${ROOT}/charities`,
  searchHistories: `${ROOT}/search-histories`,
  games: `${ROOT}/games`,
  hobbies: `${ROOT}/hobbies`,
  dating: `${ROOT}/dating`,
  gameOfUser: `${ROOT}/games-of-user`,
  notification: `${ROOT}/notification`,
  chat: `${ROOT}/chats`,
  recommend: `${ROOT}/recommends`,
  email: `${ROOT}/email`,
  feedback: `${ROOT}/feedbacks`,
  momo: `${ROOT}/momo`,
} as const;
