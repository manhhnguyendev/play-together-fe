export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  code?: string;
  detail?: string;
  instance?: string;
  traceId?: string;
  message?: string;
  errors?: Record<string, string[]>;
  details?: { errors?: string[]; constraint?: string };
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'MAINTAIN';
export type PlayerSort =
  | 'ranking'
  | 'rating'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'name';

export interface UserSummary {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string | null;
  city: string | null;
  gender: Gender;
  bio: string | null;
  status: UserStatus;
  isActive: boolean;
  isPlayer: boolean;
  pricePerHour: number;
  maxHoursPerHire: number;
  rating: number;
  ratingCount: number;
  ordersCount: number;
  completedOrdersCount: number;
  onTimeCount: number;
  totalHours: number;
  rankingPoints: number;
  createdAt: string;
}

export interface UserSkill {
  id: string;
  game: { id: string; name: string; displayName: string | null };
  rank: { id: string; no: number; name: string } | null;
}

export interface UserHobby {
  id: string;
  name: string;
  displayName: string | null;
}

export interface UserImage {
  id: string;
  url: string;
  createdAt: string;
}

export interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface UserProfile extends UserSummary {
  dateOfBirth: string | null;
  behavior: { points: number; satisfaction: number };
  skills: UserSkill[];
  hobbies: UserHobby[];
  images: UserImage[];
  availability: AvailabilityWindow[];
  isBlockedByMe: boolean;
  canHire: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string;
}

export interface AuthResponse extends TokenPair {
  user: UserSummary;
}

export type OtpPurpose = 'REGISTER' | 'PASSWORD_RESET';

export interface RequestOtpResponse {
  message: string;
  expiresInSeconds: number;
  devCode?: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  resetToken?: string;
}

export type OrderStatus =
  | 'PROCESSING'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ENDED_EARLY_BY_HIRER'
  | 'ENDED_EARLY_BY_PLAYER'
  | 'INTERRUPTED';

export interface OrderGame {
  id: string;
  name: string;
  displayName: string | null;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  hours: number;
  hourlyRate: number;
  totalPrice: number;
  feeBps: number;
  playerPayout: number | null;
  message: string;
  reason: string | null;
  respondBy: string;
  startsAt: string | null;
  scheduledEndAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hirer: UserSummary;
  player: UserSummary;
  games: OrderGame[];
  canRate: boolean;
  hasRated: boolean;
  escrowStatus: 'NONE' | 'HELD' | 'SETTLED' | 'REFUNDED' | 'PARTIALLY_SETTLED';
}

export interface WalletSummary {
  walletId: string;
  availableBalance: number;
  pendingBalance: number;
  pendingCredits: {
    id: string;
    orderId: string;
    amount: number;
    availableAt: string;
  }[];
}

export type LedgerType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'ESCROW_HOLD'
  | 'ESCROW_RELEASE'
  | 'ESCROW_REFUND'
  | 'ORDER_EARNING'
  | 'PLATFORM_FEE'
  | 'DONATION'
  | 'REPORT_REFUND'
  | 'MAINTENANCE_REFUND'
  | 'CHARITY_WITHDRAWAL'
  | 'ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  type: LedgerType;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  note: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface DepositView {
  id: string;
  amount: number;
  status: string;
  paymentUrl: string;
  mock: boolean;
}

export interface WithdrawalView {
  id: string;
  status: string;
}

export interface GameView {
  id: string;
  name: string;
  displayName: string | null;
  otherNames: string | null;
  types?: { id: string; name: string; shortName: string | null }[];
}

export interface RankView {
  id: string;
  no: number;
  name: string;
}

export interface CharityStats {
  raised: number;
  donations: number;
  donors: number;
}

export interface CharityView {
  id: string;
  userId: string;
  organizationName: string;
  avatarUrl: string | null;
  information: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: CharityStats;
  account: { id: string; email: string } | null;
}

export interface NotificationView {
  id: string;
  title: string;
  body: string;
  referenceUrl: string | null;
  status: 'UNREAD' | 'READ';
  createdAt: string;
  readAt: string | null;
}

export interface ChatMessageView {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRecalled: boolean;
  mine: boolean;
  createdAt: string;
}

export type FeedbackType = 'BUG' | 'FEATURE' | 'COMPLAINT' | 'OTHER';
export type FeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MyFeedbackView {
  id: string;
  title: string;
  message: string;
  type: FeedbackType;
  status: FeedbackStatus;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  createdAt: string;
}

export interface RecommendationView {
  user: UserSummary;
  score: number;
  matchedGames: { id: string; name: string }[];
  reason: string;
}

export interface RatingSummary {
  userId: string;
  average: number;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface RatingAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface RatingView {
  id: string;
  orderId: string;
  raterId: string;
  rateeId: string;
  rate: number;
  comment: string | null;
  isActive: boolean;
  violationStatus: 'NONE' | 'FLAGGED' | 'UPHELD' | 'DISMISSED';
  violationReason: string | null;
  rater: RatingAuthor | null;
  ratee: RatingAuthor | null;
  createdAt: string;
}

export interface ReportParty {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ReportView {
  id: string;
  orderId: string;
  reporter: ReportParty | null;
  target: ReportParty | null;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface PlayerSearchQuery {
  q?: string;
  gameId?: string;
  hobbyId?: string;
  genders?: Gender[];
  initial?: string;
  status?: 'ONLINE' | 'OFFLINE';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: PlayerSort;
  page?: number;
  pageSize?: number;
}

export interface HotSearchItem {
  query: string;
  searches: number;
}

export interface FavoriteGameItem {
  id: string;
  name: string;
  displayName: string | null;
  favoritedAt: string;
}

export interface MostFavoritedGame {
  id: string;
  name: string;
  displayName: string | null;
  favoriteCount: number;
}

export interface BlockedUserView {
  id: string;
  user: UserSummary;
  expiresAt: string | null;
}

export type BehaviorEvent =
  | 'RATING_RECEIVED'
  | 'RATING_REVOKED'
  | 'ORDER_REJECTED'
  | 'ORDER_EXPIRED'
  | 'ORDER_EARLY_END'
  | 'REPORT_APPROVED'
  | 'MANUAL_ADJUSTMENT';

export interface BehaviorHistoryItem {
  id: string;
  event: BehaviorEvent;
  operation: 'ADD' | 'SUB';
  pointType: 'POINTS' | 'SATISFACTION';
  amount: number;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
}

export interface OrderHistoryItem {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface EarningsSummary {
  today: number;
  thisMonth: number;
  total: number;
}

export interface ReleasePendingCreditsResult {
  released: number;
}
