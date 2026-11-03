/**
 * The API speaks English in its `problem+json` `detail` (it is a debug string
 * for developers and the admin log); the app is Vietnamese. Every error the
 * mobile client can receive is keyed here so a toast never shows English.
 */
const VIETNAMESE_MESSAGES: Record<string, string> = {
  // Auth & account
  unauthorized: 'Bạn chưa đăng nhập.',
  missing_token: 'Phiên đăng nhập không hợp lệ.',
  invalid_token: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  invalid_refresh_token: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  invalid_credentials: 'Email hoặc mật khẩu không đúng.',
  account_disabled: 'Tài khoản của bạn đã bị khóa.',
  account_maintained: 'Tài khoản đang ở chế độ bảo trì.',
  email_taken: 'Email này đã được sử dụng.',
  email_not_verified: 'Email chưa được xác minh.',
  invalid_otp: 'Mã xác thực không đúng.',
  otp_expired: 'Mã xác thực đã hết hạn, vui lòng lấy mã mới.',
  too_many_otp_requests: 'Bạn đã yêu cầu mã quá nhiều lần, thử lại sau.',
  password_mismatch: 'Mật khẩu xác nhận không khớp.',
  invalid_reset_token: 'Liên kết đặt lại mật khẩu không còn hiệu lực.',
  email_delivery_failed: 'Không gửi được email, vui lòng thử lại sau.',
  google_not_configured: 'Đăng nhập bằng Google hiện chưa khả dụng.',
  invalid_google_token: 'Không thể xác thực tài khoản Google.',
  user_not_found: 'Không tìm thấy người dùng.',
  user_not_active: 'Tài khoản này đã bị khóa.',
  maintenance_mode: 'Ứng dụng đang tạm ngừng để bảo trì.',

  // Player mode & hiring
  player_mode_disabled: 'Bạn đang ở chế độ nhận thuê. Tắt chế độ này trước khi đi thuê người khác.',
  player_mode_requirements: 'Cần có kỹ năng và mức giá trước khi bật nhận thuê.',
  player_unavailable: 'Người chơi không ở trạng thái sẵn sàng ngay lúc này.',
  active_order_exists: 'Bạn còn lượt thuê chưa hoàn tất, hãy kết thúc trước khi ngừng nhận thuê.',
  self_hire_not_allowed: 'Bạn không thể thuê chính mình.',
  hours_out_of_range: 'Số giờ thuê vượt ngoài khoảng cho phép.',
  game_not_in_player_skills: 'Người chơi không có kỹ năng với tựa game này.',
  duplicate_games: 'Danh sách game bị trùng.',
  slot_outside_availability: 'Khung giờ này nằm ngoài lịch hẹn của người chơi.',
  slot_conflict: 'Khung giờ vừa được đặt, bạn chọn giờ khác nhé.',
  skill_not_found: 'Không tìm thấy kỹ năng.',
  rank_not_found: 'Không tìm thấy xếp hạng.',
  game_not_found: 'Không tìm thấy game.',
  availability_overlap: 'Khung giờ này trùng với lịch đã có.',
  availability_not_found: 'Không tìm thấy khung giờ.',

  // Money
  insufficient_balance: 'Số dư không đủ. Vui lòng nạp thêm tiền.',
  deposit_already_settled: 'Giao dịch nạp này đã được ghi nhận.',
  withdrawal_not_found: 'Không tìm thấy yêu cầu rút tiền.',
  pending_withdrawal_exists: 'Bạn đang có yêu cầu rút tiền chờ xử lý.',
  donation_too_small: 'Số tiền ủng hộ quá nhỏ.',
  charity_not_found: 'Không tìm thấy quỹ.',
  charity_inactive: 'Quỹ này đang tạm dừng nhận ủng hộ.',

  // Orders
  order_not_found: 'Không tìm thấy lượt thuê.',
  order_not_participant: 'Bạn không tham gia lượt thuê này.',
  invalid_order_state: 'Lượt thuê không ở trạng thái cho phép thao tác này.',
  early_end_too_soon: 'Lượt thuê mới bắt đầu, chưa thể kết thúc sớm.',
  order_not_finished: 'Lượt thuê chưa kết thúc.',
  feedback_window_closed: 'Thời gian đánh giá đã kết thúc.',

  // Ratings, reports, chat
  already_rated: 'Bạn đã đánh giá lượt thuê này.',
  rating_blocked_by_report: 'Bạn đã tố cáo lượt thuê này nên không đánh giá được nữa.',
  self_rating_not_allowed: 'Bạn không thể đánh giá chính mình.',
  rating_not_found: 'Không tìm thấy đánh giá.',
  violation_not_allowed: 'Không thể báo cáo lượt thuê này.',
  already_reported: 'Bạn đã báo cáo cho nội dung này.',
  report_not_found: 'Không tìm thấy báo cáo.',
  already_resolved: 'Báo cáo đã được xử lý.',
  refund_exceeds_payout: 'Số tiền hoàn vượt quá phần thưởng của lượt thuê.',
  feedback_not_found: 'Không tìm thấy phản hồi.',
  notification_not_found: 'Không tìm thấy thông báo.',
  message_blocked: 'Bạn không thể nhắn cho người dùng này.',
  cannot_message_self: 'Bạn không thể nhắn cho chính mình.',
  message_not_found: 'Không tìm thấy tin nhắn.',

  // Generic
  validation_failed: 'Dữ liệu bạn nhập chưa hợp lệ, vui lòng kiểm tra lại.',
  not_found: 'Không tìm thấy dữ liệu.',
  conflict: 'Thao tác xung đột với trạng thái hiện tại.',
  constraint_violation: 'Dữ liệu không hợp lệ với ràng buộc hệ thống.',
  internal_error: 'Có lỗi xảy ra, vui lòng thử lại.',
};

export const vietnameseMessageFor = (code?: string): string | undefined =>
  code ? VIETNAMESE_MESSAGES[code] : undefined;
