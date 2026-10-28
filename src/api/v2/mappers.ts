import type {
  ApiListResponse,
  ApiResponse,
  CharityModel,
  ChatModel,
  GameOfUserModel,
  GamesModel,
  GetAllUserModel,
  HobbiesModel,
  ImageModel,
  MomoModel,
  NotificationModel,
  OnlineHourModel,
  OrderModel,
  OrderUserModel,
  PlayerModel,
  RankModel,
  RatingModel,
  RatingOrderModel,
  ReportOrderModel,
  ResultRecommendModel,
  SearchHistoryModel,
  SystemFeedbackDetailModel,
  SystemFeedbackModel,
  TransactionModel,
  UnActiveBalanceModel,
  UserBalanceModel,
  UserModel,
  UserServiceModel,
} from '@/api/types';
import type {
  CharityView,
  ChatMessageView,
  FeedbackStatus,
  FeedbackType,
  GameView,
  LedgerEntry,
  LedgerType,
  MyFeedbackView,
  NotificationView,
  OrderStatus,
  OrderView,
  Paginated,
  RankView,
  RatingView,
  RecommendationView,
  ReportView,
  SearchHistoryItem,
  UserProfile,
  UserSkill,
  UserStatus,
  UserSummary,
  WalletSummary,
} from './types';

export const ZERO_DATE = '0001-01-01T00:00:00.000Z';

export const legacyResponse = <T>(content: T): ApiResponse<T> => ({
  content,
  isSuccess: true,
  responseTime: new Date().toISOString(),
});

export const legacyList = <W, T>(
  page: Paginated<W>,
  map: (item: W) => T,
): ApiListResponse<T> => {
  const { meta } = page;
  return {
    currentPage: meta.page,
    totalPages: meta.totalPages,
    pageSize: meta.pageSize,
    totalCount: meta.total,
    hasPrevious: meta.page > 1,
    hasNext: meta.page < meta.totalPages,
    content: page.items.map(map),
    isSuccess: true,
    responseTime: new Date().toISOString(),
  };
};

export const legacyArray = <W, T>(
  items: W[],
  map: (item: W) => T,
): ApiListResponse<T> => ({
  currentPage: 1,
  totalPages: 1,
  pageSize: items.length,
  totalCount: items.length,
  hasPrevious: false,
  hasNext: false,
  content: items.map(map),
  isSuccess: true,
  responseTime: new Date().toISOString(),
});

const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  BUSY: 'Hiring',
  MAINTAIN: 'Maintain',
};

export const toLegacyUserStatus = (status?: string | null): string =>
  (status && USER_STATUS_LABELS[status as UserStatus]) || status || '';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PROCESSING: 'Processing',
  ACCEPTED: 'Starting',
  COMPLETED: 'Finish',
  CANCELLED: 'Cancel',
  REJECTED: 'Reject',
  EXPIRED: 'OverTime',
  ENDED_EARLY_BY_HIRER: 'Hirer Finish Soon',
  ENDED_EARLY_BY_PLAYER: 'Player Finish Soon',
  INTERRUPTED: 'Interrupt',
};

const ORDER_STATUS_WIRE: Record<string, OrderStatus> = {
  Processing: 'PROCESSING',
  Starting: 'ACCEPTED',
  Finish: 'COMPLETED',
  Complete: 'COMPLETED',
  Cancel: 'CANCELLED',
  Reject: 'REJECTED',
  OverTime: 'EXPIRED',
  'Hirer Finish Soon': 'ENDED_EARLY_BY_HIRER',
  'Player Finish Soon': 'ENDED_EARLY_BY_PLAYER',
  Interrupt: 'INTERRUPTED',
};

export const toLegacyOrderStatus = (status: OrderStatus): string =>
  ORDER_STATUS_LABELS[status] ?? status;

export const toWireOrderStatus = (status?: string | null): OrderStatus | undefined => {
  if (!status) return undefined;
  return ORDER_STATUS_WIRE[status] ?? (status as OrderStatus);
};

export const toLegacyUserSummary = (user: UserSummary): GetAllUserModel => ({
  id: user.id,
  avatar: user.avatarUrl ?? '',
  name: user.name,
  isPlayer: user.isPlayer,
  rate: user.rating,
  numOfRate: user.ratingCount,
  status: toLegacyUserStatus(user.status),
  pricePerHour: user.pricePerHour,
  createdDate: user.createdAt,
});

export const toLegacyOrderUser = (user: UserSummary): OrderUserModel => ({
  id: user.id,
  name: user.name,
  email: user.email ?? '',
  avatar: user.avatarUrl ?? '',
  isActive: user.isActive,
  isPlayer: user.isPlayer,
  status: toLegacyUserStatus(user.status),
});

export const toLegacyUserBalance = (
  wallet: Pick<WalletSummary, 'walletId' | 'availableBalance' | 'pendingBalance'>,
): UserBalanceModel => ({
  id: wallet.walletId,
  balance: wallet.availableBalance + wallet.pendingBalance,
  activeBalance: wallet.availableBalance,
});

