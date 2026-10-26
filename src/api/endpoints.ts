export const API_ROOT =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v2';

export const API_URL = {
  auth: `${API_ROOT}/auth`,
  users: `${API_ROOT}/users`,
  orders: `${API_ROOT}/orders`,
  wallet: `${API_ROOT}/wallet`,
  games: `${API_ROOT}/games`,
  charities: `${API_ROOT}/charities`,
  notifications: `${API_ROOT}/notifications`,
  chats: `${API_ROOT}/chats`,
  feedback: `${API_ROOT}/feedback`,
  searchHistory: `${API_ROOT}/search-history`,
  recommendations: `${API_ROOT}/recommendations`,
  ratings: `${API_ROOT}/ratings`,
  reports: `${API_ROOT}/reports`,
} as const;
