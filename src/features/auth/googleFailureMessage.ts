/**
 * Turns a failed Google auth into a sentence that says what to fix.
 *
 * The shape is structural on purpose: importing `expo-auth-session` here would pull Expo's
 * native module graph into a file the jest harness runs on plain Node.
 */
export interface GoogleFailureSignals {
  code?: string | null;
  description?: string | null;
}

const GENERIC = 'Đăng nhập Google thất bại.';

/** Toasts auto-dismiss, so Google's own English paragraph has to stay short. */
const DESCRIPTION_LIMIT = 140;

/**
 * Keyed by the OAuth error codes Google actually returns for this app's setup mistakes —
 * a wrong client type or an unregistered redirect URI both failed silently as
 * "Đăng nhập Google thất bại" until now.
 */
const EXPLANATIONS: Record<string, string> = {
  access_denied: 'Bạn đã hủy trên màn hình Google.',
  redirect_uri_mismatch:
    'Google không nhận URL chuyển hướng của app. Thêm đúng URL đó vào mục Redirect URI của OAuth client trên Google Cloud.',
  origin_mismatch:
    'Origin của app chưa được khai báo trên Google Cloud (Authorized JavaScript origins hoặc Redirect URI).',
  unauthorized_client:
    'Client ID này không được dùng cho luồng xác thực của app. Trình duyệt cần Web client; bản dựng trên máy cần client Android/iOS tương ứng.',
  invalid_client:
    'Google từ chối client ID. Kiểm tra EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID của app và GOOGLE_CLIENT_ID của API là cùng một client.',
  unsupported_response_type:
    'Client này không được phép trả id_token. Kiểm tra loại client trên Google Cloud; trên máy thật cần lib Google native.',
  invalid_grant: 'Mã xác thực đã hết hạn hoặc dùng sai. Thử đăng nhập Google lại.',
  interaction_required: 'Google cần bạn thao tác thêm. Mở lại và hoàn tất màn hình đăng nhập.',
  login_required: 'Google chưa nhận diện tài khoản. Mở lại và đăng nhập.',
  idpiframe_initialization_failed:
    'Google không nạp được màn đăng nhập trong trình duyệt này. Kiểm tra origin hiện tại đã được phép trên Google Cloud.',
  popup_closed_by_user: 'Cửa sổ Google đã đóng trước khi hoàn tất.',
};

const tidy = (value: string): string => value.replace(/\s+/g, ' ').trim();

const clip = (value: string): string =>
  value.length <= DESCRIPTION_LIMIT
    ? value
    : `${value.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…`;

export function googleFailureMessage({
  code,
  description,
}: GoogleFailureSignals): string {
  const normalizedCode = code ? tidy(code) : '';
  const explanation = EXPLANATIONS[normalizedCode];
  if (explanation) return explanation;

  const detail = tidy(description ?? '');
  if (normalizedCode) {
    return detail
      ? `${GENERIC} (${normalizedCode}) — ${clip(detail)}`
      : `${GENERIC} (${normalizedCode})`;
  }
  return detail ? `${GENERIC} — ${clip(detail)}` : GENERIC;
}