export const toLegacyUserProfile = (
  profile: UserProfile,
  wallet?: WalletSummary,
): UserModel => ({
  id: profile.id,
  avatar: profile.avatarUrl ?? '',
  name: profile.name,
  isPlayer: profile.isPlayer,
  dateOfBirth: profile.dateOfBirth ?? '',
  city: profile.city ?? '',
  gender: profile.gender === 'MALE',
  email: profile.email ?? '',
  images: profile.images.map<ImageModel>((image) => ({
    id: image.id,
    imageLink: image.url,
  })),
  description: profile.bio ?? '',
  userBalance: wallet
    ? toLegacyUserBalance(wallet)
    : { id: '', balance: 0, activeBalance: 0 },
  status: toLegacyUserStatus(profile.status),
  isActive: profile.isActive,
  rate: profile.rating,
  numOfRate: profile.ratingCount,
  numOfOrder: profile.ordersCount,
  totalTimeOrder: profile.totalHours,
  numOfFinishOnTime: profile.onTimeCount,
  behaviorPoint: {
    id: profile.id,
    point: profile.behavior.points,
    satisfiedPoint: profile.behavior.satisfaction,
  },
});

export const toLegacyPlayer = (profile: UserProfile): PlayerModel => ({
  id: profile.id,
  avatar: profile.avatarUrl ?? '',
  name: profile.name,
  isPlayer: profile.isPlayer,
  dateOfBirth: profile.dateOfBirth ?? '',
  city: profile.city ?? '',
  gender: profile.gender === 'MALE',
  email: profile.email ?? '',
  images: profile.images.map<ImageModel>((image) => ({
    id: image.id,
    imageLink: image.url,
  })),
  description: profile.bio ?? '',
  rate: profile.rating,
  numOfRate: profile.ratingCount,
  status: toLegacyUserStatus(profile.status),
  isActive: profile.isActive,
  pricePerHour: profile.pricePerHour,
  maxHourHire: profile.maxHoursPerHire,
});

export const toLegacyUserService = (profile: UserProfile): UserServiceModel => ({
  isPlayer: profile.isPlayer,
  pricePerHour: profile.pricePerHour,
  maxHourHire: profile.maxHoursPerHire,
});

export const toLegacyGame = (game: GameView): GamesModel => ({
  id: game.id,
  name: game.name,
  displayName: game.displayName ?? '',
  otherName: game.otherNames ?? '',
});

export const toLegacyRank = (rank: RankView): RankModel => ({
  id: rank.id,
  no: rank.no,
  name: rank.name,
});

export const toLegacyGameOfUser = (skill: UserSkill): GameOfUserModel => ({
  id: skill.id,
  gameId: skill.game.id,
  game: {
    id: skill.game.id,
    name: skill.game.name,
    displayName: skill.game.displayName ?? '',
    otherName: '',
  },
  rankId: skill.rank?.id ?? 'None',
  rank: skill.rank
    ? { id: skill.rank.id, no: skill.rank.no, name: skill.rank.name }
    : null,
});

export const toLegacyHobby = (
  hobby: { id: string; name: string; displayName: string | null },
  owner: Pick<UserSummary, 'id' | 'name' | 'avatarUrl'>,
): HobbiesModel => ({
  id: hobby.id,
  user: {
    id: owner.id,
    name: owner.name,
    avatar: owner.avatarUrl ?? '',
  },
  game: {
    name: hobby.name,
    displayName: hobby.displayName ?? '',
    otherName: '',
  },
});

export const toLegacyOnlineHour = (window: {
  id: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}): OnlineHourModel => ({
  id: window.id,
  fromHour: window.startMinute,
  toHour: window.endMinute,
  dayInWeek: window.dayOfWeek === 7 ? 8 : window.dayOfWeek + 1,
});

export const toLegacyOrder = (order: OrderView): OrderModel => {
  const feeRatio = order.feeBps / 10_000;
  const finalPrices =
    order.playerPayout ?? Math.round(order.totalPrice * (1 - feeRatio));

  return {
    id: order.id,
    userId: order.hirer.id,
    user: toLegacyOrderUser(order.hirer),
    toUserId: order.player.id,
    toUser: toLegacyOrderUser(order.player),
    gameOfOrders: order.games.map((game, index) => ({
      id: `${order.id}-${game.id}-${index}`,
      gameId: game.id,
      game: { id: game.id, name: game.name },
    })),
    message: order.message,
    reason: order.reason,
    totalTimes: order.hours,
    totalPrices: order.totalPrice,
    finalPrices,
    status: toLegacyOrderStatus(order.status),
    timeStart: order.startsAt ?? ZERO_DATE,
    timeFinish: order.scheduledEndAt ?? ZERO_DATE,
    processExpired: order.respondBy,
    percentSub: feeRatio,
  };
};

export const toLegacyOrderRating = (rating: RatingView): RatingOrderModel => ({
  id: rating.id,
  comment: rating.comment ?? '',
  rate: rating.rate,
  isViolate: rating.violationStatus !== 'NONE',
  isActive: rating.isActive,
  createdDate: rating.createdAt,
});

