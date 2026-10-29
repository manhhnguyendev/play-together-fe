export interface ApiResponse<T> {
  content: T;
  isSuccess: boolean;
  responseTime: string;
}

export interface ApiListResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  content: T[];
  isSuccess: boolean;
  responseTime: string;
}

export interface LoginModel {
  email: string;
  password: string;
}

export interface LoginGoogleModel {
  providerName: string;
  idToken: string;
}

export interface RegisterModel {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  city: string;
  dateOfBirth: string;
  gender: boolean;
  confirmEmail: boolean;
}

export interface TempRegisterModel {
  email: string;
  password: string;
  confirmPassword: string;
  confirmEmail: boolean;
}

export interface ResetPasswordModel {
  email: string;
  newPassword: string;
  confirmNewPassword: string;
  token: string;
}

export interface ChangePasswordModel {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ImageModel {
  id: string;
  imageLink: string;
}

export interface AddImageModel {
  userId: string;
  imageLink: string;
}

export interface UserBalanceModel {
  id: string;
  balance: number;
  activeBalance: number;
}

export interface UnActiveBalanceModel {
  id: string;
  money: number;
  isRelease: boolean;
  createdDate: string;
  dateActive: string;
}

export interface BehaviorModel {
  id: string;
  point: number;
  satisfiedPoint: number;
}

export interface UserModel {
  id: string;
  avatar: string;
  name: string;
  isPlayer: boolean;
  dateOfBirth: string;
  city: string;
  gender: boolean;
  email: string;
  images: ImageModel[];
  description: string;
  userBalance: UserBalanceModel;
  status: string;
  isActive: boolean;
  rate: number;
  numOfRate: number;
  numOfOrder: number;
  totalTimeOrder: number;
  numOfFinishOnTime: number;
  behaviorPoint: BehaviorModel;
}

export interface GetAllUserModel {
  id: string;
  avatar: string;
  name: string;
  isPlayer: boolean;
  rate: number;
  numOfRate: number;
  status: string;
  pricePerHour: number;
  createdDate: string;
}

export interface UserServiceModel {
  isPlayer: boolean;
  pricePerHour: number;
  maxHourHire: number;
}

export interface PlayerModel {
  id: string;
  avatar: string;
  name: string;
  isPlayer: boolean;
  dateOfBirth: string;
  city: string;
  gender: boolean;
  email: string;
  images: ImageModel[];
  description: string;
  rate: number;
  numOfRate: number;
  status: string;
  isActive: boolean;
  pricePerHour: number;
  maxHourHire: number;
  isBlockedByMe: boolean;
  canHire: boolean;
}

export interface MakeDonateModel {
  money: number;
  message: string;
}

export interface IsPlayerModel {
  isPlayer: boolean;
}

export interface ServiceUserModel {
  pricePerHour: number;
  maxHourHire: number;
}

export interface DepositModel {
  momoTransactionId: string;
  money: number;
}

export interface WithdrawModel {
  moneyWithdraw: number;
  phoneNumberMomo: string;
}

export interface GameModel {
  id: string;
  name: string;
}

export interface GamesModel {
  id: string;
  name: string;
  displayName: string;
  otherName: string;
}

export interface GameOfOrdersModel {
  id: string;
  gameId: string;
  game: GameModel;
}

export interface RankModel {
  id: string;
  no: number;
  name: string;
}

export interface GameOfUserModel {
  id: string;
  gameId: string;
  game: GamesModel;
  rankId: string;
  rank: RankModel | null;
}

export interface UpdateGameOfUserModel {
  rankId: string;
}

export interface CreateGameOfUserModel {
  gameId: string;
  rankId: string;
}

export interface HobbiesUserModel {
  id: string;
  name: string;
  avatar: string;
}

export interface HobbiesGameModel {
  name: string;
  displayName: string;
  otherName: string;
}

export interface HobbiesModel {
  id: string;
  user: HobbiesUserModel;
  game: HobbiesGameModel;
}

export interface CreateHobbiesModel {
  gameId: string;
}

export interface DeleteHobbiesModel {
  hobbyId: string;
}

export interface OnlineHourModel {
  id: string;
  fromHour: number;
  toHour: number;
  dayInWeek: number;
}

export interface CreateOnlineHourModel {
  fromHour: number;
  toHour: number;
  dayInWeek: number;
}

export interface UpdateOnlineHourModel {
  fromHour: number;
  toHour: number;
}

export interface OrderUserModel {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isActive: boolean;
  isPlayer: boolean;
  status: string;
}

export interface OrderModel {
  id: string;
  userId: string;
  user: OrderUserModel | null;
  toUserId: string;
  toUser: OrderUserModel | null;
  gameOfOrders: GameOfOrdersModel[];
  message: string;
  reason: string | null;
  totalTimes: number;
  totalPrices: number;
  finalPrices: number;
  status: string;
  timeStart: string;
  timeFinish: string;
  processExpired: string;
  percentSub: number;
}

export interface OrderDetailModel extends OrderModel {
  ratings: RatingOrderModel[] | null;
  reports: ReportOrderModel[] | null;
}

export interface CreateOrderModel {
  totalTimes: number;
  message: string;
  games: GameOrderModel[];
}

export interface GameOrderModel {
  gameId: string;
}

export interface AcceptOrderModel {
  isAccept: boolean;
}

export interface RejectOrderModel {
  isAccept: boolean;
  reason: string;
}

export interface CancelOrderModel {
  reason: string;
}

export interface FinishSoonOrderModel {
  reason: string;
}

export interface RatingModel {
  id: string;
  user: HobbiesUserModel | null;
  rate: number;
  createdDate: string;
  comment: string;
}

export interface RatingOrderModel {
  id: string;
  comment: string;
  rate: number;
  isViolate: boolean;
  isActive: boolean;
  createdDate: string;
}

export interface RatingCreateModel {
  rate: number;
  comment: string;
}

export interface ReportCommentModel {
  reason: string;
}

export interface ReportCreateModel {
  reportMessage: string;
}

export interface ReportOrderModel {
  id: string;
  reportMessage: string;
  createdDate: string;
}

export interface SearchHistoryModel {
  id: string;
  searchString: string;
}

export interface SystemFeedbackModel {
  id: string;
  title: string;
  typeOfFeedback: string;
  createdDate: string;
  isApprove: number;
}

export interface CreateFeedBacksModel {
  title: string;
  message: string;
  typeOfFeedback: string;
}

export interface SystemFeedbackDetailModel {
  title: string;
  message: string;
  typeOfFeedback: string;
  isApprove: number;
}

export interface TransactionModel {
  id: string;
  operation: string;
  money: number;
  typeOfTransaction: string;
  referenceTransactionId: string;
  createdDate: string;
}

export interface NotificationModel {
  id: string;
  title: string;
  body: string;
  createdDate: string;
  status: string;
}

export interface ChatModel {
  id: string;
  user: OrderUserModel | null;
  message: string;
  createdDate: string;
  isActive: boolean;
}

export interface SendMessageModel {
  message: string;
}

export interface CharityModel {
  id: string;
  organizationName: string;
  avatar: string;
  information: string;
  address: string;
  email: string;
  phone: string;
  balance: number;
  isActive: boolean;
  createdDate: string;
}

export interface MomoModel {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  mock: boolean;
}

export interface MomoCreateModel {
  userId: string;
  amount: number;
}

export interface ResultRecommendModel {
  score: string;
  player: GetAllUserModel;
}