export const toLegacyRating = (rating: RatingView): RatingModel => ({
  id: rating.id,
  user: rating.rater
    ? {
        id: rating.rater.id,
        name: rating.rater.name,
        avatar: rating.rater.avatarUrl ?? '',
      }
    : null,
  rate: rating.rate,
  createdDate: rating.createdAt,
  comment: rating.comment ?? '',
});

export const toLegacyReportOrder = (report: ReportView): ReportOrderModel => ({
  id: report.id,
  reportMessage: report.message,
  createdDate: report.createdAt,
});

export const toLegacyCharity = (charity: CharityView): CharityModel => ({
  id: charity.id,
  organizationName: charity.organizationName,
  avatar: charity.avatarUrl ?? '',
  information: charity.information ?? '',
  address: charity.address ?? '',
  email: charity.email ?? '',
  phone: charity.phone ?? '',
  balance: charity.balance,
  isActive: charity.isActive,
  createdDate: charity.createdAt,
});

export const toLegacyNotification = (
  notification: NotificationView,
): NotificationModel => ({
  id: notification.id,
  title: notification.title,
  createdDate: notification.createdAt,
  status: notification.status,
});

export const toLegacyChat = (message: ChatMessageView): ChatModel => ({
  id: message.id,
  user: {
    id: message.senderId,
    name: '',
    email: '',
    avatar: '',
    isActive: true,
    isPlayer: false,
    status: '',
  },
  message: message.message,
  createdDate: message.createdAt,
  isActive: !message.isRecalled,
});

const LEDGER_TO_LEGACY_TYPE: Record<LedgerType, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdraw',
  ESCROW_HOLD: 'Order',
  ESCROW_RELEASE: 'Order',
  ESCROW_REFUND: 'Order - Refund',
  ORDER_EARNING: 'Order',
  PLATFORM_FEE: 'Order',
  DONATION: 'Donate',
  REPORT_REFUND: 'Report - Refund',
  MAINTENANCE_REFUND: 'Maintain - Refund',
  CHARITY_WITHDRAWAL: 'Withdraw',
  ADJUSTMENT: 'Report',
};

export const toLegacyTransaction = (entry: LedgerEntry): TransactionModel => ({
  id: entry.id,
  operation: entry.direction === 'CREDIT' ? 'Add' : 'Sub',
  money: Math.abs(entry.amount),
  typeOfTransaction:
    entry.type === 'ADJUSTMENT' && entry.direction === 'CREDIT'
      ? 'Adjustment'
      : LEDGER_TO_LEGACY_TYPE[entry.type],
  referenceTransactionId: entry.orderId ?? entry.transactionId,
  createdDate: entry.createdAt,
});

const FEEDBACK_TYPE_TO_LEGACY: Record<FeedbackType, string> = {
  BUG: 'SystemError',
  FEATURE: 'Suggest',
  COMPLAINT: 'Service',
  OTHER: 'Other',
};

const FEEDBACK_TYPE_TO_WIRE: Record<string, FeedbackType> = {
  SystemError: 'BUG',
  Suggest: 'FEATURE',
  Service: 'COMPLAINT',
  Other: 'OTHER',
};

export const toWireFeedbackType = (type: string): FeedbackType =>
  FEEDBACK_TYPE_TO_WIRE[type] ?? 'OTHER';

export const feedbackApproval = (status: FeedbackStatus): number =>
  status === 'APPROVED' ? 1 : status === 'REJECTED' ? 0 : -1;

export const toLegacyFeedback = (feedback: MyFeedbackView): SystemFeedbackModel => ({
  id: feedback.id,
  title: feedback.title,
  typeOfFeedback: FEEDBACK_TYPE_TO_LEGACY[feedback.type] ?? feedback.type,
  createdDate: feedback.createdAt,
  isApprove: feedbackApproval(feedback.status),
});

export const toLegacyFeedbackDetail = (
  feedback: MyFeedbackView,
): SystemFeedbackDetailModel => ({
  title: feedback.title,
  message: feedback.message,
  typeOfFeedback: FEEDBACK_TYPE_TO_LEGACY[feedback.type] ?? feedback.type,
  isApprove: feedbackApproval(feedback.status),
});

export const toLegacySearchHistory = (
  item: SearchHistoryItem,
): SearchHistoryModel => ({
  id: item.id,
  searchString: item.query,
});

export const toLegacyRecommendation = (
  recommendation: RecommendationView,
): ResultRecommendModel => ({
  score: String(recommendation.score),
  player: toLegacyUserSummary(recommendation.user),
});

export const toLegacyMomo = (deposit: {
  id: string;
  amount: number;
  paymentUrl: string;
}): MomoModel => ({
  partnerCode: 'MOMO',
  orderId: deposit.id,
  requestId: deposit.id,
  amount: deposit.amount,
  responseTime: Date.now(),
  message: '',
  resultCode: 0,
  payUrl: deposit.paymentUrl,
});

export const toLegacyUnActiveBalance = (
  credit: WalletSummary['pendingCredits'][number],
): UnActiveBalanceModel => ({
  id: credit.id,
  money: credit.amount,
  isRelease: false,
  createdDate: '',
  dateActive: credit.availableAt,
});
